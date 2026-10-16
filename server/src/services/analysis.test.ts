import { describe, it, expect } from 'vitest';
import { verifyQuoteAgainstAgreement, normalizeText } from './evidenceVerifier';
import { parseAndValidateModelOutput } from './aiAdapter';
import { runScopeAnalysis } from './analysisPipeline';
import { AIModelAdapter } from './aiAdapter';
import { RawModelOutput } from '../types/analysis';

describe('Evidence Verification', () => {
  const sampleAgreement = `
STATEMENT OF WORK: E-Commerce Store Refresh
Scope of Deliverables:
1. Re-theme existing Shopify store using the Dawn theme base.
2. Setup and configuration of 5 core page templates:
   - Homepage
   - Product Detail Page (PDP)
   - Collection Listing Page
   - About Us
   - Contact Page
3. Integration with standard Shopify Payments and PayPal gateways.

Out of Scope / Exclusions:
- Custom ERP or legacy inventory management system integration.
- Native mobile application development.
- Additional revision rounds billed at $120/hr.
`;

  it('verifies exact quotes present in the agreement', () => {
    const quote = 'Re-theme existing Shopify store using the Dawn theme base.';
    const result = verifyQuoteAgainstAgreement(quote, sampleAgreement, 'Scope of Deliverables');

    expect(result.isVerified).toBe(true);
    expect(result.verifiedQuote).toBe(quote);
    expect(result.cleanSectionId).toBe('Scope of Deliverables');
  });

  it('verifies quotes with normalized spacing and casing', () => {
    const quote = 'Custom ERP or legacy   inventory management system integration.';
    const result = verifyQuoteAgainstAgreement(quote, sampleAgreement, 'Out of Scope');

    expect(result.isVerified).toBe(true);
  });

  it('rejects fabricated or hallucinated quotes not in the agreement', () => {
    const fabricatedQuote = 'Includes full native Android and iOS mobile app publication to Google Play.';
    const result = verifyQuoteAgainstAgreement(fabricatedQuote, sampleAgreement, 'Deliverables');

    expect(result.isVerified).toBe(false);
  });

  it('rejects empty or placeholder quotes', () => {
    const result = verifyQuoteAgainstAgreement('N/A', sampleAgreement);
    expect(result.isVerified).toBe(false);
  });

  it('rejects very short quotes that could trivially match anything', () => {
    // 'the' or 'a' or short strings should not be verified
    const result = verifyQuoteAgainstAgreement('a', sampleAgreement);
    expect(result.isVerified).toBe(false);
  });
});

describe('Model Output Parsing and Validation', () => {
  it('parses valid raw JSON into validated schema', () => {
    const rawJson = JSON.stringify({
      summary: 'Analysis completed successfully',
      requests: [
        {
          request: 'Integrate SAP SOAP API',
          classification: 'LIKELY_ADDITIONAL',
          reasoning: 'Custom ERP is explicitly in the exclusions list.',
          evidence: [
            {
              quote: 'Custom ERP or legacy inventory management system integration.',
              sourceSectionId: 'Out of Scope',
            },
          ],
          evidenceStrength: 'EXPLICIT',
          uncertainty: 'None',
        },
      ],
      impact: {
        possibleWork: ['Backend integration'],
        timelineConsiderations: ['Delay launch by 2 weeks'],
        unknowns: ['SAP API documentation status'],
      },
      clarificationQuestions: ['Do you have API specs?'],
      changeOrderDraft: 'Thank you for your request...',
    });

    const parsed = parseAndValidateModelOutput(rawJson);
    expect(parsed.requests.length).toBe(1);
    expect(parsed.requests[0].classification).toBe('LIKELY_ADDITIONAL');
  });

  it('strips markdown code blocks around JSON', () => {
    const fencedJson = '```json\n{"summary": "Test", "requests": [], "impact": {"possibleWork": []}}\n```';
    const parsed = parseAndValidateModelOutput(fencedJson);
    expect(parsed.summary).toBe('Test');
  });

  it('throws a safe error when model outputs invalid JSON', () => {
    const invalidText = 'Here is the analysis: { sorry I could not format this';
    expect(() => parseAndValidateModelOutput(invalidText)).toThrow('Model produced malformed or non-JSON output');
  });

  it('handles sparse model output with missing optional arrays gracefully', () => {
    // Models like gemma2:2b may omit some optional arrays
    const sparseJson = JSON.stringify({
      summary: 'The client request appears to be out of scope.',
      requests: [
        {
          request: 'Add inventory sync',
          classification: 'LIKELY_ADDITIONAL',
          reasoning: 'Not in scope.',
          evidence: [],
          evidenceStrength: 'NONE',
          uncertainty: 'None',
        },
      ],
      // impact.possibleWork, timelineConsiderations, unknowns omitted
      impact: {},
      clarificationQuestions: [],
      changeOrderDraft: 'Hi there...',
    });
    const parsed = parseAndValidateModelOutput(sparseJson);
    expect(parsed.requests.length).toBe(1);
    // Zod .default([]) means these should come back as empty arrays
    expect(Array.isArray(parsed.impact.possibleWork)).toBe(true);
    expect(Array.isArray(parsed.impact.timelineConsiderations)).toBe(true);
    expect(Array.isArray(parsed.impact.unknowns)).toBe(true);
  });
});

