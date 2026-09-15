const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getNotifications, markAsRead, getUnreadCount } = require('../controllers/notificationController');

router.use(auth);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/all/read', markAsRead); // mark all read: id='all' handled in controller
router.patch('/:id/read', markAsRead);

module.exports = router;
