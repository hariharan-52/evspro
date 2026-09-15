const { pool } = require('../config/database');

const getScrapDealers = async (req, res, next) => {
  try {
    let query = 'SELECT s.*, u.name, u.email, u.phone, u.city, u.address, u.state, u.pincode, u.status as user_status FROM scrap_dealers s JOIN users u ON s.user_id = u.id';
    if (req.user && req.user.role !== 'admin') {
      query += ' WHERE s.verification_status = "approved"';
    }
    query += ' ORDER BY s.created_at DESC';
    const [dealers] = await pool.query(query);
    res.json(dealers);
  } catch (error) {
    next(error);
  }
};

const getScrapDealerById = async (req, res, next) => {
  try {
    const [dealers] = await pool.query('SELECT s.*, u.name, u.email, u.phone, u.city, u.address, u.state, u.pincode, u.status as user_status FROM scrap_dealers s JOIN users u ON s.user_id = u.id WHERE s.id = ?', [req.params.id]);
    if (dealers.length === 0) return res.status(404).json({ message: 'Dealer not found' });
    res.json(dealers[0]);
  } catch (error) {
    next(error);
  }
};

const verifyScrapDealer = async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    const [dealer] = await pool.query('SELECT user_id, business_name FROM scrap_dealers WHERE id = ?', [req.params.id]);
    if (dealer.length === 0) return res.status(404).json({ message: 'Scrap Dealer not found' });

    const newVerificationStatus = status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'pending';
    const userStatus = newVerificationStatus === 'approved' ? 'active' : newVerificationStatus === 'rejected' ? 'rejected' : 'pending';

    await pool.query('UPDATE scrap_dealers SET verification_status = ?, rejection_reason = ? WHERE id = ?', [newVerificationStatus, reason || null, req.params.id]);
    await pool.query('UPDATE users SET status = ? WHERE id = ?', [userStatus, dealer[0].user_id]);

    const notifTitle = newVerificationStatus === 'approved' ? 'Scrap Dealer Registration Approved' : 'Scrap Dealer Registration Rejected';
    const notifMsg = newVerificationStatus === 'approved'
      ? 'Congratulations! Your Scrap Dealer business registration has been verified and approved by the administrator. You can now log in and manage recycling requests.'
      : `Your Scrap Dealer registration was rejected by the administrator.${reason ? ' Reason: ' + reason : ''}`;

    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
      [dealer[0].user_id, notifTitle, notifMsg, 'account_alert']
    );

    res.json({ message: `Scrap Dealer registration ${newVerificationStatus} successfully` });
  } catch (error) {
    next(error);
  }
};

const updateScrapDealerProfile = async (req, res, next) => {
  try {
    const { business_name, contact_person, accepted_materials } = req.body;
    await pool.query('UPDATE scrap_dealers SET business_name = ?, contact_person = ?, accepted_materials = ? WHERE user_id = ?', 
      [business_name, contact_person, JSON.stringify(accepted_materials || []), req.user.id]);
    res.json({ message: 'Profile updated' });
  } catch (error) {
    next(error);
  }
};

const getScrapDealerDashboard = async (req, res, next) => {
  try {
    const [sd] = await pool.query('SELECT id FROM scrap_dealers WHERE user_id = ?', [req.user.id]);
    if (sd.length === 0) return res.status(404).json({ message: 'Not found' });
    
    const [stats] = await pool.query(
      `SELECT status, COUNT(*) as count FROM recycling_requests WHERE scrap_dealer_id = ? GROUP BY status`, [sd[0].id]
    );
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

module.exports = { getScrapDealers, getScrapDealerById, verifyScrapDealer, updateScrapDealerProfile, getScrapDealerDashboard };
