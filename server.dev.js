/**
 * Local development API server.
 * Runs Express on port 3001 so Vite can proxy /api requests to it.
 * This file is NOT deployed to Vercel — Vercel uses the /api directory directly.
 */
const express = require('express');
const { connectToDatabase, ensureIndexes } = require('./lib/db');

// Load .env for local development
try {
  require('dotenv').config();
} catch {
  // dotenv is optional — in production, env vars are set by the platform
}

const app = express();
const PORT = process.env.API_PORT || 3001;

// Body parsing with size limit
app.use(express.json({ limit: '12kb' }));

// Import route handlers
const createShareHandler = require('./api/shares/index');
const retrieveShareHandler = require('./api/shares/retrieve');
const healthHandler = require('./api/health');

// Routes
app.post('/api/shares', createShareHandler);
app.post('/api/shares/retrieve', retrieveShareHandler);
app.get('/api/health', healthHandler);

// 404 for unmatched API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

async function start() {
  try {
    const db = await connectToDatabase();
    await ensureIndexes(db);
    console.log('✓ Connected to MongoDB and ensured indexes');

    app.listen(PORT, () => {
      console.log(`✓ API server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('✗ Failed to start API server:', err.message);
    process.exit(1);
  }
}

start();
