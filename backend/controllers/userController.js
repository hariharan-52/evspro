const { pool } = require('../config/database');

const getUsers = async (req, res, next) => {
  try {
    const { search, role, status, page = 1, limit = 20 } = req.query;
    let query = 'SELECT id, name, email, phone, role, city, state, status, created_at FROM users WHERE 1=1';
    const params = [];

    if (search && search.trim()) {
      query += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }
    if (role && role !== 'all' && role !== 'ALL') {
      query += ' AND role = ?';
      params.push(role);
    }
    if (status && status !== 'all' && status !== 'ALL') {
      query += ' AND status = ?';
      params.push(status);
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const countParams = [...params];

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), offset);

    const [users] = await pool.query(query, params);

    // Count total for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    if (search && search.trim()) { countQuery += ' AND (name LIKE ? OR email LIKE ?)'; }
    if (role && role !== 'all' && role !== 'ALL') { countQuery += ' AND role = ?'; }
    if (status && status !== 'all' && status !== 'ALL') { countQuery += ' AND status = ?'; }
    const [[{ total }]] = await pool.query(countQuery, countParams);

    res.json({ users, total: total || 0, page: parseInt(page, 10), limit: parseInt(limit, 10) });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const [users] = await pool.query('SELECT id, name, email, phone, role, address, city, state, pincode, status FROM users WHERE id = ?', [req.params.id]);
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(users[0]);
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { name, phone, address, city, state, pincode } = req.body;
    const id = req.user.role === 'admin' && req.params.id ? req.params.id : req.user.id;
    
    await pool.query('UPDATE users SET name=?, phone=?, address=?, city=?, state=?, pincode=? WHERE id=?',
      [name, phone, address, city, state, pincode, id]);
    res.json({ message: 'User updated' });
  } catch (error) {
    next(error);
  }
};

const toggleUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: `User status set to ${status}` });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (error) {
    next(error);
  }
};

const getUserDashboard = async (req, res, next) => {
  try {
    const [donations] = await pool.query('SELECT status, COUNT(*) as count FROM donations WHERE user_id = ? GROUP BY status', [req.user.id]);
    const [recycling] = await pool.query('SELECT status, COUNT(*) as count FROM recycling_requests WHERE user_id = ? GROUP BY status', [req.user.id]);
    res.json({ donations, recycling });
  } catch (error) {
    next(error);
  }
};

const getUserImpact = async (req, res, next) => {
  try {
    const [impacts] = await pool.query(
      `SELECT SUM(waste_weight_kg) as total_waste, SUM(items_count) as total_items, SUM(co2_saved_kg) as total_co2, SUM(impact_score) as total_score 
       FROM impact_records WHERE user_id = ?`, [req.user.id]
    );
    res.json(impacts[0] || {});
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, getUserById, updateUser, toggleUserStatus, deleteUser, getUserDashboard, getUserImpact };
