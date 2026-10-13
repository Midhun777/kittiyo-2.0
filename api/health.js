const { connectToDatabase } = require('../lib/db');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const db = await connectToDatabase();
    await db.command({ ping: 1 });

    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  } catch {
    return res.status(503).json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
    });
  }
};
