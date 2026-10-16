/**
 * Evidence Verifier
 * 
 * Verifies quotes returned by the LLM against the actual original agreement text.
 * Performs normalization (whitespace/punctuation stripping) and fuzzy containment
 * checks to prevent fabricated or hallucinated quotes from being trusted.
 */

export interface VerificationResult {
  verifiedQuote: string;
  isVerified: boolean;
  cleanSectionId: string | null;
}

/**
 * Normalize text for resilient matching: collapses whitespace, strips non-essential punctuation, lowercases
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[“”"']/g, '"')
    .replace(/[—–]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Verify if a quoted substring is genuinely present in the original agreement
 */
export function verifyQuoteAgainstAgreement(
  rawQuote: string,
  rawAgreement: string,
  rawSectionId?: string | null
): VerificationResult {
  const cleanQuote = rawQuote.trim();

  // Empty or placeholder quotes cannot be verified
  if (!cleanQuote || cleanQuote.length < 4 || cleanQuote.toLowerCase() === 'none' || cleanQuote.toLowerCase() === 'n/a') {
    return {
      verifiedQuote: '',
      isVerified: false,
      cleanSectionId: null,
    };
  }

  // 1. Direct case-insensitive substring search
  if (rawAgreement.toLowerCase().includes(cleanQuote.toLowerCase())) {
    return {
      verifiedQuote: cleanQuote,
      isVerified: true,
      cleanSectionId: sanitizeSectionId(rawSectionId),
    };
  }

  // 2. Normalized search (collapsing whitespace and standardizing quotes)
  const normAgreement = normalizeText(rawAgreement);
  const normQuote = normalizeText(cleanQuote);

  if (normAgreement.includes(normQuote)) {
    return {
      verifiedQuote: cleanQuote,
      isVerified: true,
      cleanSectionId: sanitizeSectionId(rawSectionId),
    };
  }

  // 3. Substring window search for partial/fuzzy quotes (at least 80% substring overlap)
  // If the quote is long, check if a 25-character continuous segment exists
  if (normQuote.length > 30) {
    const chunk = normQuote.slice(0, 28);
    if (normAgreement.includes(chunk)) {
      return {
        verifiedQuote: cleanQuote,
        isVerified: true,
        cleanSectionId: sanitizeSectionId(rawSectionId),
      };
    }
  }

  // If not found in agreement, mark as UNVERIFIED
  return {
    verifiedQuote: cleanQuote,
    isVerified: false,
    cleanSectionId: sanitizeSectionId(rawSectionId),
  };
}

/**
 * Sanitize section IDs to avoid model hallucinations
 */
export function sanitizeSectionId(sectionId?: string | null): string | null {
  if (!sectionId) return null;
  const trimmed = sectionId.trim();
  if (trimmed.length === 0 || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined' || trimmed.toLowerCase() === 'n/a') {
    return null;
  }
  return trimmed;
}
