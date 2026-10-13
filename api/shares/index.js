const { connectToDatabase } = require('../../lib/db');
const { checkRateLimit } = require('../../lib/rateLimit');
const {
  generateCode,
  hashCode,
  detectContentType,
  validateContent,
  EXPIRY_MINUTES,
  MAX_COLLISION_RETRIES,
  MAX_CONTENT_LENGTH,
} = require('../../lib/share');

module.exports = async function handler(req, res) {
  // Set security headers
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  // Check Content-Length to reject oversized payloads early
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  if (contentLength > MAX_CONTENT_LENGTH + 500) {
    return res.status(413).json({ error: 'Request body is too large.' });
  }

  try {
    // Rate limit by IP
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
    const rateLimitResult = await checkRateLimit(ip, 'create');

    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil((rateLimitResult.retryAfterMs || 60000) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({
        error: 'Too many shares created. Please wait a few minutes and try again.',
      });
    }

    // Parse and validate content
    const body = req.body;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body.' });
    }

    const { content } = body;
    const validation = validateContent(content);

    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const trimmedContent = content.trim();
    const contentType = detectContentType(trimmedContent);

    const db = await connectToDatabase();
    const shares = db.collection('shares');

    // Generate code with collision handling
    let code = null;
    let codeHashValue = null;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + EXPIRY_MINUTES * 60 * 1000);

    for (let attempt = 0; attempt < MAX_COLLISION_RETRIES; attempt++) {
      const candidateCode = generateCode();
      const candidateHash = hashCode(candidateCode);

      // Check if an active share with this code hash exists
      const existing = await shares.findOne({
        codeHash: candidateHash,
        expiresAt: { $gt: now },
      });

      if (!existing) {
        code = candidateCode;
        codeHashValue = candidateHash;
        break;
      }
    }

    if (!code) {
      return res.status(503).json({
        error: 'Unable to generate a unique code. Please try again in a moment.',
      });
    }

    // Insert the share
    await shares.insertOne({
      codeHash: codeHashValue,
      content: trimmedContent,
      contentType,
      createdAt: now,
      expiresAt,
    });

    // Return the plaintext code (only time it's ever sent)
    return res.status(201).json({
      code,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error('Share creation error:', err.message);
    return res.status(500).json({
      error: 'Something went wrong. Please try again.',
    });
  }
};
