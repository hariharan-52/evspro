const express = require('express');
const router = express.Router();
const { auth, revokeToken } = require('../middleware/auth');
const { loginRateLimiter } = require('../middleware/rateLimiter');
const {
  sendOtp,
  verifyOtp,
  register,
  login,
  getMe
} = require('../controllers/authController');

// Passwordless OTP Authentication routes
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);

// Standard registration and password login
router.post('/register', register);
router.post('/login', loginRateLimiter, login);

// Session inspection and logout
router.get('/me', auth, getMe);
router.post('/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    revokeToken(token);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
