import { z } from 'zod';

// Client request payload validation
export const AnalyzeRequestSchema = z.object({
  agreement: z
    .string()
    .trim()
    .min(10, 'Agreement must be at least 10 characters long')
    .max(50000, 'Agreement exceeds maximum allowed length of 50,000 characters'),
  clientRequest: z
    .string()
    .trim()
    .min(5, 'Client request must be at least 5 characters long')
    .max(20000, 'Client request exceeds maximum allowed length of 20,000 characters'),
});

export type AnalyzeRequestInput = z.infer<typeof AnalyzeRequestSchema>;

// Classification enum
export const ClassificationSchema = z.enum([
  'ALREADY_INCLUDED',
  'LIKELY_ADDITIONAL',
  'NEEDS_CLARIFICATION',
]);
export type ClassificationType = z.infer<typeof ClassificationSchema>;

// Evidence Verification Status
export const VerificationStatusSchema = z.enum([
  'VERIFIED',
  'UNVERIFIED_OR_NOT_FOUND',
]);
export type VerificationStatusType = z.infer<typeof VerificationStatusSchema>;

// Evidence Strength
export const EvidenceStrengthSchema = z.enum([
  'EXPLICIT',
  'INFERRED',
  'INSUFFICIENT',
]);
export type EvidenceStrengthType = z.infer<typeof EvidenceStrengthSchema>;

// Evidence item schema
export const EvidenceItemSchema = z.object({
  quote: z.string(),
  sourceSectionId: z.string().nullable().optional(),
  verificationStatus: VerificationStatusSchema,
});
export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;

// Decomposed request item schema
export const ClassifiedRequestItemSchema = z.object({
  request: z.string().min(1),
  classification: ClassificationSchema,
  reasoning: z.string().min(1),
  evidence: z.array(EvidenceItemSchema),
  evidenceStrength: EvidenceStrengthSchema,
  uncertainty: z.string().default('None identified'),
});
export type ClassifiedRequestItem = z.infer<typeof ClassifiedRequestItemSchema>;

// Potential impact
export const ImpactAssessmentSchema = z.object({
  possibleWork: z.array(z.string()).default([]),
  timelineConsiderations: z.array(z.string()).default([]),
  unknowns: z.array(z.string()).default([]),
});
export type ImpactAssessment = z.infer<typeof ImpactAssessmentSchema>;

// Complete analysis response
export const ScopeAnalysisResultSchema = z.object({
  summary: z.string().min(1),
  requests: z.array(ClassifiedRequestItemSchema).min(1),
  impact: ImpactAssessmentSchema,
  clarificationQuestions: z.array(z.string()).default([]),
  changeOrderDraft: z.string().min(1),
  modelMetadata: z.object({
    provider: z.string(),
    model: z.string(),
  }).optional(),
});
export type ScopeAnalysisResult = z.infer<typeof ScopeAnalysisResultSchema>;

// Flexible preprocessors for model output to handle variations gracefully
const stringCoercer = z.preprocess((val) => {
  if (typeof val === 'string') return val;
  if (val && typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    if (typeof obj.text === 'string') return obj.text;
    if (typeof obj.message === 'string') return obj.message;
    if (typeof obj.content === 'string') return obj.content;
    if (typeof obj.description === 'string') return obj.description;
    if (typeof obj.question === 'string') return obj.question;
    if (typeof obj.quote === 'string') return obj.quote;
    return JSON.stringify(val);
  }
  return val != null ? String(val) : '';
}, z.string());

const stringArrayCoercer = z.preprocess((val) => {
  if (Array.isArray(val)) {
    return val.map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>;
        const extracted = obj.text || obj.question || obj.item || obj.description || obj.name;
        if (typeof extracted === 'string') return extracted;
        return JSON.stringify(item);
      }
      return String(item ?? '');
    });
  }
  if (typeof val === 'string') return [val];
  return [];
}, z.array(z.string()).default([]));

// Model raw JSON generation schema (pre-evidence-verification)
export const RawModelOutputSchema = z.object({
  summary: stringCoercer.default('Analysis complete.'),
  requests: z.array(
    z.object({
      request: stringCoercer.default(''),
      classification: stringCoercer.default('NEEDS_CLARIFICATION'),
      reasoning: stringCoercer.default(''),
      evidence: z.array(
        z.object({
          quote: stringCoercer.default(''),
          sourceSectionId: z.preprocess(
            (v) => (v != null ? String(v) : null),
            z.string().nullable().optional()
          ),
        })
      ).default([]),
      evidenceStrength: stringCoercer.default('INFERRED'),
      uncertainty: stringCoercer.default('None'),
    })
  ).default([]),
  impact: z.preprocess((val) => {
    if (val && typeof val === 'object' && !Array.isArray(val)) return val;
    return {};
  }, z.object({
    possibleWork: stringArrayCoercer,
    timelineConsiderations: stringArrayCoercer,
    unknowns: stringArrayCoercer,
  })).default({ possibleWork: [], timelineConsiderations: [], unknowns: [] }),
  clarificationQuestions: stringArrayCoercer,
  changeOrderDraft: stringCoercer.default(''),
});
export type RawModelOutput = z.infer<typeof RawModelOutputSchema>;
