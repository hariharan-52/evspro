const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { getUsers, getUserById, updateUser, toggleUserStatus, deleteUser, getUserDashboard, getUserImpact } = require('../controllers/userController');

router.get('/', auth, requireRole('admin'), getUsers);
router.get('/dashboard', auth, getUserDashboard);
router.get('/impact', auth, getUserImpact);
router.get('/:id', auth, getUserById);
router.put('/:id?', auth, updateUser);
router.patch('/:id/status', auth, requireRole('admin'), toggleUserStatus);
router.delete('/:id', auth, requireRole('admin'), deleteUser);

module.exports = router;
