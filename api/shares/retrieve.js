const { connectToDatabase } = require('../../lib/db');
const { checkRateLimit } = require('../../lib/rateLimit');
const { hashCode, validateCode } = require('../../lib/share');

module.exports = async function handler(req, res) {
  // Set security headers
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    // Rate limit by IP
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
    const rateLimitResult = await checkRateLimit(ip, 'retrieve');

    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil((rateLimitResult.retryAfterMs || 60000) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({
        error: 'Too many attempts. Please wait a few minutes and try again.',
      });
    }

    // Parse and validate code
    const body = req.body;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body.' });
    }

    const { code } = body;

    if (!validateCode(code)) {
      return res.status(400).json({
        error: 'Please enter a valid 6-digit code.',
      });
    }

    const codeHashValue = hashCode(code);
    const now = new Date();

    const db = await connectToDatabase();
    const shares = db.collection('shares');

    const share = await shares.findOne({ codeHash: codeHashValue });

    // Generic error for both not-found and expired (don't leak existence)
    if (!share || share.expiresAt <= now) {
      return res.status(404).json({
        error: "That code didn't work. It may be incorrect or expired.",
      });
    }

    return res.status(200).json({
      content: share.content,
      contentType: share.contentType,
      expiresAt: share.expiresAt.toISOString(),
    });
  } catch (err) {
    console.error('Share retrieval error:', err.message);
    return res.status(500).json({
      error: 'Something went wrong. Please try again.',
    });
  }
};
