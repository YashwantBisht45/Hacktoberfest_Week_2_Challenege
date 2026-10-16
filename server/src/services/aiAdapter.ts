import { SYSTEM_PROMPT, buildAnalysisPrompt } from './promptTemplates';
import { RawModelOutput, RawModelOutputSchema } from '../types/analysis';

export interface AIProviderConfig {
  baseUrl: string;
  model: string;
  timeoutMs?: number;
}

export interface AIModelAdapter {
  name: string;
  model: string;
  isAvailable(): Promise<boolean>;
  generateAnalysis(agreement: string, clientRequest: string): Promise<RawModelOutput>;
}

/**
 * Returns true when the Ollama error body signals a repetition / token-limit abort.
 * Ollama returns HTTP 500 with a JSON body: {"error":"prediction aborted, token repeat limit reached"}
 */
function isRepetitionError(errorText: string): boolean {
  const lower = errorText.toLowerCase();
  return (
    lower.includes('token repeat limit') ||
    lower.includes('prediction aborted') ||
    lower.includes('repeat limit reached')
  );
}

/** Type-guard: error tagged by _generate when a repetition abort is detected */
function isRepetitionErrorObj(err: unknown): boolean {
  return err instanceof Error && (err as Error & { isRepetitionError?: boolean }).isRepetitionError === true;
}

/**
 * Ollama AI Adapter
 * Communicates with local Ollama daemon (e.g. running Gemma 2 / 2b / 9b)
 */
export class OllamaAdapter implements AIModelAdapter {
  public name = 'ollama';
  public baseUrl: string;
  public model: string;
  private timeoutMs: number;

  constructor(config: AIProviderConfig) {
    // Normalize localhost to 127.0.0.1 to avoid Windows Node.js 18+ IPv6 (::1) ECONNREFUSED issues
    let url = config.baseUrl.replace(/\/+$/, '');
    if (url.includes('://localhost:')) {
      url = url.replace('://localhost:', '://127.0.0.1:');
    } else if (url === 'http://localhost' || url === 'https://localhost') {
      url = url.replace('localhost', '127.0.0.1');
    }
    this.baseUrl = url;
    this.model = config.model;
    this.timeoutMs = config.timeoutMs || 120000; // 120s timeout for models
  }

  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: controller.signal,
      });
      clearTimeout(id);

      if (!res.ok) return false;
      const data = (await res.json()) as { models?: Array<{ name: string }> };
      // Check if server is up
      return Array.isArray(data.models);
    } catch {
      return false;
    }
  }

  /**
   * Execute a single Ollama generation request.
   * Throws on HTTP error, timeout, or repetition abort.
   */
  private async _generate(prompt: string, signal: AbortSignal): Promise<RawModelOutput> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        prompt,
        system: SYSTEM_PROMPT,
        format: 'json',
        stream: false,
        options: {
          temperature: 0.1,     // low temperature for deterministic contract reasoning
          top_p: 0.9,
          num_predict: 1024,    // cap output tokens — prevents runaway generation on gemma2:2b
          repeat_penalty: 1.15, // slightly above Ollama default (1.1) to suppress loops
          repeat_last_n: 64,    // token look-back window for repeat detection
        },
      }),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      // Detect Ollama's token-repeat-limit error and surface it clearly
      if (isRepetitionError(errorText)) {
        throw Object.assign(
          new Error(
            'Model generation aborted: token repetition limit reached. ' +
              'Try shortening the agreement or request text.'
          ),
          { isRepetitionError: true }
        );
      }
      throw new Error(
        `Ollama service responded with HTTP status ${response.status}: ${errorText.slice(0, 150)}`
      );
    }

    const jsonResponse = (await response.json()) as { response?: string };
    if (!jsonResponse || typeof jsonResponse.response !== 'string') {
      throw new Error('Ollama returned empty or malformed completion payload');
    }

    return parseAndValidateModelOutput(jsonResponse.response);
  }

  async generateAnalysis(agreement: string, clientRequest: string): Promise<RawModelOutput> {
    const prompt = buildAnalysisPrompt(agreement, clientRequest);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      try {
        // First attempt
        return await this._generate(prompt, controller.signal);
      } catch (firstErr: unknown) {
        if (isRepetitionErrorObj(firstErr)) {
          // One controlled retry — same prompt, same controller
          console.warn('[ScopeGuard AI] Ollama repetition error on first attempt — retrying once.');
          try {
            return await this._generate(prompt, controller.signal);
          } catch {
            // Both attempts failed; surface a user-friendly error
            throw new Error(
              'AI analysis failed after retry: the local model could not complete generation. ' +
                'Try shortening the agreement or request text, or restart Ollama.'
            );
          }
        }
        throw firstErr;
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`Inference timed out after ${this.timeoutMs / 1000} seconds.`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Compatible Hosted Endpoint Adapter (OpenAI-compatible format for hosted Gemma/open-weight models)
 */
export class HostedOpenWeightAdapter implements AIModelAdapter {
  public name = 'hosted-open-weight';
  public baseUrl: string;
  public model: string;
  private apiKey?: string;
  private timeoutMs: number;

  constructor(config: AIProviderConfig & { apiKey?: string }) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.model = config.model;
    this.apiKey = config.apiKey?.trim();
    this.timeoutMs = config.timeoutMs || 120000;
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        signal: controller.signal,
      });
      clearTimeout(id);
      return res.ok;
    } catch {
      return false;
    }
  }

  async generateAnalysis(agreement: string, clientRequest: string): Promise<RawModelOutput> {
    if (!this.apiKey) {
      throw new Error(
        'Hosted AI provider API key is not configured. Please set the HOSTED_AI_API_KEY environment variable on the server.'
      );
    }

    const prompt = buildAnalysisPrompt(agreement, clientRequest);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      let response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });

      // If provider rejects programmatic json_object mode, fall back to prompt-guided JSON
      if (!response.ok && response.status === 400) {
        const errorPeek = await response.text().catch(() => '');
        if (
          errorPeek.toLowerCase().includes('response_format') ||
          errorPeek.toLowerCase().includes('json mode') ||
          errorPeek.toLowerCase().includes('json_object') ||
          errorPeek.toLowerCase().includes('schema')
        ) {
          response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
              model: this.model,
              messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: prompt },
              ],
              temperature: 0.1,
            }),
            signal: controller.signal,
          });
        } else {
          const sanitizedDetail = errorPeek ? `: ${errorPeek.slice(0, 120)}` : '';
          throw new Error(`Hosted AI provider responded with status 400${sanitizedDetail}`);
        }
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Hosted AI provider authentication failed (HTTP 401). Invalid or expired API key.');
        }
        if (response.status === 429) {
          throw new Error('Hosted AI provider rate limit or quota exceeded (HTTP 429). Please try again shortly.');
        }
        if (response.status === 502 || response.status === 503 || response.status === 504) {
          throw new Error(`Hosted AI provider temporarily unavailable (HTTP ${response.status}). Service may be experiencing high demand.`);
        }
        const errorText = await response.text().catch(() => '');
        let sanitizedDetail = '';
        try {
          const parsed = JSON.parse(errorText) as { error?: { message?: string } };
          if (parsed.error?.message) {
            sanitizedDetail = `: ${parsed.error.message.slice(0, 120)}`;
          }
        } catch {
          if (errorText) {
            sanitizedDetail = `: ${errorText.slice(0, 100)}`;
          }
        }
        throw new Error(`Hosted AI provider responded with status ${response.status}${sanitizedDetail}`);
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = data?.choices?.[0]?.message?.content;
      if (!text) {
        throw new Error('Hosted endpoint returned an empty completion response.');
      }

      return parseAndValidateModelOutput(text);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`Hosted AI inference timed out after ${this.timeoutMs / 1000} seconds.`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Parse raw text into structured JSON and validate against RawModelOutputSchema
 */
export function parseAndValidateModelOutput(rawText: string): RawModelOutput {
  let cleaned = rawText.trim();

  // Strip markdown fences if emitted despite instructions
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }

  // Find first { and last } if preamble or postamble text exists
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Model produced malformed or non-JSON output.');
  }

  const validated = RawModelOutputSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(
      `Model output schema validation failed: ${validated.error.issues.map((i) => i.message).join(', ')}`
    );
  }

  return validated.data;
}

/**
 * Factory to create configured AI adapter based on environment
 */
export function createAIAdapter(): AIModelAdapter {
  const provider = (process.env.AI_PROVIDER || 'ollama').toLowerCase();
  const model = process.env.OLLAMA_MODEL || 'gemma2:2b';
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

  if (provider === 'hosted' || provider === 'openai-compatible') {
    return new HostedOpenWeightAdapter({
      baseUrl: process.env.HOSTED_AI_BASE_URL || 'https://openrouter.ai/api/v1',
      model: process.env.HOSTED_AI_MODEL || 'google/gemma-2-9b-it',
      apiKey: process.env.HOSTED_AI_API_KEY,
      timeoutMs: process.env.AI_TIMEOUT_MS ? parseInt(process.env.AI_TIMEOUT_MS, 10) : 120000,
    });
  }

  return new OllamaAdapter({
    baseUrl,
    model,
    timeoutMs: process.env.AI_TIMEOUT_MS ? parseInt(process.env.AI_TIMEOUT_MS, 10) : 120000,
  });
}
