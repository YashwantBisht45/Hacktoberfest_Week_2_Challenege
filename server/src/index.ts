import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { AnalyzeRequestSchema } from './types/analysis';
import { createAIAdapter } from './services/aiAdapter';
import { runScopeAnalysis } from './services/analysisPipeline';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST;

// Enable trust proxy for Render, Cloudflare, and reverse proxies
if (process.env.NODE_ENV === 'production' || process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

import { parseAllowedOrigins } from './utils/cors';

export { parseAllowedOrigins };

const allowedOrigins = parseAllowedOrigins(process.env.CLIENT_ORIGIN);

// CORS configuration supporting single or multiple origins
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server health probes)
      if (!origin) return callback(null, true);
      const normalized = origin.replace(/\/+$/, '');
      if (allowedOrigins.includes('*') || allowedOrigins.includes(normalized)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy violation: Origin ${origin} not permitted`));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// JSON request parsing with reasonable body-size limit (1mb is plenty for text scopes)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rate limiter for expensive AI inference endpoint (configurable for evaluation/development)
const rateLimitMax = process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX, 10) : 30;
const analysisRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Rate limit exceeded for scope analysis. Please wait a few moments before trying again.',
  },
});

// Initialize configured AI adapter
const aiAdapter = createAIAdapter();

// Health-check endpoint
app.get('/api/health', async (_req: Request, res: Response) => {
  let aiStatus = 'unreachable';
  try {
    const isAiAvailable = await aiAdapter.isAvailable();
    aiStatus = isAiAvailable ? 'connected' : 'unreachable';
  } catch {
    aiStatus = 'unreachable';
  }

  res.status(200).json({
    status: 'ok',
    service: 'ScopeGuard AI Backend',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    ai: {
      provider: aiAdapter.name,
      model: aiAdapter.model,
      status: aiStatus,
    },
  });
});

// Genuine Scope Analysis endpoint
app.post('/api/analyze', analysisRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Validate request payload using Zod
    const validationResult = AnalyzeRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      const issue = validationResult.error.issues[0];
      res.status(400).json({
        status: 'error',
        message: issue ? `${issue.path.join('.')}: ${issue.message}` : 'Invalid request payload',
      });
      return;
    }

    const { agreement, clientRequest } = validationResult.data;

    // Log operational metadata only (Never log agreement text or client messages for privacy)
    console.log(
      `[ScopeGuard Analysis] Processing analysis request (Agreement: ${agreement.length} chars, Request: ${clientRequest.length} chars) using ${aiAdapter.name} (${aiAdapter.model})`
    );

    // 2. Execute full analysis pipeline
    const result = await runScopeAnalysis(agreement, clientRequest, aiAdapter);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err: unknown) {
    next(err);
  }
});

// Centralized safe error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[ScopeGuard API Error]:', err.message);

  if (err.message.includes('CORS policy violation')) {
    res.status(403).json({
      status: 'error',
      message: 'Access denied: origin not permitted by CORS policy.',
    });
    return;
  }

  const isClientError =
    err.message.includes('AI Service Unavailable') ||
    err.message.includes('Hosted AI') ||
    err.message.includes('hosted') ||
    err.message.includes('provider') ||
    err.message.includes('timed out') ||
    err.message.includes('malformed') ||
    err.message.includes('schema validation failed') ||
    err.message.includes('API key') ||
    err.message.includes('rate limit') ||
    err.message.includes('Analysis failed') ||
    err.message.includes('Model output') ||
    err.message.includes('No such model');

  const statusCode = err.message.includes('rate limit') ? 429 : isClientError ? 503 : 500;

  res.status(statusCode).json({
    status: 'error',
    message: isClientError ? err.message : 'An unexpected error occurred during scope analysis.',
  });
});

if (process.env.NODE_ENV !== 'test') {
  // On Windows, binding explicitly to '0.0.0.0' disables the IPv6 loopback listener (::1),
  // causing 'ECONNREFUSED ::1:PORT' when clients or Vite proxies resolve localhost to IPv6.
  // Omitting the host parameter activates Node's dual-stack (IPv4 + IPv6) listener.
  const shouldListenWithoutHost = !HOST || (process.platform === 'win32' && HOST === '0.0.0.0');

  if (shouldListenWithoutHost) {
    app.listen(PORT, () => {
      console.log(`[ScopeGuard API] Server is running on port ${PORT} (dual-stack IPv4/IPv6)`);
      console.log(`[ScopeGuard API] Allowed CORS origins: ${JSON.stringify(allowedOrigins)}`);
      console.log(`[ScopeGuard API] Active AI Provider: ${aiAdapter.name} (${aiAdapter.model})`);
    });
  } else {
    app.listen(PORT, HOST, () => {
      console.log(`[ScopeGuard API] Server is running on http://${HOST}:${PORT}`);
      console.log(`[ScopeGuard API] Allowed CORS origins: ${JSON.stringify(allowedOrigins)}`);
      console.log(`[ScopeGuard API] Active AI Provider: ${aiAdapter.name} (${aiAdapter.model})`);
    });
  }
}

export { app };
