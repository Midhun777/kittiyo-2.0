const crypto = require('crypto');

const CODE_LENGTH = 6;
const MAX_CONTENT_LENGTH = 10000;
const EXPIRY_MINUTES = 10;
const MAX_COLLISION_RETRIES = 5;

/**
 * Generate a cryptographically secure random 6-digit code.
 * Leading zeroes are preserved as a string.
 */
function generateCode() {
  const max = Math.pow(10, CODE_LENGTH);
  const randomBytes = crypto.randomBytes(4);
  const num = randomBytes.readUInt32BE(0) % max;
  return String(num).padStart(CODE_LENGTH, '0');
}

/**
 * Hash a code using SHA-256. We never store the plaintext code.
 */
function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * Detect if content is a valid HTTP/HTTPS URL.
 */
function detectContentType(content) {
  const trimmed = content.trim();
  try {
    const url = new URL(trimmed);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return 'url';
    }
  } catch {
    // Not a URL
  }
  return 'text';
}

/**
 * Validate a URL is safe (only http/https schemes).
 */
function isValidSafeUrl(content) {
  const trimmed = content.trim();
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate share content.
 * Returns { valid, error } object.
 */
function validateContent(content) {
  if (content === undefined || content === null) {
    return { valid: false, error: 'Content is required.' };
  }

  if (typeof content !== 'string') {
    return { valid: false, error: 'Content must be text.' };
  }

  const trimmed = content.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Content cannot be empty.' };
  }

  if (content.length > MAX_CONTENT_LENGTH) {
    return {
      valid: false,
      error: `Content is too long. Maximum is ${MAX_CONTENT_LENGTH.toLocaleString()} characters.`,
    };
  }

  return { valid: true };
}

/**
 * Validate a 6-digit numeric code.
 */
function validateCode(code) {
  if (typeof code !== 'string') {
    return false;
  }
  return /^\d{6}$/.test(code);
}

module.exports = {
  CODE_LENGTH,
  MAX_CONTENT_LENGTH,
  EXPIRY_MINUTES,
  MAX_COLLISION_RETRIES,
  generateCode,
  hashCode,
  detectContentType,
  isValidSafeUrl,
  validateContent,
  validateCode,
};
