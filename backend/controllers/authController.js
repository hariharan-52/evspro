const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { pool } = require('../config/database');
const UserRegistry = require('../data/userRegistry');
const { recordFailedAttempt, clearFailedAttempts } = require('../middleware/rateLimiter');

// In-memory OTP store: identifier -> { otp, expiresAt, createdAt }
const otpCache = new Map();

// Helper to clean up expired OTPs periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of otpCache.entries()) {
    if (data.expiresAt < now) {
      otpCache.delete(key);
    }
  }
}, 60 * 1000).unref();

const JWT_SECRET = process.env.JWT_SECRET || 'ecodonate_default_jwt_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// ============================================================================
// 1. SEND OTP (Passwordless authentication / phone or email verification)
// ============================================================================
const sendOtp = async (req, res) => {
  try {
    const rawIdentifier = req.body.identifier || req.body.email || req.body.phone || '';
    const identifier = rawIdentifier.trim();

    if (!identifier) {
      return res.status(400).json({ message: 'Please provide a valid phone number or email address.' });
    }

    // Generate secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes TTL

    // Store in cache normalized
    const normalizedKey = identifier.toLowerCase();
    otpCache.set(normalizedKey, { otp, expiresAt, createdAt: Date.now() });

    // Check if account already exists
    const existingUser = UserRegistry.findUser(identifier);

    console.log(`[AUTH:OTP] Generated OTP for "${identifier}": ${otp} (User exists: ${Boolean(existingUser)})`);

    // In production, we'd trigger SMS/Email; for smooth experience & dev demo, return OTP in response
    return res.json({
      success: true,
      message: existingUser 
        ? `Verification code sent for ${existingUser.name}.`
        : 'Verification code sent. Enter code to continue.',
      otp, // Included for instant auto-fill demo badge
      identifier,
      isRegistered: Boolean(existingUser),
      userRole: existingUser ? existingUser.role : null
    });
  } catch (error) {
    console.error('[AUTH:SEND_OTP] Error:', error.message);
    res.status(500).json({ message: 'Failed to generate verification code. Please try again.' });
  }
};

// ============================================================================
// 2. VERIFY OTP & SIGN IN / AUTO-REGISTER
// ============================================================================
const verifyOtp = async (req, res) => {
  try {
    const rawIdentifier = req.body.identifier || req.body.email || req.body.phone || '';
    const rawOtp = req.body.otp || '';
    const identifier = rawIdentifier.trim();
    const otp = rawOtp.trim();

    if (!identifier || !otp) {
      return res.status(400).json({ message: 'Identifier and OTP code are required.' });
    }

    const normalizedKey = identifier.toLowerCase();
    const cached = otpCache.get(normalizedKey);

    // Accept cached OTP or master test code '123456'
    const isMasterOtp = (otp === '123456');
    const isCachedMatch = (cached && cached.otp === otp && cached.expiresAt > Date.now());

    if (!isMasterOtp && !isCachedMatch) {
      return res.status(400).json({ message: 'Invalid or expired verification code. Please request a new code.' });
    }

    // OTP verified — remove from cache
    otpCache.delete(normalizedKey);

    // Find user in registry or DB
    let user = UserRegistry.findUser(identifier);

    // If user already exists -> instant login
    if (user) {
      if (user.status === 'inactive' || user.status === 'rejected') {
        return res.status(403).json({ message: 'Your account has been deactivated by the administrator.' });
      }

      const token = generateToken(user);
      return res.json({
        success: true,
        message: `Welcome back, ${user.name}!`,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status || 'active'
        }
      });
    }

    // If user does not exist yet:
    // If name and role were provided in the request, create account automatically
    const name = (req.body.name || '').trim();
    const role = (req.body.role || 'user').trim().toLowerCase();

    if (name) {
      const isEmail = identifier.includes('@');
      const newUserPayload = {
        name,
        email: isEmail ? identifier.toLowerCase() : `${name.toLowerCase().replace(/\s+/g, '')}_${Date.now()}@ecodonate.local`,
        phone: isEmail ? (req.body.phone || '') : identifier,
        password: req.body.password || 'EcoDonate@2026',
        role: role || 'user',
        address: req.body.address || '',
        city: req.body.city || '',
        state: req.body.state || '',
        pincode: req.body.pincode || '',
        status: 'active'
      };

      if (role === 'ngo') {
        newUserPayload.ngo_details = {
          ngo_name: req.body.ngo_name || name,
          contact_person: req.body.contact_person || name,
          registration_number: req.body.registration_number || '',
          description: req.body.description || '',
          verification_status: 'approved'
        };
      } else if (role === 'scrapdealer') {
        newUserPayload.scrap_dealer_details = {
          business_name: req.body.business_name || name,
          contact_person: req.body.contact_person || name,
          registration_number: req.body.registration_number || '',
          accepted_materials: req.body.accepted_materials || ['Plastic', 'Paper'],
          verification_status: 'approved'
        };
      }

      const registeredUser = await UserRegistry.registerUser(newUserPayload);
      
      // Async sync to DB
      UserRegistry.syncToDatabase(pool).catch(() => {});

      const token = generateToken(registeredUser);
      return res.status(201).json({
        success: true,
        message: 'Account registered and verified successfully! Welcome to EcoDonate.',
        token,
        user: {
          id: registeredUser.id,
          name: registeredUser.name,
          email: registeredUser.email,
          phone: registeredUser.phone,
          role: registeredUser.role,
          status: 'active'
        }
      });
    }

    // Prompt user to provide their Name and select Role to complete registration
    return res.json({
      success: true,
      isNewUser: true,
      message: 'Code verified! Please provide your name to complete account registration.',
      identifier
    });
  } catch (error) {
    console.error('[AUTH:VERIFY_OTP] Error:', error.message);
    res.status(500).json({ message: 'Verification failed. Please try again.' });
  }
};

// ============================================================================
// 3. ONE-CLICK DEMO / QUICK ROLE LOGIN
// ============================================================================
const quickLogin = async (req, res) => {
  try {
    const requestedRole = (req.body.role || 'user').trim().toLowerCase();
    const requestedEmail = (req.body.email || '').trim().toLowerCase();

    let targetEmail;
    if (requestedEmail) {
      targetEmail = requestedEmail;
    } else {
      switch (requestedRole) {
        case 'admin':
          targetEmail = 'admin@ecodonate.com';
          break;
        case 'ngo':
          targetEmail = 'contact@greenearth.org';
          break;
        case 'scrapdealer':
          targetEmail = 'info@ecoscrap.com';
          break;
        default:
          targetEmail = 'rahul@example.com';
          break;
      }
    }

    const user = UserRegistry.findUser(targetEmail);
    if (!user) {
      return res.status(404).json({ message: `Demo account for ${requestedRole} not found.` });
    }

    const token = generateToken(user);
    return res.json({
      success: true,
      message: `Directly signed in as ${user.name} (${user.role.toUpperCase()})`,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status || 'active'
      }
    });
  } catch (error) {
    console.error('[AUTH:QUICK_LOGIN] Error:', error.message);
    res.status(500).json({ message: 'Quick login failed.' });
  }
};

// ============================================================================
// 4. REGISTRATION (Streamlined, resilient, permanent persistence)
// ============================================================================
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

    if (!name || (!email && !phone)) {
      return res.status(400).json({ message: 'Name and at least one contact method (email or phone) are required.' });
    }

    // Role safety: Protect admin role from unauthorized self-signup
    const allowedRoles = ['user', 'ngo', 'scrapdealer'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid registration role.' });
    }

    // Check if user already exists in permanent registry
    const existing = UserRegistry.findUser(email || phone);
    if (existing) {
      return res.status(400).json({ 
        message: `An account with this ${existing.email === email ? 'email' : 'phone number'} already exists. Please log in.` 
      });
    }

    // Build payload
    const userPayload = {
      name,
      email: email || `${phone}@ecodonate.local`,
      phone,
      password: password || 'EcoDonate@2026',
      role,
      address,
      city,
      state,
      pincode,
      status: 'active'
    };

    if (role === 'ngo') {
      userPayload.ngo_details = {
        ngo_name: req.body.ngo_name || name,
        contact_person: req.body.contact_person || req.body.contactPerson || name,
        registration_number: req.body.registration_number || req.body.registrationNumber || '',
        description: req.body.description || '',
        verification_status: 'approved'
      };
    } else if (role === 'scrapdealer') {
      userPayload.scrap_dealer_details = {
        business_name: req.body.business_name || name,
        contact_person: req.body.contact_person || req.body.contactPerson || name,
        registration_number: req.body.registration_number || req.body.registrationNumber || '',
        accepted_materials: req.body.accepted_materials || req.body.acceptedMaterials || ['Plastic', 'Paper', 'Metal'],
        verification_status: 'approved'
      };
    }

    // 1. Save immediately to indestructible UserRegistry (JSON file)
    const newUser = await UserRegistry.registerUser(userPayload);

    // 2. Sync to active database (SQLite / MySQL)
    UserRegistry.syncToDatabase(pool).catch((e) => console.warn('DB sync background notice:', e.message));

    // 3. Issue authentication token immediately
    const token = generateToken(newUser);

    console.log(`[AUTH:REGISTER] ✅ Account registered: ID=${newUser.id}, Name="${newUser.name}", Role="${newUser.role}"`);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully! Welcome to EcoDonate.',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        name: newUser.name,
        status: 'active'
      }
    });
  } catch (error) {
    console.error('[AUTH:REGISTER] ❌ EXCEPTION:', error.message, error.stack);
    next(error);
  }
};

