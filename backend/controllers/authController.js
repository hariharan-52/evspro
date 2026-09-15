const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role, address, city, state, pincode, ngo_name, registration_number, business_name, accepted_materials, contact_person, description } = req.body;
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userStatus = (role === 'ngo' || role === 'scrapdealer') ? 'pending' : 'active';

    const [result] = await pool.query(
      'INSERT INTO users (name, email, phone, password_hash, role, address, city, state, pincode, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, phone, passwordHash, role, address, city, state, pincode, userStatus]
    );

    const userId = result.insertId;

    if (role === 'ngo') {
      await pool.query(
        'INSERT INTO ngos (user_id, ngo_name, contact_person, registration_number, description, verification_status) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, ngo_name || name, contact_person || null, registration_number || null, description || null, 'pending']
      );
    } else if (role === 'scrapdealer') {
      await pool.query(
        'INSERT INTO scrap_dealers (user_id, business_name, contact_person, registration_number, accepted_materials, verification_status) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, business_name || name, contact_person || null, registration_number || null, accepted_materials ? JSON.stringify(accepted_materials) : '[]', 'pending']
      );
    }

    if (role === 'ngo' || role === 'scrapdealer') {
      return res.status(201).json({
        message: 'Registration submitted successfully! Your account is pending administrator verification and approval before you can log in.',
        user: { id: userId, email, role, name, status: 'pending' },
        requiresApproval: true
      });
    }

    const jwtSecret = process.env.JWT_SECRET || 'ecodonate_default_jwt_secret_key_2026';
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    const token = jwt.sign({ id: userId, email, role, name }, jwtSecret, { expiresIn: jwtExpiresIn });
    res.status(201).json({ message: 'User registered successfully', token, user: { id: userId, email, role, name, status: userStatus } });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const rawEmail = req.body.email || '';
    const rawPassword = req.body.password || '';
    const email = rawEmail.trim().toLowerCase();
    const password = rawPassword.trim();

    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const [users] = await pool.query('SELECT * FROM users WHERE LOWER(email) = ?', [email]);
    if (users.length === 0) return res.status(401).json({ message: 'Invalid credentials. User not found.' });

    const user = users[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    
    // Check NGO verification status
    if (user.role === 'ngo') {
      const [ngos] = await pool.query('SELECT verification_status, rejection_reason FROM ngos WHERE user_id = ?', [user.id]);
      const ngo = ngos[0];
      const status = ngo?.verification_status || user.status;
      if (status === 'pending') {
        return res.status(403).json({
          message: 'Your NGO account is pending Admin approval. You will be able to log in once your organization is verified and approved by the administrator.'
        });
      }
      if (status === 'rejected') {
        const reason = ngo?.rejection_reason ? ` Reason: ${ngo.rejection_reason}` : '';
        return res.status(403).json({
          message: `Your NGO registration was rejected by the administrator.${reason}`
        });
      }
    }

    // Check Scrap Dealer verification status
    if (user.role === 'scrapdealer') {
      const [dealers] = await pool.query('SELECT verification_status, rejection_reason FROM scrap_dealers WHERE user_id = ?', [user.id]);
      const dealer = dealers[0];
      const status = dealer?.verification_status || user.status;
      if (status === 'pending') {
        return res.status(403).json({
          message: 'Your Scrap Dealer account is pending Admin approval. You will be able to log in once your business is verified and approved by the administrator.'
        });
      }
      if (status === 'rejected') {
        const reason = dealer?.rejection_reason ? ` Reason: ${dealer.rejection_reason}` : '';
        return res.status(403).json({
          message: `Your Scrap Dealer registration was rejected by the administrator.${reason}`
        });
      }
    }

    if (user.status === 'pending') {
      return res.status(403).json({ message: 'Your account is pending administrator approval.' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'ecodonate_default_jwt_secret_key_2026';
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, jwtSecret, { expiresIn: jwtExpiresIn });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name, status: user.status } });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const [users] = await pool.query('SELECT id, name, email, phone, role, address, city, state, pincode, profile_image, status, created_at FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });
    
    let user = users[0];
    if (user.role === 'ngo') {
      const [ngos] = await pool.query('SELECT * FROM ngos WHERE user_id = ?', [user.id]);
      if (ngos.length > 0) user.ngo_details = ngos[0];
    } else if (user.role === 'scrapdealer') {
      const [dealers] = await pool.query('SELECT * FROM scrap_dealers WHERE user_id = ?', [user.id]);
      if (dealers.length > 0) user.scrap_dealer_details = dealers[0];
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe };
