import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { OllamaAdapter, HostedOpenWeightAdapter, createAIAdapter } from './aiAdapter';
import { runScopeAnalysis } from './analysisPipeline';
import { parseAllowedOrigins } from '../utils/cors';

describe('Production API Base URL Selection (Frontend Logic)', () => {
  // Pure replica of resolveApiBaseUrl and getApiEndpoint from client/src/config/api.ts
  function resolveApiBaseUrl(envValue?: string): string {
    if (!envValue) return '';
    return envValue.trim().replace(/\/+$/, '');
  }

  function getApiEndpoint(endpoint: string, baseUrl: string = ''): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return baseUrl ? `${baseUrl}${cleanEndpoint}` : cleanEndpoint;
  }

  it('defaults to relative endpoint when VITE_API_BASE_URL is empty or undefined (Local Dev)', () => {
    expect(resolveApiBaseUrl(undefined)).toBe('');
    expect(resolveApiBaseUrl('')).toBe('');
    expect(resolveApiBaseUrl('   ')).toBe('');
    expect(getApiEndpoint('/api/health', '')).toBe('/api/health');
    expect(getApiEndpoint('/api/analyze', '')).toBe('/api/analyze');
  });

  it('prepends clean base URL when VITE_API_BASE_URL is set (Production Render Static Site)', () => {
    const prodBase = resolveApiBaseUrl('https://scopeguard-api.onrender.com');
    expect(prodBase).toBe('https://scopeguard-api.onrender.com');
    expect(getApiEndpoint('/api/health', prodBase)).toBe('https://scopeguard-api.onrender.com/api/health');
    expect(getApiEndpoint('/api/analyze', prodBase)).toBe('https://scopeguard-api.onrender.com/api/analyze');
  });

  it('strips trailing slashes from VITE_API_BASE_URL without double slashes', () => {
    const prodBaseWithSlash = resolveApiBaseUrl('https://scopeguard-api.onrender.com///');
    expect(prodBaseWithSlash).toBe('https://scopeguard-api.onrender.com');
    expect(getApiEndpoint('/api/health', prodBaseWithSlash)).toBe('https://scopeguard-api.onrender.com/api/health');
    expect(getApiEndpoint('api/analyze', prodBaseWithSlash)).toBe('https://scopeguard-api.onrender.com/api/analyze');
  });
});

describe('Production CORS Policy Behavior', () => {
  it('parses single and comma-separated client origins cleanly', () => {
    expect(parseAllowedOrigins(undefined)).toEqual(['http://localhost:5173']);
    expect(parseAllowedOrigins('https://scopeguard-ui.onrender.com')).toEqual(['https://scopeguard-ui.onrender.com']);
    expect(
      parseAllowedOrigins('http://localhost:5173, https://scopeguard-ui.onrender.com/, https://custom-domain.com')
    ).toEqual(['http://localhost:5173', 'https://scopeguard-ui.onrender.com', 'https://custom-domain.com']);
  });

  function createCorsTestApp(allowedOriginsStr: string) {
    const app = express();
    const allowed = parseAllowedOrigins(allowedOriginsStr);

    app.use(
      cors({
        origin: (origin, callback) => {
          if (!origin) return callback(null, true);
          const normalized = origin.replace(/\/+$/, '');
          if (allowed.includes('*') || allowed.includes(normalized)) {
            return callback(null, true);
          }
          return callback(new Error(`CORS policy violation: Origin ${origin} not permitted`));
        },
      })
    );

    app.get('/api/test', (_req, res) => {
      res.json({ ok: true });
    });

    // Error handler
    app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      if (err.message.includes('CORS policy violation')) {
        res.status(403).json({ status: 'error', message: 'Access denied: origin not permitted by CORS policy.' });
        return;
      }
      res.status(500).json({ status: 'error', message: err.message });
    });

    return app;
  }

  it('permits requests from the configured production frontend origin', async () => {
    const app = createCorsTestApp('https://scopeguard-ui.onrender.com');
    const res = await request(app)
      .get('/api/test')
      .set('Origin', 'https://scopeguard-ui.onrender.com');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('https://scopeguard-ui.onrender.com');
  });

  it('rejects requests from unauthorized third-party origins with HTTP 403', async () => {
    const app = createCorsTestApp('https://scopeguard-ui.onrender.com');
    const res = await request(app)
      .get('/api/test')
      .set('Origin', 'https://malicious-site.example.com');

    expect(res.status).toBe(403);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toContain('Access denied');
  });

  it('permits requests without Origin header (e.g. server-to-server health probes)', async () => {
    const app = createCorsTestApp('https://scopeguard-ui.onrender.com');
    const res = await request(app).get('/api/test');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe('Hosted Open-Weight Provider Security & Error Handling', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('reports isAvailable as false when HOSTED_AI_API_KEY is missing', async () => {
    const adapter = new HostedOpenWeightAdapter({
      baseUrl: 'https://api.groq.com/openai/v1',
      model: 'gemma2-9b-it',
      apiKey: undefined, // Missing API key
    });

    const available = await adapter.isAvailable();
    expect(available).toBe(false);
  });

  it('throws informative error without leaking secrets when generating analysis without API key', async () => {
    const adapter = new HostedOpenWeightAdapter({
      baseUrl: 'https://api.groq.com/openai/v1',
      model: 'gemma2-9b-it',
      apiKey: '',
    });

    await expect(adapter.generateAnalysis('Agreement text', 'Client request')).rejects.toThrow(
      /Hosted AI provider API key is not configured/
    );
  });

  it('handles HTTP 401 authentication errors safely without exposing keys', async () => {
    const adapter = new HostedOpenWeightAdapter({
      baseUrl: 'https://api.groq.com/openai/v1',
      model: 'gemma2-9b-it',
      apiKey: 'invalid_key',
    });

    // Mock global fetch to return 401
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ error: { message: 'Invalid API Key provided' } }),
    } as unknown as Response);

    await expect(adapter.generateAnalysis('Agreement text', 'Client request')).rejects.toThrow(
      /authentication failed \(HTTP 401\)/
    );
  });

  it('handles HTTP 429 rate limit errors with actionable messaging', async () => {
    const adapter = new HostedOpenWeightAdapter({
      baseUrl: 'https://api.groq.com/openai/v1',
      model: 'gemma2-9b-it',
      apiKey: 'valid_key',
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => JSON.stringify({ error: { message: 'Rate limit exceeded' } }),
    } as unknown as Response);

    await expect(adapter.generateAnalysis('Agreement text', 'Client request')).rejects.toThrow(
      /rate limit or quota exceeded \(HTTP 429\)/
    );
  });

  it('handles HTTP 503 provider temporary outages cleanly', async () => {
    const adapter = new HostedOpenWeightAdapter({
      baseUrl: 'https://api.groq.com/openai/v1',
      model: 'gemma2-9b-it',
      apiKey: 'valid_key',
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => 'Service Unavailable',
    } as unknown as Response);

    await expect(adapter.generateAnalysis('Agreement text', 'Client request')).rejects.toThrow(
      /temporarily unavailable \(HTTP 503\)/
    );
  });

  it('handles hosted model inference timeout (AbortError) with safe message', async () => {
    const adapter = new HostedOpenWeightAdapter({
      baseUrl: 'https://openrouter.ai/api/v1',
      model: 'google/gemma-2-9b-it',
      apiKey: 'valid_key',
      timeoutMs: 1000,
    });

    global.fetch = vi.fn().mockImplementation(() => {
      const err = new Error('The operation was aborted');
      err.name = 'AbortError';
      return Promise.reject(err);
    });

    await expect(adapter.generateAnalysis('Agreement text', 'Client request')).rejects.toThrow(
      /Hosted AI inference timed out after 1 seconds/
    );
  });

  it('retries without response_format when provider returns 400 complaining about json mode', async () => {
    const adapter = new HostedOpenWeightAdapter({
      baseUrl: 'https://openrouter.ai/api/v1',
      model: 'google/gemma-2-9b-it',
      apiKey: 'valid_key',
    });

    const mockSuccessResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              summary: 'Retried successfully without programmatic response_format',
              requests: [
                {
                  request: 'Add item',
                  classification: 'ALREADY_INCLUDED',
                  reasoning: 'Item is in agreement.',
                  evidence: [],
                  evidenceStrength: 'INSUFFICIENT',
                  uncertainty: 'None',
                },
              ],
              impact: { possibleWork: [], timelineConsiderations: [], unknowns: [] },
              clarificationQuestions: [],
              changeOrderDraft: 'Hello...',
            }),
          },
        },
      ],
    };

    // First fetch fails with 400 (response_format unsupported), second succeeds
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Error: response_format is not supported for this model',
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSuccessResponse,
      } as unknown as Response);

    const result = await adapter.generateAnalysis('Agreement text', 'Client request');
    expect(result.summary).toBe('Retried successfully without programmatic response_format');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});

describe('Local Ollama Mode Preservation', () => {
  it('normalizes localhost to 127.0.0.1 in OllamaAdapter constructor', () => {
    const adapter = new OllamaAdapter({
      baseUrl: 'http://localhost:11434',
      model: 'gemma2:2b',
    });

    expect(adapter.baseUrl).toBe('http://127.0.0.1:11434');
    expect(adapter.model).toBe('gemma2:2b');
    expect(adapter.name).toBe('ollama');
  });

  it('createAIAdapter factory selects Ollama by default', () => {
    const originalEnv = process.env.AI_PROVIDER;
    delete process.env.AI_PROVIDER;

    const adapter = createAIAdapter();
    expect(adapter.name).toBe('ollama');

    process.env.AI_PROVIDER = originalEnv;
  });

  it('createAIAdapter factory selects hosted adapter when AI_PROVIDER=hosted with OpenRouter defaults', () => {
    const originalEnv = process.env.AI_PROVIDER;
    const originalBaseUrl = process.env.HOSTED_AI_BASE_URL;
    const originalModel = process.env.HOSTED_AI_MODEL;

    process.env.AI_PROVIDER = 'hosted';
    delete process.env.HOSTED_AI_BASE_URL;
    delete process.env.HOSTED_AI_MODEL;

    const adapter = createAIAdapter();
    expect(adapter.name).toBe('hosted-open-weight');
    expect((adapter as HostedOpenWeightAdapter).baseUrl).toBe('https://openrouter.ai/api/v1');
    expect(adapter.model).toBe('google/gemma-2-9b-it');

    process.env.AI_PROVIDER = originalEnv;
    process.env.HOSTED_AI_BASE_URL = originalBaseUrl;
    process.env.HOSTED_AI_MODEL = originalModel;
  });
});

