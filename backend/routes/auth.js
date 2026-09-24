const express = require('express');
const router = express.Router();
const { auth, revokeToken } = require('../middleware/auth');
const { loginRateLimiter } = require('../middleware/rateLimiter');
const { register, login, getMe } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', loginRateLimiter, login);
router.get('/me', auth, getMe);
router.post('/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    revokeToken(token);
  }
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
