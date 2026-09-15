const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { register, login, getMe } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getMe);
router.post('/logout', (req, res) => res.json({ message: 'Logged out' }));

module.exports = router;
