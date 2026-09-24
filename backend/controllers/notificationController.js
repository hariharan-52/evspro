const { pool } = require('../config/database');

const getNotifications = async (req, res, next) => {
  try {
    const [notifications] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', 
      [req.user.id]
    );
    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isAll = id === 'all' || !id || (req.path && req.path.includes('/all')) || (req.originalUrl && req.originalUrl.includes('/all'));
    if (isAll) {
      await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    } else {
      await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [id, req.user.id]);
    }
    res.json({ message: 'Marked as read' });
  } catch (error) {
    next(error);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const [[count]] = await pool.query('SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND is_read = 0', [req.user.id]);
    res.json({ count: count.c });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotifications, markAsRead, getUnreadCount };
