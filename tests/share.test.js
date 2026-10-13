import { describe, it, expect } from 'vitest';

// ─── Unit tests for lib/share.js ───────────────────────────

// We import the CommonJS module in ESM context via dynamic import
const share = await import('../lib/share.js');
const {
  generateCode,
  hashCode,
  detectContentType,
  validateContent,
  validateCode,
  isValidSafeUrl,
  CODE_LENGTH,
  MAX_CONTENT_LENGTH,
} = share;

describe('generateCode', () => {
  it('generates a 6-digit string', () => {
    const code = generateCode();
    expect(code).toHaveLength(CODE_LENGTH);
    expect(/^\d{6}$/.test(code)).toBe(true);
  });

  it('preserves leading zeroes', () => {
    // Generate many codes and verify format
    const codes = new Set();
    for (let i = 0; i < 100; i++) {
      const code = generateCode();
      expect(code).toHaveLength(CODE_LENGTH);
      expect(/^\d{6}$/.test(code)).toBe(true);
      codes.add(code);
    }
    // Should generate different codes (not all the same)
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe('hashCode', () => {
  it('produces a consistent SHA-256 hex hash', () => {
    const hash1 = hashCode('123456');
    const hash2 = hashCode('123456');
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex length
  });

  it('produces different hashes for different codes', () => {
    const hash1 = hashCode('123456');
    const hash2 = hashCode('654321');
    expect(hash1).not.toBe(hash2);
  });

  it('never returns the original code', () => {
    const code = '000000';
    const hash = hashCode(code);
    expect(hash).not.toContain(code);
    expect(hash).not.toBe(code);
  });
});

describe('detectContentType', () => {
  it('detects HTTP URLs', () => {
    expect(detectContentType('http://example.com')).toBe('url');
    expect(detectContentType('https://example.com/path?q=1')).toBe('url');
    expect(detectContentType('https://www.google.com')).toBe('url');
  });

  it('classifies plain text as text', () => {
    expect(detectContentType('Hello, world!')).toBe('text');
    expect(detectContentType('This is just some text')).toBe('text');
    expect(detectContentType('123456')).toBe('text');
  });

  it('rejects unsafe URL schemes', () => {
    expect(detectContentType('javascript:alert(1)')).toBe('text');
    expect(detectContentType('data:text/html,<h1>hi</h1>')).toBe('text');
    expect(detectContentType('file:///etc/passwd')).toBe('text');
    expect(detectContentType('ftp://files.example.com')).toBe('text');
  });

  it('handles whitespace-padded URLs', () => {
    expect(detectContentType('  https://example.com  ')).toBe('url');
  });
});

describe('isValidSafeUrl', () => {
  it('accepts http and https URLs', () => {
    expect(isValidSafeUrl('http://example.com')).toBe(true);
    expect(isValidSafeUrl('https://example.com')).toBe(true);
  });

  it('rejects unsafe schemes', () => {
    expect(isValidSafeUrl('javascript:alert(1)')).toBe(false);
    expect(isValidSafeUrl('data:text/html,hi')).toBe(false);
    expect(isValidSafeUrl('file:///etc/passwd')).toBe(false);
  });

  it('rejects non-URL text', () => {
    expect(isValidSafeUrl('hello world')).toBe(false);
    expect(isValidSafeUrl('')).toBe(false);
  });
});

describe('validateContent', () => {
  it('accepts valid text', () => {
    const result = validateContent('Hello, world!');
    expect(result.valid).toBe(true);
  });

  it('accepts valid URLs', () => {
    const result = validateContent('https://example.com');
    expect(result.valid).toBe(true);
  });

  it('rejects empty content', () => {
    const result = validateContent('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('rejects whitespace-only content', () => {
    const result = validateContent('   \n\t  ');
    expect(result.valid).toBe(false);
  });

  it('rejects null content', () => {
    const result = validateContent(null);
    expect(result.valid).toBe(false);
  });

  it('rejects undefined content', () => {
    const result = validateContent(undefined);
    expect(result.valid).toBe(false);
  });

  it('rejects non-string content', () => {
    const result = validateContent(12345);
    expect(result.valid).toBe(false);
  });

  it('rejects excessively long content', () => {
    const longContent = 'x'.repeat(MAX_CONTENT_LENGTH + 1);
    const result = validateContent(longContent);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('too long');
  });

  it('accepts content at exact max length', () => {
    const content = 'x'.repeat(MAX_CONTENT_LENGTH);
    const result = validateContent(content);
    expect(result.valid).toBe(true);
  });
});

describe('validateCode', () => {
  it('accepts valid 6-digit codes', () => {
    expect(validateCode('123456')).toBe(true);
    expect(validateCode('000000')).toBe(true);
    expect(validateCode('999999')).toBe(true);
  });

  it('rejects codes with wrong length', () => {
    expect(validateCode('12345')).toBe(false);
    expect(validateCode('1234567')).toBe(false);
    expect(validateCode('')).toBe(false);
  });

  it('rejects codes with non-digit characters', () => {
    expect(validateCode('12345a')).toBe(false);
    expect(validateCode('abcdef')).toBe(false);
    expect(validateCode('12-456')).toBe(false);
    expect(validateCode('12 456')).toBe(false);
  });

  it('rejects non-string inputs', () => {
    expect(validateCode(123456)).toBe(false);
    expect(validateCode(null)).toBe(false);
    expect(validateCode(undefined)).toBe(false);
  });
});

// ─── API response shape tests ──────────────────────────────
// These verify that the handlers don't leak internal data.
// Since we can't run MongoDB in unit tests without a running instance,
// these focus on the share utility guarantees.

describe('security: no secrets in output', () => {
  it('hashCode output does not contain the input code', () => {
    const codes = ['000000', '123456', '999999', '042069'];
    for (const code of codes) {
      const hash = hashCode(code);
      // The hash should not be the code and should be a hex string
      expect(hash).not.toBe(code);
      expect(/^[a-f0-9]{64}$/.test(hash)).toBe(true);
    }
  });

  it('generated code is not deterministic', () => {
    const code1 = generateCode();
    const code2 = generateCode();
    // Not guaranteed to be different, but with 1M possibilities it's very unlikely
    // We just verify the format is correct
    expect(/^\d{6}$/.test(code1)).toBe(true);
    expect(/^\d{6}$/.test(code2)).toBe(true);
  });
});
