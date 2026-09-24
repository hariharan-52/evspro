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
    const [existingNGO] = await pool.query('SELECT * FROM ngos WHERE user_id = ?', [req.user.id]);
    if (existingNGO.length === 0) return res.status(404).json({ message: 'NGO record not found' });
    const curr = existingNGO[0];

    const ngo_name = req.body.ngo_name || req.body.ngoName || curr.ngo_name;
    const contact_person = req.body.contact_person || req.body.contactPerson || curr.contact_person;
    const description = req.body.description !== undefined ? req.body.description : curr.description;

    await pool.query(
      'UPDATE ngos SET ngo_name = ?, contact_person = ?, description = ? WHERE user_id = ?', 
      [ngo_name, contact_person, description, req.user.id]
    );

    // Also update organization address, city, state, pincode, phone in users table
    const [existingUser] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (existingUser.length > 0) {
      const u = existingUser[0];
      const name = ngo_name || u.name;
      const phone = req.body.phone !== undefined ? req.body.phone : u.phone;
      const address = req.body.address !== undefined ? req.body.address : u.address;
      const city = req.body.city !== undefined ? req.body.city : u.city;
      const state = req.body.state !== undefined ? req.body.state : u.state;
      const pincode = req.body.pincode !== undefined ? req.body.pincode : u.pincode;

      await pool.query(
        'UPDATE users SET name = ?, phone = ?, address = ?, city = ?, state = ?, pincode = ? WHERE id = ?',
        [name, phone, address, city, state, pincode, req.user.id]
      );
    }

    res.json({ message: 'NGO profile updated successfully' });
  } catch (error) {
    next(error);
  }
};

const getNGODashboard = async (req, res, next) => {
  try {
    const [ngo] = await pool.query('SELECT id, verification_status, rejection_reason FROM ngos WHERE user_id = ?', [req.user.id]);
    if (ngo.length === 0) return res.status(404).json({ message: 'Not found' });
    
    const ngoId = ngo[0].id;
    const [stats] = await pool.query(
      `SELECT status, COUNT(*) as count FROM donations WHERE ngo_id = ? GROUP BY status`, [ngoId]
    );
    res.json({ stats, verification_status: ngo[0].verification_status, rejection_reason: ngo[0].rejection_reason });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNGOs, getNGOById, verifyNGO, updateNGOProfile, getNGODashboard };
