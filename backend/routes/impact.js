const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getPlatformImpact, getUserImpact } = require('../controllers/impactController');

router.get('/platform', getPlatformImpact);
router.get('/user', auth, getUserImpact);

module.exports = router;
