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
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'EcoDonate API is operational',
    environment: process.env.VERCEL ? 'vercel-serverless' : 'standalone-node',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/recycling', recyclingRoutes);
app.use('/api/ngos', ngoRoutes);
app.use('/api/scrap-dealers', scrapDealerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/impact', impactRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/classify', classifyRoutes);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
