const express = require('express');
const router = express.Router();
const { auth, optionalAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { getNGOs, getNGOById, verifyNGO, updateNGOProfile, getNGODashboard } = require('../controllers/ngoController');

router.get('/', optionalAuth, getNGOs);
router.get('/dashboard', auth, requireRole('ngo'), getNGODashboard);
router.put('/profile', auth, requireRole('ngo'), updateNGOProfile);
router.get('/:id', auth, getNGOById);
router.patch('/:id/verify', auth, requireRole('admin'), verifyNGO);

module.exports = router;
