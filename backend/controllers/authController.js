const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { recordFailedAttempt, clearFailedAttempts } = require('../middleware/rateLimiter');

const register = async (req, res, next) => {
  try {
    const rawName = req.body.name || '';
    const rawEmail = req.body.email || '';
    const rawPhone = req.body.phone || '';
    const rawPassword = req.body.password || '';
    const role = (req.body.role || 'user').trim().toLowerCase();
    const address = (req.body.address || '').trim();
    const city = (req.body.city || '').trim();
    const state = (req.body.state || '').trim();
    const pincode = (req.body.pincode || '').trim();

    const name = rawName.trim();
    const email = rawEmail.trim().toLowerCase();
    const phone = rawPhone.trim();
    const password = rawPassword;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required.' });
    }

    // Role protection: Administrator accounts CANNOT be registered publicly
    const allowedRoles = ['user', 'ngo', 'scrapdealer'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid registration role. Administrator accounts cannot be created publicly.' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    // Check for existing email (case-insensitive)
    const [existing] = await pool.query('SELECT id FROM users WHERE LOWER(email) = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'An account with this email address already exists. Please log in.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userStatus = (role === 'ngo' || role === 'scrapdealer') ? 'pending' : 'active';

    const [result] = await pool.query(
      'INSERT INTO users (name, email, phone, password_hash, role, address, city, state, pincode, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, phone, passwordHash, role, address, city, state, pincode, userStatus]
    );

    const userId = result.insertId;

    if (role === 'ngo') {
      const ngo_name = req.body.ngo_name || name;
      const contact_person = req.body.contact_person || req.body.contactPerson || name;
      const registration_number = req.body.registration_number || req.body.registrationNumber || null;
      const description = req.body.description || null;

      await pool.query(
        'INSERT INTO ngos (user_id, ngo_name, contact_person, registration_number, description, verification_status) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, ngo_name, contact_person, registration_number, description, 'pending']
      );
    } else if (role === 'scrapdealer') {
      const business_name = req.body.business_name || name;
      const contact_person = req.body.contact_person || req.body.contactPerson || name;
      const registration_number = req.body.registration_number || req.body.registrationNumber || null;
      const accepted_materials = req.body.accepted_materials || req.body.acceptedMaterials || [];

      await pool.query(
        'INSERT INTO scrap_dealers (user_id, business_name, contact_person, registration_number, accepted_materials, verification_status) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, business_name, contact_person, registration_number, Array.isArray(accepted_materials) ? JSON.stringify(accepted_materials) : (typeof accepted_materials === 'string' ? accepted_materials : '[]'), 'pending']
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
    console.error('[AUTH:REGISTER] ❌ EXCEPTION:', error.message, error.stack);
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const rawEmail = req.body.email || '';
    const rawPassword = req.body.password || '';
    const email = rawEmail.trim().toLowerCase();
    const password = rawPassword;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const [users] = await pool.query('SELECT * FROM users WHERE LOWER(email) = ?', [email]);
    if (users.length === 0) {
      // Perform constant-time dummy bcrypt comparison to prevent timing attacks and email enumeration
      await bcrypt.compare(password, '$2b$10$abcdefghijklmnopqrstuuNOPQRSTUVWXYZabcdefghijklmnopqr');
      recordFailedAttempt(req);
      return res.status(401).json({ message: 'Invalid email address or password. Please check your credentials.' });
    }

    const user = users[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      recordFailedAttempt(req);
      return res.status(401).json({ message: 'Invalid email address or password. Please check your credentials.' });
    }

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

    if (user.status === 'inactive' || user.status === 'rejected') {
      return res.status(403).json({ message: 'Your account has been deactivated or rejected by the administrator.' });
    }

    // Successful authentication: clear brute force counter for this client
    clearFailedAttempts(req);

    const jwtSecret = process.env.JWT_SECRET || 'ecodonate_default_jwt_secret_key_2026';
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, jwtSecret, { expiresIn: jwtExpiresIn });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name, status: user.status } });
  } catch (error) {
    console.error('[AUTH:LOGIN] ❌ EXCEPTION:', error.message, error.stack);
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const [users] = await pool.query('SELECT id, name, email, phone, role, address, city, state, pincode, profile_image, status, created_at FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    let user = users[0];

    // Ensure deactivated or rejected users cannot continue an active session
    if (user.status === 'inactive' || user.status === 'rejected') {
      return res.status(403).json({ message: 'Your account has been deactivated or rejected by the administrator.' });
    }

    if (user.role === 'ngo') {
      const [ngos] = await pool.query('SELECT * FROM ngos WHERE user_id = ?', [user.id]);
      if (ngos.length > 0) user.ngo_details = ngos[0];
    } else if (user.role === 'scrapdealer') {
      const [dealers] = await pool.query('SELECT * FROM scrap_dealers WHERE user_id = ?', [user.id]);
      if (dealers.length > 0) user.scrap_dealer_details = dealers[0];
    }

    res.json(user);
  } catch (error) {
    console.error('[AUTH:GETME] ❌ EXCEPTION:', error.message, error.stack);
    next(error);
  }
};

module.exports = { register, login, getMe };
