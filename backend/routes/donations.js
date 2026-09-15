const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { uploadSingle } = require('../middleware/upload');
const { createDonation, getDonations, getDonationById, updateDonationStatus, getMyDonations } = require('../controllers/donationController');

router.post('/', auth, requireRole('user'), uploadSingle('image'), createDonation);
router.get('/', auth, getDonations);
router.get('/my', auth, requireRole('user'), getMyDonations);
router.get('/:id', auth, getDonationById);
router.patch('/:id/status', auth, requireRole('admin', 'ngo'), updateDonationStatus);

module.exports = router;
