import { RedactionItem, RedactionCategory } from '../src/types/index.js';

interface RedactionScanResult {
  cleanedText: string;
  redactedText: string;
  items: RedactionItem[];
  offTheRecordSegmentsCount: number;
}

// Regex patterns for typed formats & known sensitive PII
const SENSITIVE_PATTERNS: Array<{
  itemType: string;
  category: RedactionCategory;
  pattern: RegExp;
  placeholder: string;
  preserveLast4?: boolean;
}> = [
  // Passwords, PINs, OTPs
  {
    itemType: 'Password / Auth Secret',
    category: 'security',
    pattern: /\b(?:password|passwd|pwd|passcode|secret)[\s:=]+(?:is\s+|was\s+|was set to\s+)?([^\s,;]{4,64})\b/gi,
    placeholder: '[PASSWORD REMOVED]'
  },
  {
    itemType: 'One-Time PIN / OTP',
    category: 'security',
    pattern: /\b(?:otp|pin|one[\s-]time code|verification code)[\s:=]+(?:is\s+)?(\d{4,8})\b/gi,
    placeholder: '[OTP REMOVED]'
  },
  // API Keys & Tokens
  {
    itemType: 'API Secret / Access Token',
    category: 'security',
    pattern: /\b(AKIA[0-9A-Z]{16}|ghp_[a-zA-Z0-9]{36}|AIza[0-9A-Za-z-_]{35}|Bearer\s+[a-zA-Z0-9_\-\.]{25,}|sk_live_[0-9a-zA-Z]{24,})\b/gi,
    placeholder: '[API KEY REMOVED]'
  },
  // Credit / Debit Cards
  {
    itemType: 'Credit Card / Payment Card',
    category: 'financial',
    pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    placeholder: '[CARD NUMBER REMOVED]',
    preserveLast4: true
  },
  // Bank Account Numbers & Routing
  {
    itemType: 'Bank Account Number',
    category: 'financial',
    pattern: /\b(?:account(?:\s+number)?|acct[\s#:]+)\s*(\d{8,17})\b/gi,
    placeholder: '[ACCOUNT NUMBER REMOVED]',
    preserveLast4: true
  },
  {
    itemType: 'Routing / IFSC Code',
    category: 'financial',
    pattern: /\b([A-Z]{4}0[A-Z0-9]{6}|\b0[0-9]{8}\b)\b/g,
    placeholder: '[ROUTING/IFSC CODE REMOVED]'
  },
  // UPI IDs
  {
    itemType: 'UPI Payment ID',
    category: 'financial',
    pattern: /\b[a-zA-Z0-9.\-_]{2,64}@(okaxis|okicici|oksbi|okhdfcbank|paytm|ybl|apl|upi)\b/gi,
    placeholder: '[UPI ID REMOVED]'
  },
  // National IDs: Aadhaar & PAN
  {
    itemType: 'National ID (Aadhaar)',
    category: 'pii',
    pattern: /\b\d{4}\s\d{4}\s\d{4}\b/g,
    placeholder: '[NATIONAL ID REMOVED]'
  },
  {
    itemType: 'Tax ID / PAN',
    category: 'pii',
    pattern: /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/g,
    placeholder: '[TAX ID / PAN REMOVED]'
  },
  // Personal Phone Numbers
  {
    itemType: 'Personal Phone Number',
    category: 'pii',
    pattern: /(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?/gi,
    placeholder: '[PHONE NUMBER REMOVED]'
  },
  // Personal Email addresses (excluding official corporate team domains if desired)
  {
    itemType: 'Personal Email Address',
    category: 'pii',
    pattern: /\b[A-Za-z0-9._%+-]+@(gmail|yahoo|hotmail|outlook|icloud|protonmail)\.com\b/gi,
    placeholder: '[PERSONAL EMAIL REMOVED]'
  },
  // Confidential Business: Salaries & Compensation
  {
    itemType: 'Employee Salary / Compensation',
    category: 'confidential',
    pattern: /\b(?:salary|compensation|annual package|base pay)[\s:=]+(?:is\s+)?(\$?\d{2,3}(?:,\d{3})*(?:\s*k|\s*thousand|\s*USD|\s*INR)?)\b/gi,
    placeholder: '[COMPENSATION DETAILS REMOVED]'
  },
  // Confidential Business: Layoffs & Restructuring
  {
    itemType: 'Confidential HR / Layoff Discussion',
    category: 'confidential',
    pattern: /\b(?:laying off|layoffs?|letting go of|severance package|rif)[\s:=]+(\d{1,3}%?\s*(?:of staff|of engineering|people|employees)?)\b/gi,
    placeholder: '[HR / RESTRUCTURING DETAIL REMOVED]'
  },
  // Confidential Business: Unreleased Pricing & Acquisition
  {
    itemType: 'Unreleased Pricing / Commercial Terms',
    category: 'confidential',
    pattern: /\b(?:unreleased pricing|internal price|discount cap)[\s:=]+(\$\d+(?:\.\d+)?(?:\/month|\/seat|\/user)?)\b/gi,
    placeholder: '[UNRELEASED PRICING REMOVED]'
  }
];

// Spoken phrases patterns (e.g. "my password is hunter two", "the pin is four eight one zero")
const SPOKEN_SECRETS_PATTERNS = [
  {
    itemType: 'Spoken Password / Passcode',
    category: 'security' as RedactionCategory,
    regex: /(?:my password is|the password is|master passcode is)\s+([a-zA-Z0-9_!@#$%^&*()]+(?:\s+[a-zA-Z0-9_!@#$%^&*()]+)?)/gi,
    placeholder: '[SPOKEN PASSWORD REMOVED]'
  },
  {
    itemType: 'Spoken Account / Card Digits',
    category: 'financial' as RedactionCategory,
    regex: /(?:account number is|card ending in|pin code is)\s+([0-9\s]{4,16})/gi,
    placeholder: '[SPOKEN FINANCIAL DETAILS REMOVED]'
  }
];

/**
 * Handle "off the record" sections.
 * Strips any speech spoken between "off the record" and "back on the record" / "on the record"
 */
export function stripOffTheRecord(text: string): { processedText: string; segmentsStripped: number } {
  let segmentsStripped = 0;
  // Match "off the record ... back on the record" or "off the record ... on the record"
  const regex = /off the record([\s\S]*?)(?:back on the record|on the record|$)/gi;
  
  const processedText = text.replace(regex, (match, confidentialSegment) => {
    if (confidentialSegment && confidentialSegment.trim().length > 0) {
      segmentsStripped++;
      return ' [SECTION EXCLUDED: OFF THE RECORD] ';
    }
    return '';
  });

  return { processedText, segmentsStripped };
}

/**
 * Speech cleanup: removes fillers ("um", "uh", "you know"), stuttering/repetitions,
 * and resolves spoken self-corrections ("Tuesday, no wait, Wednesday" -> "Wednesday").
 */
export function cleanMessySpeech(text: string): string {
  let cleaned = text;

  // 1. Resolve self-corrections: "X, no wait, Y" or "X, actually Y" or "X, I mean Y"
  cleaned = cleaned.replace(/([a-zA-Z0-9\s]+?),\s*(?:no wait|wait no|actually|scratch that|I mean|sorry)\s*,?\s*([a-zA-Z0-9\s]+)/gi, (match, before, corrected) => {
    // If the correction provides a replacement, keep the corrected part
    return corrected.trim();
  });

  // 2. Remove filler vocalizations
  cleaned = cleaned.replace(/\b(um+|uh+|er+|ah+|like,\s*you know|you know what I mean|sort of like)\b/gi, '');

  // 3. Remove duplicate adjacent repetitions: "the the", "we we"
  cleaned = cleaned.replace(/\b(\w+)\s+\1\b/gi, '$1');

  // 4. Normalize multiple spaces
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();

  return cleaned;
}

/**
 * Run the comprehensive Privacy Layer scan.
 * Must run BEFORE storage, BEFORE any AI call, and BEFORE distribution.
 */
export function scanAndRedact(rawInput: string): RedactionScanResult {
  // Step 1: Strip "off the record" segments
  const { processedText: textWithoutOffRecord, segmentsStripped } = stripOffTheRecord(rawInput);

  // Step 2: Clean messy speech while preserving essential meaning
  const cleanedSpeech = cleanMessySpeech(textWithoutOffRecord);

  let redactedText = cleanedSpeech;
  const items: RedactionItem[] = [];

  // Step 3: Scan for typed sensitive patterns
  for (const rule of SENSITIVE_PATTERNS) {
    // Reset regex index
    rule.pattern.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = rule.pattern.exec(cleanedSpeech)) !== null) {
      const fullMatch = match[0];
      const sensitivePart = match[1] || fullMatch;
      
      let placeholder = rule.placeholder;
      if (rule.preserveLast4 && sensitivePart.length > 4) {
        const last4 = sensitivePart.slice(-4);
        placeholder = `${rule.placeholder.replace('REMOVED]', '')}ENDING IN ${last4}]`;
      }

      // Check if we already have this index covered
      const startIndex = match.index;
      const endIndex = startIndex + fullMatch.length;
      
      const alreadyCovered = items.some(item => 
        (startIndex >= item.startIndex && startIndex < item.endIndex) ||
        (endIndex > item.startIndex && endIndex <= item.endIndex)
      );

      if (!alreadyCovered) {
        const id = `redact-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        items.push({
          id,
          itemType: rule.itemType,
          category: rule.category,
          maskedPlaceholder: placeholder,
          originalValue: fullMatch, // stored in server memory only
          startIndex,
          endIndex,
          restored: false,
          detectedBy: 'regex_pattern'
        });
      }
    }
  }

  // Step 4: Scan for spoken secrets
  for (const spokenRule of SPOKEN_SECRETS_PATTERNS) {
    spokenRule.regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = spokenRule.regex.exec(cleanedSpeech)) !== null) {
      const fullMatch = match[0];
      const startIndex = match.index;
      const endIndex = startIndex + fullMatch.length;

      const alreadyCovered = items.some(item => 
        (startIndex >= item.startIndex && startIndex < item.endIndex) ||
        (endIndex > item.startIndex && endIndex <= item.endIndex)
      );

      if (!alreadyCovered) {
        items.push({
          id: `redact-spoken-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          itemType: spokenRule.itemType,
          category: spokenRule.category,
          maskedPlaceholder: spokenRule.placeholder,
          originalValue: fullMatch,
          startIndex,
          endIndex,
          restored: false,
          detectedBy: 'llm_semantic'
        });
      }
    }
  }

  // Step 5: Apply redactions in reverse order of index to prevent offset shifting
  const sortedItems = [...items].sort((a, b) => b.startIndex - a.startIndex);
  for (const item of sortedItems) {
    redactedText = 
      redactedText.substring(0, item.startIndex) + 
      item.maskedPlaceholder + 
      redactedText.substring(item.endIndex);
  }

  return {
    cleanedText: cleanedSpeech,
    redactedText,
    items,
    offTheRecordSegmentsCount: segmentsStripped
  };
}
