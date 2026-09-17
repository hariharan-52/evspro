require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');

const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const donationRoutes = require('./routes/donations');
const recyclingRoutes = require('./routes/recycling');
const ngoRoutes = require('./routes/ngos');
const scrapDealerRoutes = require('./routes/scrapDealers');
const adminRoutes = require('./routes/admin');
const impactRoutes = require('./routes/impact');
const notificationRoutes = require('./routes/notifications');
const classifyRoutes = require('./routes/classify');

const app = express();

// Enable CORS for frontend requests
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request/Response logger
app.use((req, res, next) => {
  const start = Date.now();
  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - start;
    const isApi = req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/auth');
    if (isApi) {
      console.log(`[HTTP] ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`);
    }
    originalEnd.apply(res, args);
  };
  next();
});

// Uploads directory config (compatible with Vercel serverless /tmp and local dev)
const uploadsDir = process.env.VERCEL
  ? path.join(os.tmpdir(), 'uploads')
  : path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch (e) {
    // Ignore error if directory already exists
  }
}

app.use('/uploads', express.static(uploadsDir));
app.use('/api/uploads', express.static(uploadsDir));

// Root & Health check endpoints
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'EcoDonate Backend API Service',
    timestamp: new Date().toISOString()
  });
});

app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'ok',
    message: 'EcoDonate API is operational',
    environment: process.env.VERCEL ? 'vercel-serverless' : 'standalone-node',
    timestamp: new Date().toISOString()
  });
});

// API Routes (support both /api/* and /* paths for flexible proxying)
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/users', '/users'], userRoutes);
app.use(['/api/donations', '/donations'], donationRoutes);
app.use(['/api/recycling', '/recycling'], recyclingRoutes);
app.use(['/api/ngos', '/ngos'], ngoRoutes);
app.use(['/api/scrap-dealers', '/scrap-dealers'], scrapDealerRoutes);
app.use(['/api/admin', '/admin'], adminRoutes);
app.use(['/api/impact', '/impact'], impactRoutes);
app.use(['/api/notifications', '/notifications'], notificationRoutes);
app.use(['/api/classify', '/classify'], classifyRoutes);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
