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

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const totalCount = total || 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / limitNum));

    res.json({ users, total: totalCount, totalPages, page: pageNum, limit: limitNum });
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
    const id = req.user.role === 'admin' && req.params.id && req.params.id !== 'profile' ? req.params.id : req.user.id;
    const [existing] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ message: 'User not found' });
    
    const curr = existing[0];
    const name = req.body.name !== undefined ? req.body.name : curr.name;
    const phone = req.body.phone !== undefined ? req.body.phone : curr.phone;
    const address = req.body.address !== undefined ? req.body.address : curr.address;
    const city = req.body.city !== undefined ? req.body.city : curr.city;
    const state = req.body.state !== undefined ? req.body.state : curr.state;
    const pincode = req.body.pincode !== undefined ? req.body.pincode : curr.pincode;

    await pool.query(
      'UPDATE users SET name = ?, phone = ?, address = ?, city = ?, state = ?, pincode = ? WHERE id = ?',
      [name, phone, address, city, state, pincode, id]
    );

    const [updated] = await pool.query(
      'SELECT id, name, email, phone, role, address, city, state, pincode, status FROM users WHERE id = ?',
      [id]
    );

    res.json({ message: 'User updated successfully', user: updated[0] });
  } catch (error) {
    next(error);
  }
};

const toggleUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const userId = req.params.id;
    await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, userId]);

    // Keep verification status in sync for NGO and Scrap Dealer accounts
    if (status === 'inactive' || status === 'rejected') {
      await pool.query('UPDATE ngos SET verification_status = "rejected" WHERE user_id = ?', [userId]);
      await pool.query('UPDATE scrap_dealers SET verification_status = "rejected" WHERE user_id = ?', [userId]);
    } else if (status === 'active') {
      await pool.query('UPDATE ngos SET verification_status = "approved" WHERE user_id = ?', [userId]);
      await pool.query('UPDATE scrap_dealers SET verification_status = "approved" WHERE user_id = ?', [userId]);
    }

    res.json({ message: `User status set to ${status}` });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    await pool.query('DELETE FROM ngos WHERE user_id = ?', [userId]);
    await pool.query('DELETE FROM scrap_dealers WHERE user_id = ?', [userId]);
    await pool.query('DELETE FROM notifications WHERE user_id = ?', [userId]);
    await pool.query('DELETE FROM impact_records WHERE user_id = ?', [userId]);
    await pool.query('DELETE FROM users WHERE id = ?', [userId]);
    res.json({ message: 'User deleted successfully' });
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
