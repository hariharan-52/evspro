const { pool } = require('../config/database');

const getNGOs = async (req, res, next) => {
  try {
    let query = 'SELECT n.*, u.name, u.email, u.phone, u.city, u.address, u.state, u.pincode, u.status as user_status FROM ngos n JOIN users u ON n.user_id = u.id';
    if (req.user && req.user.role !== 'admin') {
      query += ' WHERE n.verification_status = "approved"';
    }
    query += ' ORDER BY n.created_at DESC';
    const [ngos] = await pool.query(query);
    res.json(ngos);
  } catch (error) {
    next(error);
  }
};

const getNGOById = async (req, res, next) => {
  try {
    const [ngos] = await pool.query('SELECT n.*, u.name, u.email, u.phone, u.city, u.address, u.state, u.pincode, u.status as user_status FROM ngos n JOIN users u ON n.user_id = u.id WHERE n.id = ?', [req.params.id]);
    if (ngos.length === 0) return res.status(404).json({ message: 'NGO not found' });
    res.json(ngos[0]);
  } catch (error) {
    next(error);
  }
};

const verifyNGO = async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    const [ngo] = await pool.query('SELECT user_id, ngo_name FROM ngos WHERE id = ?', [req.params.id]);
    if (ngo.length === 0) return res.status(404).json({ message: 'NGO not found' });

    const newVerificationStatus = status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'pending';
    const userStatus = newVerificationStatus === 'approved' ? 'active' : newVerificationStatus === 'rejected' ? 'rejected' : 'pending';

    await pool.query('UPDATE ngos SET verification_status = ?, rejection_reason = ? WHERE id = ?', [newVerificationStatus, reason || null, req.params.id]);
    await pool.query('UPDATE users SET status = ? WHERE id = ?', [userStatus, ngo[0].user_id]);

    const notifTitle = newVerificationStatus === 'approved' ? 'NGO Registration Approved' : 'NGO Registration Rejected';
    const notifMsg = newVerificationStatus === 'approved'
      ? 'Congratulations! Your NGO registration has been verified and approved by the administrator. You can now log in and manage donation requests.'
      : `Your NGO registration was rejected by the administrator.${reason ? ' Reason: ' + reason : ''}`;

    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
      [ngo[0].user_id, notifTitle, notifMsg, 'account_alert']
    );

    res.json({ message: `NGO registration ${newVerificationStatus} successfully` });
  } catch (error) {
    next(error);
  }
};

const updateNGOProfile = async (req, res, next) => {
  try {
    const { ngo_name, contact_person, description } = req.body;
    await pool.query('UPDATE ngos SET ngo_name = ?, contact_person = ?, description = ? WHERE user_id = ?', 
      [ngo_name, contact_person, description, req.user.id]);
    res.json({ message: 'Profile updated' });
  } catch (error) {
    next(error);
  }
};

const getNGODashboard = async (req, res, next) => {
  try {
    const [ngo] = await pool.query('SELECT id FROM ngos WHERE user_id = ?', [req.user.id]);
    if (ngo.length === 0) return res.status(404).json({ message: 'Not found' });
    
    const ngoId = ngo[0].id;
    const [stats] = await pool.query(
      `SELECT status, COUNT(*) as count FROM donations WHERE ngo_id = ? GROUP BY status`, [ngoId]
    );
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

module.exports = { getNGOs, getNGOById, verifyNGO, updateNGOProfile, getNGODashboard };
