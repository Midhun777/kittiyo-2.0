const { connectToDatabase } = require('./db');

/**
 * MongoDB-based rate limiter for serverless environments.
 * Uses a shared collection so limits apply across all function instances.
 */
async function checkRateLimit(ip, action) {
  const config = getRateLimitConfig(action);
  const db = await connectToDatabase();
  const collection = db.collection('rateLimits');

  const key = `${action}:${ip}`;
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMs);

  // Use upsert to atomically increment the counter
  const result = await collection.findOneAndUpdate(
    { key },
    {
      $setOnInsert: {
        key,
        firstRequest: now,
        expiresAt: new Date(now.getTime() + config.windowMs),
      },
      $inc: { count: 1 },
    },
    {
      upsert: true,
      returnDocument: 'after',
    }
  );

  const doc = result;

  // If the window has expired, reset the counter
  if (doc.firstRequest < windowStart) {
    await collection.updateOne(
      { key },
      {
        $set: {
          count: 1,
          firstRequest: now,
          expiresAt: new Date(now.getTime() + config.windowMs),
        },
      }
    );
    return { allowed: true, remaining: config.max - 1 };
  }

  if (doc.count > config.max) {
    const retryAfterMs = doc.expiresAt.getTime() - now.getTime();
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, retryAfterMs),
    };
  }

  return { allowed: true, remaining: config.max - doc.count };
}

function getRateLimitConfig(action) {
  if (action === 'create') {
    return {
      max: parseInt(process.env.RATE_LIMIT_CREATE_MAX || '10', 10),
      windowMs: parseInt(process.env.RATE_LIMIT_CREATE_WINDOW_MS || '900000', 10),
    };
  }
  if (action === 'retrieve') {
    return {
      max: parseInt(process.env.RATE_LIMIT_RETRIEVE_MAX || '20', 10),
      windowMs: parseInt(process.env.RATE_LIMIT_RETRIEVE_WINDOW_MS || '900000', 10),
    };
  }
  return { max: 30, windowMs: 900000 };
}

module.exports = { checkRateLimit };
