import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { AnalyzeRequestSchema } from '../types/analysis';

// Create test express app mirroring server routes
const app = express();
app.use(express.json());

app.post('/api/analyze', (req, res) => {
  const validation = AnalyzeRequestSchema.safeParse(req.body);
  if (!validation.success) {
    const issue = validation.error.issues[0];
    return res.status(400).json({
      status: 'error',
      message: issue ? `${issue.path.join('.')}: ${issue.message}` : 'Invalid request payload',
    });
  }
  return res.status(200).json({ status: 'success' });
});

describe('POST /api/analyze Input Validation Endpoints', () => {
  it('rejects empty agreement text with HTTP 400', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .send({
        agreement: '',
        clientRequest: 'Can we add another page?',
      });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toContain('Agreement must be at least 10 characters long');
  });

  it('rejects empty client request text with HTTP 400', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .send({
        agreement: 'Agreement with sufficient length of characters.',
        clientRequest: '   ',
      });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toContain('Client request must be at least 5 characters long');
  });

  it('rejects missing or malformed payload structures with HTTP 400', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .send({
        wrongField: 'test',
      });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  it('accepts valid input shapes', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .send({
        agreement: 'Standard web development agreement covering 5 core pages.',
        clientRequest: 'Please also build an iOS application.',
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
  });
});
