const app = require('../backend/app');
const { testConnection } = require('../backend/config/database');

// Ensure database connection / embedded SQLite initialization is executed on cold start
let isReady = false;
let initPromise = null;

const ensureReady = async () => {
  if (isReady) return;
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await testConnection();
        isReady = true;
      } catch (err) {
        console.error('Error during Vercel serverless DB initialization:', err);
      }
    })();
  }
  await initPromise;
};

module.exports = async (req, res) => {
  try {
    await ensureReady();
    return app(req, res);
  } catch (err) {
    console.error('Unhandled Vercel serverless function error:', err);
    if (!res.headersSent) {
      res.status(500).json({
        message: 'A server error occurred while processing the request',
        error: err.message
      });
    }
  }
};

// Configure Vercel serverless function limits
module.exports.config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb'
    }
  }
};