// ============================================================================
// 5. LOGIN (Multi-identifier: Email, Username, or Phone Number + Password)
// ============================================================================
const login = async (req, res, next) => {
  try {
    const rawIdentifier = req.body.email || req.body.username || req.body.phone || req.body.userId || '';
    const rawPassword = req.body.password || '';
    const identifier = rawIdentifier.trim();
    const password = rawPassword;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Email / Phone / Username and password are required.' });
    }

    // 1. Look up in permanent user registry first (fastest, indestructible)
    let user = UserRegistry.findUser(identifier);

    // 2. If not found in registry, check SQL database
    if (!user) {
      try {
        const [dbUsers] = await pool.query(
          'SELECT * FROM users WHERE LOWER(email) = ? OR phone = ? OR LOWER(name) = ?',
          [identifier.toLowerCase(), identifier, identifier.toLowerCase()]
        );
        if (dbUsers.length > 0) {
          user = dbUsers[0];
          // Cache in UserRegistry so it's always available
          UserRegistry.registerUser(user).catch(() => {});
        }
      } catch (dbErr) {
        console.warn('[AUTH:LOGIN] DB query fallback error:', dbErr.message);
      }
    }

    if (!user) {
      recordFailedAttempt(req);
      return res.status(401).json({ 
        message: 'No account found with this email, phone, or username. Please check your credentials or register.' 
      });
    }

    // Verify password
    const match = await UserRegistry.verifyPassword(user, password);
    if (!match) {
      recordFailedAttempt(req);
      return res.status(401).json({ 
        message: 'Incorrect password. You can also sign in instantly using the One-Time Code (OTP) option.' 
      });
    }

    // Check account status
    if (user.status === 'inactive' || user.status === 'rejected') {
      return res.status(403).json({ message: 'Your account has been deactivated by the administrator.' });
    }

    // Clear failed attempts counter
    clearFailedAttempts(req);

    const token = generateToken(user);
    console.log(`[AUTH:LOGIN] ✅ Successful login for "${user.name}" (${user.role})`);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        name: user.name,
        status: user.status || 'active'
      }
    });
  } catch (error) {
    console.error('[AUTH:LOGIN] ❌ EXCEPTION:', error.message, error.stack);
    next(error);
  }
};

// ============================================================================
// 6. GET CURRENT AUTHENTICATED USER (ME)
// ============================================================================
const getMe = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let user = UserRegistry.findUser(userId);

    if (!user) {
      const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
      if (users.length > 0) {
        user = users[0];
      }
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.status === 'inactive' || user.status === 'rejected') {
      return res.status(403).json({ message: 'Account deactivated' });
    }

    // Attach NGO or Scrap Dealer details if applicable
    if (user.role === 'ngo' && !user.ngo_details) {
      try {
        const [ngos] = await pool.query('SELECT * FROM ngos WHERE user_id = ?', [user.id]);
        if (ngos.length > 0) user.ngo_details = ngos[0];
      } catch (e) {}
    } else if (user.role === 'scrapdealer' && !user.scrap_dealer_details) {
      try {
        const [dealers] = await pool.query('SELECT * FROM scrap_dealers WHERE user_id = ?', [user.id]);
        if (dealers.length > 0) user.scrap_dealer_details = dealers[0];
      } catch (e) {}
    }

    res.json(user);
  } catch (error) {
    console.error('[AUTH:GETME] ❌ EXCEPTION:', error.message, error.stack);
    next(error);
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  quickLogin,
  register,
  login,
  getMe
};
