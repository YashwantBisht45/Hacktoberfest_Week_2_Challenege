import { AIModelAdapter } from './aiAdapter';
import { verifyQuoteAgainstAgreement } from './evidenceVerifier';
import {
  ScopeAnalysisResult,
  ScopeAnalysisResultSchema,
  ClassifiedRequestItem,
  EvidenceItem,
  ClassificationType,
  EvidenceStrengthType,
} from '../types/analysis';

/**
 * Execute Full 6-Stage Analysis Pipeline
 * 
 * Stages:
 * Stage A: Extract agreement context
 * Stage B: Decompose client request items
 * Stage C: Compare each decomposed item and classify
 * Stage D: Independent evidence verification against raw agreement
 * Stage E: Assess potential timeline/effort impacts
 * Stage F: Generate professional change-order response
 */
export async function runScopeAnalysis(
  agreement: string,
  clientRequest: string,
  adapter: AIModelAdapter
): Promise<ScopeAnalysisResult> {
  // Check availability
  const isAvailable = await adapter.isAvailable();
  if (!isAvailable) {
    throw new Error(
      `AI Service Unavailable: Could not connect to AI backend (${adapter.name}). If using Ollama, ensure Ollama is installed and running ('ollama serve') with model '${adapter.model}'.`
    );
  }

  // Generate model analysis
  const rawOutput = await adapter.generateAnalysis(agreement, clientRequest);

  // Filter out any phantom empty items emitted by the model
  const nonBlankRequests = (rawOutput.requests || []).filter(
    (item) => (item.request && item.request.trim().length > 0) || (item.reasoning && item.reasoning.trim().length > 0)
  );

  const candidateRequests = nonBlankRequests.length > 0 ? nonBlankRequests : rawOutput.requests;

  // If model returned no identifiable requests, fail safely
  if (!candidateRequests || candidateRequests.length === 0) {
    throw new Error('Analysis failed: Model could not decompose any identifiable client requests.');
  }

  // Stage D: Independently verify evidence for each decomposed request item
  const verifiedRequests: ClassifiedRequestItem[] = candidateRequests.map((item, idx) => {
    // Sanitize classification
    let classification: ClassificationType = 'NEEDS_CLARIFICATION';
    const upperClass = (item.classification || '').toUpperCase().trim();
    if (upperClass.includes('ALREADY') || upperClass.includes('INCLUDED')) {
      classification = 'ALREADY_INCLUDED';
    } else if (upperClass.includes('ADDITIONAL') || upperClass.includes('OUT_OF_SCOPE') || upperClass.includes('EXTRA')) {
      classification = 'LIKELY_ADDITIONAL';
    } else if (upperClass.includes('CLARIF') || upperClass.includes('AMBIGUOUS') || upperClass.includes('UNKNOWN')) {
      classification = 'NEEDS_CLARIFICATION';
    }

    // Process and verify evidence quotes against the ACTUAL agreement text
    const verifiedEvidenceList: EvidenceItem[] = (item.evidence || []).map((ev) => {
      const verResult = verifyQuoteAgainstAgreement(ev.quote, agreement, ev.sourceSectionId);

      return {
        quote: verResult.verifiedQuote || ev.quote,
        sourceSectionId: verResult.cleanSectionId,
        verificationStatus: verResult.isVerified ? 'VERIFIED' : 'UNVERIFIED_OR_NOT_FOUND',
      };
    });

    // Determine evidence strength based on verification results
    let evidenceStrength: EvidenceStrengthType = 'INFERRED';
    const hasVerifiedQuotes = verifiedEvidenceList.some((e) => e.verificationStatus === 'VERIFIED');

    if (hasVerifiedQuotes) {
      evidenceStrength = 'EXPLICIT';
    } else if (verifiedEvidenceList.length > 0) {
      evidenceStrength = 'INSUFFICIENT';
    } else {
      evidenceStrength = classification === 'NEEDS_CLARIFICATION' ? 'INSUFFICIENT' : 'INFERRED';
    }

    const trimmedRequest = item.request?.trim();
    const fallbackRequest = clientRequest.trim().slice(0, 150) || `Requested item #${idx + 1}`;
    const trimmedReasoning = item.reasoning?.trim();
    const fallbackReasoning = 'Scope evaluation performed against Statement of Work.';

    return {
      request: trimmedRequest || fallbackRequest,
      classification,
      reasoning: trimmedReasoning || fallbackReasoning,
      evidence: verifiedEvidenceList,
      evidenceStrength,
      uncertainty: item.uncertainty?.trim() || 'No specific uncertainty reported.',
    };
  });

  // Assemble final result
  const result: ScopeAnalysisResult = {
    summary: rawOutput.summary?.trim() || 'Scope analysis completed.',
    requests: verifiedRequests,
    impact: {
      possibleWork: rawOutput.impact?.possibleWork || [],
      timelineConsiderations: rawOutput.impact?.timelineConsiderations || [],
      unknowns: rawOutput.impact?.unknowns || [],
    },
    clarificationQuestions: rawOutput.clarificationQuestions || [],
    changeOrderDraft:
      rawOutput.changeOrderDraft?.trim() ||
      'Hi [Client Name],\n\nThank you for reaching out with these project updates. We reviewed the requested items against our agreed Statement of Work. Please review the scope alignment details above before we proceed with adjustments.\n\nBest regards,\n[Your Name]',
    modelMetadata: {
      provider: adapter.name,
      model: adapter.model,
    },
  };

  // Final schema validation check
  const validated = ScopeAnalysisResultSchema.safeParse(result);
  if (!validated.success) {
    throw new Error(`Internal schema error assembling analysis results: ${validated.error.message}`);
  }

  return validated.data;
}