describe('Analysis Pipeline with Mock Adapter', () => {
  const agreement = `Deliverables: 5 Shopify page templates. Excluded: SAP inventory sync.`;
  const request = `Can we add SAP inventory sync and adjust hero banner?`;

  it('executes analysis pipeline and assigns verified evidence status accurately', async () => {
    const mockAdapter: AIModelAdapter = {
      name: 'mock-gemma',
      model: 'gemma2:2b',
      isAvailable: async () => true,
      generateAnalysis: async (): Promise<RawModelOutput> => ({
        summary: 'Identified 2 distinct client items.',
        requests: [
          {
            request: 'Add SAP inventory sync',
            classification: 'LIKELY_ADDITIONAL',
            reasoning: 'SAP inventory sync is explicitly listed under exclusions.',
            evidence: [
              { quote: 'Excluded: SAP inventory sync.', sourceSectionId: 'Exclusions' },
              { quote: 'Fabricated clause about unlimited cloud servers', sourceSectionId: 'Section 4' },
            ],
            evidenceStrength: 'EXPLICIT',
            uncertainty: 'None',
          },
          {
            request: 'Adjust hero banner',
            classification: 'ALREADY_INCLUDED',
            reasoning: '5 Shopify templates includes homepage hero banner.',
            evidence: [{ quote: 'Deliverables: 5 Shopify page templates.', sourceSectionId: 'Deliverables' }],
            evidenceStrength: 'EXPLICIT',
            uncertainty: 'Revision count',
          },
        ],
        impact: {
          possibleWork: ['Custom ERP sync script'],
          timelineConsiderations: ['Estimated 1-2 weeks extra'],
          unknowns: ['API specs'],
        },
        clarificationQuestions: ['Which SAP endpoints will be utilized?'],
        changeOrderDraft: 'Hi, regarding your request...',
      }),
    };

    const result = await runScopeAnalysis(agreement, request, mockAdapter);

    expect(result.requests.length).toBe(2);
    // Request 1: First quote is verified, second fabricated quote is rejected
    expect(result.requests[0].evidence[0].verificationStatus).toBe('VERIFIED');
    expect(result.requests[0].evidence[1].verificationStatus).toBe('UNVERIFIED_OR_NOT_FOUND');
    expect(result.requests[0].evidenceStrength).toBe('EXPLICIT');

    // Request 2: Verified
    expect(result.requests[1].classification).toBe('ALREADY_INCLUDED');
    expect(result.requests[1].evidence[0].verificationStatus).toBe('VERIFIED');
  });

  it('fails safely when adapter is unavailable without claiming fake success', async () => {
    const unavailableAdapter: AIModelAdapter = {
      name: 'ollama',
      model: 'gemma2:2b',
      isAvailable: async () => false,
      generateAnalysis: async () => {
        throw new Error('Unreachable');
      },
    };

    await expect(runScopeAnalysis(agreement, request, unavailableAdapter)).rejects.toThrow(
      /AI Service Unavailable/
    );
  });

  it('handles a long agreement text without throwing', async () => {
    const longAgreement = `STATEMENT OF WORK\n${'This is a long clause that repeats itself in the agreement document. '.repeat(100)}`;
    const shortRequest = 'Can you add a mobile app?';

    const mockAdapter: AIModelAdapter = {
      name: 'mock-gemma',
      model: 'gemma2:2b',
      isAvailable: async () => true,
      generateAnalysis: async (): Promise<RawModelOutput> => ({
        summary: 'The request appears out of scope.',
        requests: [
          {
            request: 'Add a mobile app',
            classification: 'LIKELY_ADDITIONAL',
            reasoning: 'Mobile apps are not mentioned.',
            evidence: [],
            evidenceStrength: 'NONE',
            uncertainty: 'None',
          },
        ],
        impact: { possibleWork: [], timelineConsiderations: [], unknowns: [] },
        clarificationQuestions: [],
        changeOrderDraft: 'Hi...',
      }),
    };

    const result = await runScopeAnalysis(longAgreement, shortRequest, mockAdapter);
    expect(result.requests.length).toBe(1);
    expect(result.requests[0].classification).toBe('LIKELY_ADDITIONAL');
  });

  it('displays empty evidence correctly when model cites no quotes', async () => {
    const mockAdapter: AIModelAdapter = {
      name: 'mock-gemma',
      model: 'gemma2:2b',
      isAvailable: async () => true,
      generateAnalysis: async (): Promise<RawModelOutput> => ({
        summary: 'Ambiguous request with no clear contract reference.',
        requests: [
          {
            request: 'Add a live chat widget',
            classification: 'NEEDS_CLARIFICATION',
            reasoning: 'Neither mentioned nor excluded.',
            evidence: [], // No quotes cited
            evidenceStrength: 'NONE',
            uncertainty: 'Unclear if this is within the web project scope.',
          },
        ],
        impact: { possibleWork: [], timelineConsiderations: [], unknowns: ['Third-party chat costs'] },
        clarificationQuestions: ['Which chat platform do you prefer?'],
        changeOrderDraft: 'Hi...',
      }),
    };

    const result = await runScopeAnalysis(agreement, 'Add a live chat widget', mockAdapter);
    expect(result.requests[0].evidence).toHaveLength(0);
    expect(result.requests[0].classification).toBe('NEEDS_CLARIFICATION');
  });

  it('marks all quotes as unverified when model cites only hallucinated text', async () => {
    const mockAdapter: AIModelAdapter = {
      name: 'mock-gemma',
      model: 'gemma2:2b',
      isAvailable: async () => true,
      generateAnalysis: async (): Promise<RawModelOutput> => ({
        summary: 'Analysis complete.',
        requests: [
          {
            request: 'Mobile app',
            classification: 'LIKELY_ADDITIONAL',
            reasoning: 'Not in scope.',
            evidence: [
              {
                quote: 'This completely invented sentence does not appear anywhere in the agreement text.',
                sourceSectionId: 'Section 99',
              },
            ],
            evidenceStrength: 'EXPLICIT',
            uncertainty: 'None',
          },
        ],
        impact: { possibleWork: [], timelineConsiderations: [], unknowns: [] },
        clarificationQuestions: [],
        changeOrderDraft: 'Hi...',
      }),
    };

    const result = await runScopeAnalysis(agreement, 'Build a mobile app', mockAdapter);
    expect(result.requests[0].evidence[0].verificationStatus).toBe('UNVERIFIED_OR_NOT_FOUND');
  });
});
