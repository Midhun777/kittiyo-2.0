/**
 * One-time database setup script.
 * Creates the required indexes for the shares and rateLimits collections.
 *
 * Usage: MONGODB_URI=... node scripts/setup-db.js
 */

try {
  require('dotenv').config();
} catch {
  // dotenv optional
}

const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

const { connectToDatabase, ensureIndexes } = require('../lib/db');

async function setup() {
  console.log('Connecting to MongoDB...');
  const db = await connectToDatabase();
  console.log('✓ Connected to database:', db.databaseName);

  console.log('Creating indexes...');
  await ensureIndexes(db);
  console.log('✓ Indexes created successfully');

  console.log('\nCollections:');
  const collections = await db.listCollections().toArray();
  for (const col of collections) {
    console.log(`  - ${col.name}`);
    const indexes = await db.collection(col.name).indexes();
    for (const idx of indexes) {
      console.log(`    Index: ${idx.name} → ${JSON.stringify(idx.key)}`);
    }
  }

  console.log('\n✓ Database setup complete!');
  process.exit(0);
}

setup().catch((err) => {
  console.error('✗ Setup failed:', err.message);
  process.exit(1);
});
