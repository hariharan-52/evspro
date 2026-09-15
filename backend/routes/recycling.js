const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { uploadSingle } = require('../middleware/upload');
const { createRecycling, getRecyclingRequests, getRecyclingById, updateRecyclingStatus } = require('../controllers/recyclingController');

router.post('/', auth, requireRole('user'), uploadSingle('image'), createRecycling);
router.get('/', auth, getRecyclingRequests);
router.get('/:id', auth, getRecyclingById);
router.patch('/:id/status', auth, requireRole('admin', 'scrapdealer'), updateRecyclingStatus);

module.exports = router;
