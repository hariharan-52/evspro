const app = require('../backend/app');
const { testConnection } = require('../backend/config/database');

// Ensure database connection / embedded SQLite initialization is executed on cold start
let isReady = false;
const initPromise = (async () => {
  try {
    await testConnection();
    isReady = true;
  } catch (err) {
    console.error('Error during Vercel serverless DB initialization:', err);
  }
})();

module.exports = async (req, res) => {
  if (!isReady) {
    await initPromise;
  }
  return app(req, res);
};

// Configure Vercel serverless function limits
module.exports.config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};
