const express = require('express');
const router = express.Router();
const { auth, revokeToken } = require('../middleware/auth');
const { loginRateLimiter } = require('../middleware/rateLimiter');
const {
  registerRequest,
  verifyRegistrationOtp,
  resendRegistrationOtp,
  forgotPasswordSendOtp,
  forgotPasswordVerifyOtp,
  forgotPasswordReset,
  login,
  getMe,
  register
} = require('../controllers/authController');

// 1. Registration & Email OTP Verification
router.post('/register-request', registerRequest);
router.post('/register', register); // Alias for backwards compatibility
router.post('/verify-registration-otp', verifyRegistrationOtp);
router.post('/resend-registration-otp', resendRegistrationOtp);

// 2. Forgot Password Flow
router.post('/forgot-password/send-otp', forgotPasswordSendOtp);
router.post('/forgot-password/verify-otp', forgotPasswordVerifyOtp);
router.post('/forgot-password/reset', forgotPasswordReset);

// 3. Login
router.post('/login', loginRateLimiter, login);

// 4. Session & Logout
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
