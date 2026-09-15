const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { 
  getDashboardStats, 
  getMonthlyStats, 
  getWasteCategoryStats, 
  getUserRoleStats, 
  getPendingVerifications,
  getPlatformReports
} = require('../controllers/adminController');

router.use(auth, requireRole('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/reports', getPlatformReports);
router.get('/stats/monthly', getMonthlyStats);
router.get('/stats/waste-categories', getWasteCategoryStats);
router.get('/stats/user-roles', getUserRoleStats);
router.get('/verifications/pending', getPendingVerifications);

module.exports = router;
