const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { getScrapDealers, getScrapDealerById, verifyScrapDealer, updateScrapDealerProfile, getScrapDealerDashboard } = require('../controllers/scrapDealerController');

router.get('/', getScrapDealers);
router.get('/dashboard', auth, requireRole('scrapdealer'), getScrapDealerDashboard);
router.put('/profile', auth, requireRole('scrapdealer'), updateScrapDealerProfile);
router.get('/:id', auth, getScrapDealerById);
router.patch('/:id/verify', auth, requireRole('admin'), verifyScrapDealer);

module.exports = router;
