const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

const { MongoClient } = require('mongodb');

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && cachedClient) {
    // Verify connection is still alive
    try {
      await cachedClient.db('admin').command({ ping: 1 });
      return cachedDb;
    } catch {
      cachedClient = null;
      cachedDb = null;
    }
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  const dbName = process.env.MONGODB_DB_NAME || 'labdrop';

  const client = new MongoClient(uri, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });

  await client.connect();
  const db = client.db(dbName);

  cachedClient = client;
  cachedDb = db;

  return db;
}

async function ensureIndexes(db) {
  const shares = db.collection('shares');

  // TTL index for automatic cleanup after expiration
  // MongoDB checks TTL indexes every 60 seconds
  await shares.createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, background: true }
  );

  // Index for fast code lookup
  await shares.createIndex(
    { codeHash: 1 },
    { background: true }
  );

  // TTL index for rate limit cleanup
  const rateLimits = db.collection('rateLimits');
  await rateLimits.createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, background: true }
  );

  await rateLimits.createIndex(
    { key: 1 },
    { unique: true, background: true }
  );
}

module.exports = { connectToDatabase, ensureIndexes };
