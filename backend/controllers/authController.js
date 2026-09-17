const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const register = async (req, res, next) => {
  try {
    console.log('[AUTH:REGISTER] Incoming registration request body keys:', Object.keys(req.body));

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

    console.log(`[AUTH:REGISTER] Processing: name="${name}", email="${email}", role="${role}", city="${city}"`);

    if (!name || !email || !password || !role) {
      console.log('[AUTH:REGISTER] ❌ Validation failed — missing required fields');
      return res.status(400).json({ message: 'Name, email, password, and role are required' });
    }

    // Check for existing email
    const [existing] = await pool.query('SELECT id FROM users WHERE LOWER(email) = ?', [email]);
    console.log(`[AUTH:REGISTER] Existing users with email "${email}": ${existing.length}`);
    if (existing.length > 0) {
      console.log(`[AUTH:REGISTER] ❌ Duplicate email — user ID ${existing[0].id} already exists`);
      return res.status(400).json({ message: 'An account with this email address already exists. Please log in.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userStatus = (role === 'ngo' || role === 'scrapdealer') ? 'pending' : 'active';

    const [result] = await pool.query(
      'INSERT INTO users (name, email, phone, password_hash, role, address, city, state, pincode, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, phone, passwordHash, role, address, city, state, pincode, userStatus]
    );

    const userId = result.insertId;
    console.log(`[AUTH:REGISTER] ✅ User created — ID=${userId}, email="${email}", role="${role}", status="${userStatus}"`);

    if (role === 'ngo') {
      const ngo_name = req.body.ngo_name || name;
      const contact_person = req.body.contact_person || req.body.contactPerson || name;
      const registration_number = req.body.registration_number || req.body.registrationNumber || null;
      const description = req.body.description || null;

      await pool.query(
        'INSERT INTO ngos (user_id, ngo_name, contact_person, registration_number, description, verification_status) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, ngo_name, contact_person, registration_number, description, 'pending']
      );
      console.log(`[AUTH:REGISTER] ✅ NGO record created for user ID=${userId}`);
    } else if (role === 'scrapdealer') {
      const business_name = req.body.business_name || name;
      const contact_person = req.body.contact_person || req.body.contactPerson || name;
      const registration_number = req.body.registration_number || req.body.registrationNumber || null;
      const accepted_materials = req.body.accepted_materials || req.body.acceptedMaterials || [];

      await pool.query(
        'INSERT INTO scrap_dealers (user_id, business_name, contact_person, registration_number, accepted_materials, verification_status) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, business_name, contact_person, registration_number, Array.isArray(accepted_materials) ? JSON.stringify(accepted_materials) : (typeof accepted_materials === 'string' ? accepted_materials : '[]'), 'pending']
      );
      console.log(`[AUTH:REGISTER] ✅ Scrap Dealer record created for user ID=${userId}`);
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
    console.log(`[AUTH:REGISTER] ✅ JWT issued for user ID=${userId}`);
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

    console.log(`[AUTH:LOGIN] Attempt for email="${email}"`);

    if (!email || !password) {
      console.log('[AUTH:LOGIN] ❌ Missing email or password');
      return res.status(400).json({ message: 'Email and password required' });
    }

    const [users] = await pool.query('SELECT * FROM users WHERE LOWER(email) = ?', [email]);
    console.log(`[AUTH:LOGIN] Found ${users.length} user(s) with email "${email}"`);
    if (users.length === 0) return res.status(401).json({ message: 'Invalid credentials. No account found with this email address.' });

    const user = users[0];
    console.log(`[AUTH:LOGIN] User found: ID=${user.id}, role="${user.role}", status="${user.status}"`);
    
    const match = await bcrypt.compare(password, user.password_hash);
    console.log(`[AUTH:LOGIN] Password match: ${match}`);
    if (!match) return res.status(401).json({ message: 'Invalid credentials. Incorrect password.' });
    
    // Check NGO verification status
    if (user.role === 'ngo') {
      const [ngos] = await pool.query('SELECT verification_status, rejection_reason FROM ngos WHERE user_id = ?', [user.id]);
      const ngo = ngos[0];
      const status = ngo?.verification_status || user.status;
      console.log(`[AUTH:LOGIN] NGO verification status: "${status}"`);
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
      console.log(`[AUTH:LOGIN] Scrap Dealer verification status: "${status}"`);
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
      console.log('[AUTH:LOGIN] ❌ User status is pending');
      return res.status(403).json({ message: 'Your account is pending administrator approval.' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'ecodonate_default_jwt_secret_key_2026';
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, jwtSecret, { expiresIn: jwtExpiresIn });
    console.log(`[AUTH:LOGIN] ✅ Login success — ID=${user.id}, email="${user.email}", role="${user.role}"`);
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name, status: user.status } });
  } catch (error) {
    console.error('[AUTH:LOGIN] ❌ EXCEPTION:', error.message, error.stack);
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    console.log(`[AUTH:GETME] Fetching user data for ID=${req.user.id}`);
    const [users] = await pool.query('SELECT id, name, email, phone, role, address, city, state, pincode, profile_image, status, created_at FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      console.log(`[AUTH:GETME] ❌ User ID=${req.user.id} not found in database`);
      return res.status(404).json({ message: 'User not found' });
    }
    
    let user = users[0];
    if (user.role === 'ngo') {
      const [ngos] = await pool.query('SELECT * FROM ngos WHERE user_id = ?', [user.id]);
      if (ngos.length > 0) user.ngo_details = ngos[0];
    } else if (user.role === 'scrapdealer') {
      const [dealers] = await pool.query('SELECT * FROM scrap_dealers WHERE user_id = ?', [user.id]);
      if (dealers.length > 0) user.scrap_dealer_details = dealers[0];
    }

    console.log(`[AUTH:GETME] ✅ User data returned for ID=${user.id}, role="${user.role}"`);
    res.json(user);
  } catch (error) {
    console.error('[AUTH:GETME] ❌ EXCEPTION:', error.message, error.stack);
    next(error);
  }
};

module.exports = { register, login, getMe };