describe('Evidence Verification & Classification Pipeline Integrity', () => {
  it('maintains verified vs unverified quotation classification through pipeline', async () => {
    const sampleAgreement = 'Deliverables: 5 Shopify page templates. Excluded: Native mobile app.';
    const sampleRequest = 'Please create an iOS native app.';

    const mockAdapter = {
      name: 'test-adapter',
      model: 'test-model',
      isAvailable: async () => true,
      generateAnalysis: async () => ({
        summary: 'Request is outside the agreed scope.',
        requests: [
          {
            request: 'Create an iOS native app',
            classification: 'LIKELY_ADDITIONAL' as const,
            reasoning: 'Native mobile app is explicitly excluded in the agreement.',
            evidence: [
              {
                quote: 'Excluded: Native mobile app.',
                sourceSectionId: 'Exclusions',
              },
              {
                quote: 'Invented hallucinated sentence not in contract.',
                sourceSectionId: 'Section 5',
              },
            ],
            evidenceStrength: 'EXPLICIT' as const,
            uncertainty: 'None',
          },
        ],
        impact: { possibleWork: [], timelineConsiderations: [], unknowns: [] },
        clarificationQuestions: [],
        changeOrderDraft: 'Hi, regarding your request...',
      }),
    };

    const result = await runScopeAnalysis(sampleAgreement, sampleRequest, mockAdapter);

    expect(result.requests).toHaveLength(1);
    expect(result.requests[0].classification).toBe('LIKELY_ADDITIONAL');
    expect(result.requests[0].evidence).toHaveLength(2);
    // Verbatim quote is verified
    expect(result.requests[0].evidence[0].verificationStatus).toBe('VERIFIED');
    // Hallucinated quote is rejected
    expect(result.requests[0].evidence[1].verificationStatus).toBe('UNVERIFIED_OR_NOT_FOUND');
  });
});

describe('Ollama Repetition Error Handling and Retry Logic', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('detects "token repeat limit reached" Ollama 500 error and retries once, succeeding on retry', async () => {
    const adapter = new OllamaAdapter({
      baseUrl: 'http://127.0.0.1:11434',
      model: 'gemma2:2b',
    });

    const validOutput = JSON.stringify({
      summary: 'Retry succeeded.',
      requests: [
        {
          request: 'Add payment gateway',
          classification: 'ALREADY_INCLUDED',
          reasoning: 'Payment setup is in scope.',
          evidence: [],
          evidenceStrength: 'INFERRED',
          uncertainty: 'None',
        },
      ],
      impact: { possibleWork: [], timelineConsiderations: [], unknowns: [] },
      clarificationQuestions: [],
      changeOrderDraft: 'Hi...',
    });

    // First attempt: Ollama returns 500 with repetition error body
    // Second attempt (retry): returns valid JSON
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => JSON.stringify({ error: 'prediction aborted, token repeat limit reached' }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ response: validOutput }),
      } as unknown as Response);

    // Manually invoke generateAnalysis (isAvailable is not called by _generate)
    const result = await adapter.generateAnalysis('Agreement text', 'Client request');
    expect(result.summary).toBe('Retry succeeded.');
    // fetch should have been called twice for generate (first fail + retry)
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('returns a user-friendly error (not raw Ollama message) when both attempts fail with repetition error', async () => {
    const adapter = new OllamaAdapter({
      baseUrl: 'http://127.0.0.1:11434',
      model: 'gemma2:2b',
    });

    const repetitionBody = JSON.stringify({ error: 'prediction aborted, token repeat limit reached' });

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => repetitionBody,
    } as unknown as Response);

    await expect(adapter.generateAnalysis('Agreement text', 'Client request')).rejects.toThrow(
      /AI analysis failed after retry/
    );

    // Should have been called twice — original + 1 retry
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('does NOT retry non-repetition 500 errors (e.g. model not found)', async () => {
    const adapter = new OllamaAdapter({
      baseUrl: 'http://127.0.0.1:11434',
      model: 'gemma2:2b',
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => JSON.stringify({ error: 'model "gemma2:2b" not found, try pulling it first' }),
    } as unknown as Response);

    await expect(adapter.generateAnalysis('Agreement text', 'Client request')).rejects.toThrow(
      /Ollama service responded with HTTP status 500/
    );

    // Only called once — no retry for non-repetition errors
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('handles malformed JSON from model even after retry path without crashing', async () => {
    const adapter = new OllamaAdapter({
      baseUrl: 'http://127.0.0.1:11434',
      model: 'gemma2:2b',
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ response: 'I am sorry I cannot format JSON correctly { broken' }),
    } as unknown as Response);

    await expect(adapter.generateAnalysis('Agreement text', 'Client request')).rejects.toThrow(
      /Model produced malformed or non-JSON output/
    );
  });
});
