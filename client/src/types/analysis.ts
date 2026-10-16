export type ClassificationType =
  | 'ALREADY_INCLUDED'
  | 'LIKELY_ADDITIONAL'
  | 'NEEDS_CLARIFICATION';

export type VerificationStatusType = 'VERIFIED' | 'UNVERIFIED_OR_NOT_FOUND';

export type EvidenceStrengthType = 'EXPLICIT' | 'INFERRED' | 'INSUFFICIENT';

export interface EvidenceItem {
  quote: string;
  sourceSectionId?: string | null;
  verificationStatus: VerificationStatusType;
}

export interface ClassifiedRequestItem {
  request: string;
  classification: ClassificationType;
  reasoning: string;
  evidence: EvidenceItem[];
  evidenceStrength: EvidenceStrengthType;
  uncertainty: string;
}

export interface ImpactAssessment {
  possibleWork: string[];
  timelineConsiderations: string[];
  unknowns: string[];
}

export interface ScopeAnalysisResult {
  summary: string;
  requests: ClassifiedRequestItem[];
  impact: ImpactAssessment;
  clarificationQuestions: string[];
  changeOrderDraft: string;
  modelMetadata?: {
    provider: string;
    model: string;
  };
}
