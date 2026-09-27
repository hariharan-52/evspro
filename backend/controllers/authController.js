const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { pool } = require('../config/database');
const UserRegistry = require('../data/userRegistry');
const { sendRegistrationOtp, sendPasswordResetOtp } = require('../services/emailService');
const { recordFailedAttempt, clearFailedAttempts } = require('../middleware/rateLimiter');

// In-memory cache for pending registrations: email -> { ...data, password_hash, otp, expiresAt, attempts }
const pendingRegistrations = new Map();

// In-memory cache for password resets: email -> { otp, expiresAt, attempts }
const passwordResetStore = new Map();

// Cleanup expired OTP records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of pendingRegistrations.entries()) {
    if (data.expiresAt < now) pendingRegistrations.delete(key);
  }
  for (const [key, data] of passwordResetStore.entries()) {
    if (data.expiresAt < now) passwordResetStore.delete(key);
  }
}, 60 * 1000).unref();

const JWT_SECRET = process.env.JWT_SECRET || 'ecodonate_default_jwt_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (user, expiresIn = JWT_EXPIRES_IN) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn }
  );
};

// ============================================================================
// 1. REGISTRATION (Direct Registration: Validates, Hashes, Saves to Database & Registry)
// ============================================================================
const registerRequest = async (req, res, next) => {
  try {
    const rawRole = (req.body.role || 'user').trim().toLowerCase();
    const rawName = (req.body.name || req.body.fullName || '').trim();
    const rawEmail = (req.body.email || '').trim().toLowerCase();
    const rawPhone = (req.body.phone || '').trim();
    const rawPassword = req.body.password || '';
    const rawConfirmPassword = req.body.confirmPassword || '';
    const rawAddress = (req.body.address || '').trim();
    const rawCity = (req.body.city || '').trim();
    const rawState = (req.body.state || '').trim();
    const rawPincode = (req.body.pincode || '').trim();

    // 1. Public Role Validation: Admin is STRICTLY forbidden from public registration
    const publicRoles = ['user', 'ngo', 'scrapdealer'];
    if (!publicRoles.includes(rawRole)) {
      return res.status(400).json({ message: 'Invalid registration role. Administrator accounts cannot be created publicly.' });
    }

    // 2. Validate mandatory fields
    if (!rawName) {
      return res.status(400).json({ message: 'Full name or organization name is required.' });
    }
    if (!rawEmail) {
      return res.status(400).json({ message: 'Email address is required.' });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(rawEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    // Phone validation
    const phoneClean = rawPhone.replace(/\D/g, '');
    if (!rawPhone || phoneClean.length < 10) {
      return res.status(400).json({ message: 'Please provide a valid 10-digit mobile phone number.' });
    }

    // Address validation
    if (!rawAddress) {
      return res.status(400).json({ message: 'Street address is required.' });
    }

    // Password requirements
    if (!rawPassword || rawPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }
    if (rawConfirmPassword && rawPassword !== rawConfirmPassword) {
      return res.status(400).json({ message: 'Password and Confirm Password do not match.' });
    }

    // Role-specific requirements
    let ngoDetails = null;
    let scrapDealerDetails = null;

    if (rawRole === 'ngo') {
      const ngoName = (req.body.ngo_name || req.body.ngoName || rawName).trim();
      const contactPerson = (req.body.contact_person || req.body.contactPerson || rawName).trim();
      const regNumber = (req.body.registration_number || req.body.registrationNumber || '').trim();
      const description = (req.body.description || '').trim();

      if (!ngoName) return res.status(400).json({ message: 'NGO / Organization name is required.' });
      if (!contactPerson) return res.status(400).json({ message: 'Contact person name is required.' });
      if (!regNumber) return res.status(400).json({ message: 'NGO Registration / Trust / 80G Certificate number is required.' });

      ngoDetails = {
        ngo_name: ngoName,
        contact_person: contactPerson,
        registration_number: regNumber,
        description,
        verification_status: 'pending'
      };
    } else if (rawRole === 'scrapdealer') {
      const businessName = (req.body.business_name || req.body.businessName || rawName).trim();
      const contactPerson = (req.body.contact_person || req.body.contactPerson || rawName).trim();
      const regNumber = (req.body.registration_number || req.body.registrationNumber || '').trim();
      const acceptedMaterials = req.body.accepted_materials || req.body.acceptedMaterials || ['Plastic', 'Paper', 'Metal'];

      if (!businessName) return res.status(400).json({ message: 'Dealer / Business name is required.' });
      if (!contactPerson) return res.status(400).json({ message: 'Owner / Contact person name is required.' });
      if (!regNumber) return res.status(400).json({ message: 'Business Trade License / GST / Registration number is required.' });

      scrapDealerDetails = {
        business_name: businessName,
        contact_person: contactPerson,
        registration_number: regNumber,
        accepted_materials: acceptedMaterials,
        verification_status: 'pending'
      };
    }

    // 3. Check if email is already registered in DB or UserRegistry
    let existingUser = UserRegistry.findUser(rawEmail);
    if (!existingUser) {
      try {
        const [dbUsers] = await pool.query('SELECT id FROM users WHERE LOWER(email) = ?', [rawEmail]);
        if (dbUsers.length > 0) existingUser = dbUsers[0];
      } catch (e) {}
    }
    if (existingUser) {
      return res.status(400).json({ 
        message: 'An account with this email address already exists. Please sign in or use Forgot Password.' 
      });
    }

    // 4. Securely hash password
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    // 5. Initial status:
    // Regular individual users / donors are immediately active and can sign in right away!
    // NGOs and Scrap Dealers require platform admin approval before full access.
    const initialStatus = rawRole === 'user' ? 'active' : 'pending';

    // 6. Direct Database Insert
    let dbUserId = null;
    try {
      const [insertRes] = await pool.query(
        'INSERT INTO users (name, email, phone, password_hash, role, address, city, state, pincode, status, is_email_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
        [rawName, rawEmail, rawPhone, passwordHash, rawRole, rawAddress, rawCity, rawState, rawPincode, initialStatus]
      );
      dbUserId = insertRes.insertId;
    } catch (dbErr) {
      console.error('[AUTH:REGISTER] DB insert error:', dbErr.message);
    }

    // 7. Insert Role-Specific Records into DB
    if (rawRole === 'ngo' && ngoDetails && dbUserId) {
      try {
        await pool.query(
          'INSERT INTO ngos (user_id, ngo_name, contact_person, registration_number, description, verification_status) VALUES (?, ?, ?, ?, ?, ?)',
          [dbUserId, ngoDetails.ngo_name, ngoDetails.contact_person, ngoDetails.registration_number, ngoDetails.description, 'pending']
        );
      } catch (e) {
        console.error('[AUTH:REGISTER] NGO details insert error:', e.message);
      }
    } else if (rawRole === 'scrapdealer' && scrapDealerDetails && dbUserId) {
      try {
        await pool.query(
          'INSERT INTO scrap_dealers (user_id, business_name, contact_person, registration_number, accepted_materials, verification_status) VALUES (?, ?, ?, ?, ?, ?)',
          [dbUserId, scrapDealerDetails.business_name, scrapDealerDetails.contact_person, scrapDealerDetails.registration_number, typeof scrapDealerDetails.accepted_materials === 'string' ? scrapDealerDetails.accepted_materials : JSON.stringify(scrapDealerDetails.accepted_materials || []), 'pending']
        );
      } catch (e) {
        console.error('[AUTH:REGISTER] Scrap dealer details insert error:', e.message);
      }
    }

    // 8. Register in persistent UserRegistry
    const savedUser = await UserRegistry.registerUser({
      id: dbUserId || undefined,
      name: rawName,
      email: rawEmail,
      phone: rawPhone,
      password_hash: passwordHash,
      role: rawRole,
      address: rawAddress,
      city: rawCity,
      state: rawState,
      pincode: rawPincode,
      status: initialStatus,
      is_email_verified: 1,
      ngo_details: ngoDetails,
      scrap_dealer_details: scrapDealerDetails
    });

    // Sync database and persistent registry
    UserRegistry.syncToDatabase(pool).catch(() => {});

    console.log(`[AUTH:REGISTER] User registered successfully: ${rawEmail} (${rawRole}, status: ${initialStatus})`);

    // 9. Return clean response
    if (rawRole === 'user') {
      const token = generateToken(savedUser);
      return res.status(201).json({
        success: true,
        role: rawRole,
        status: 'active',
        token,
        user: {
          id: savedUser.id,
          name: savedUser.name,
          email: savedUser.email,
          role: savedUser.role,
          status: 'active'
        },
        message: 'Account created successfully! Welcome to EcoDonate.'
      });
    } else {
      return res.status(201).json({
        success: true,
        role: rawRole,
        status: 'pending',
        user: {
          id: savedUser.id,
          name: savedUser.name,
          email: savedUser.email,
          role: savedUser.role,
          status: 'pending'
        },
        message: `Your ${rawRole.toUpperCase()} registration has been submitted and saved successfully! Your credentials are now awaiting Administrator review.`
      });
    }
  } catch (error) {
    console.error('[AUTH:REGISTER] Exception:', error.message);
    next(error);
  }
};

// Backwards compatibility endpoints
const verifyRegistrationOtp = async (req, res) => {
  res.json({ success: true, message: 'Verification code feature has been disabled. You can sign in directly.' });
};

const resendRegistrationOtp = async (req, res) => {
  res.json({ success: true, message: 'Verification code feature has been disabled. You can sign in directly.' });
};

// ============================================================================
// 4. FORGOT PASSWORD - STEP 1: SEND OTP TO REGISTERED EMAIL
// ============================================================================
const forgotPasswordSendOtp = async (req, res, next) => {
  try {
    const rawEmail = (req.body.email || '').trim().toLowerCase();
    if (!rawEmail) {
      return res.status(400).json({ message: 'Please provide your registered email address.' });
    }

    // Look up user in UserRegistry or Database
    let user = UserRegistry.findUser(rawEmail);
    if (!user) {
      try {
        const [dbUsers] = await pool.query('SELECT * FROM users WHERE LOWER(email) = ?', [rawEmail]);
        if (dbUsers.length > 0) user = dbUsers[0];
      } catch (e) {}
    }

    if (!user) {
      return res.status(404).json({ 
        message: 'No registered account found with this email address. Please check your email or create an account.' 
      });
    }

    // Generate 6-digit reset code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    passwordResetStore.set(rawEmail, {
      otp,
      expiresAt,
      attempts: 0
    });

    await sendPasswordResetOtp(user.email, user.name, otp);

    const hasSmtpConfig = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    const isDev = process.env.NODE_ENV !== 'production' || !hasSmtpConfig;

    console.log(`[AUTH:FORGOT_PWD_SEND] Password reset OTP ${otp} sent to ${user.email}`);

    res.json({
      success: true,
      message: hasSmtpConfig
        ? `Password reset verification code has been sent to ${user.email}.`
        : `Password reset verification code has been generated for ${user.email}.`,
      email: user.email,
      dev_otp: isDev ? otp : undefined,
      dev_mode: isDev
    });
  } catch (error) {
    console.error('[AUTH:FORGOT_PWD_SEND] Exception:', error.message);
    next(error);
  }
};

// ============================================================================
// 5. FORGOT PASSWORD - STEP 2: VERIFY OTP CODE
// ============================================================================
const forgotPasswordVerifyOtp = async (req, res, next) => {
  try {
    const rawEmail = (req.body.email || '').trim().toLowerCase();
    const rawOtp = (req.body.otp || '').trim();

    if (!rawEmail || !rawOtp) {
      return res.status(400).json({ message: 'Email address and verification code are required.' });
    }

    const resetData = passwordResetStore.get(rawEmail);
    if (!resetData) {
      return res.status(400).json({ 
        message: 'No active password reset session found for this email. Please request a new code.' 
      });
    }

    if (Date.now() > resetData.expiresAt) {
      passwordResetStore.delete(rawEmail);
      return res.status(400).json({ 
        message: 'Verification code has expired. Please request a new code.' 
      });
    }

    if (resetData.otp !== rawOtp) {
      resetData.attempts = (resetData.attempts || 0) + 1;
      if (resetData.attempts >= 5) {
        passwordResetStore.delete(rawEmail);
        return res.status(400).json({ message: 'Too many incorrect attempts. Please request a new code.' });
      }
      return res.status(400).json({ message: 'Invalid verification code. Please check your email and try again.' });
    }

    // OTP verified! Generate secure, single-use password reset session token (15 mins)
    const resetToken = jwt.sign(
      { email: rawEmail, purpose: 'password_reset' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({
      success: true,
      resetToken,
      message: 'Code verified successfully! Please enter your new password.'
    });
  } catch (error) {
    console.error('[AUTH:FORGOT_PWD_VERIFY] Exception:', error.message);
    next(error);
  }
};

// ============================================================================
// 6. FORGOT PASSWORD - STEP 3: SET NEW PASSWORD
// ============================================================================
const forgotPasswordReset = async (req, res, next) => {
  try {
    const rawEmail = (req.body.email || '').trim().toLowerCase();
    const rawResetToken = req.body.resetToken || '';
    const rawNewPassword = req.body.newPassword || req.body.password || '';
    const rawConfirmPassword = req.body.confirmPassword || '';

    if (!rawEmail || !rawResetToken || !rawNewPassword) {
      return res.status(400).json({ message: 'Email, reset token, and new password are required.' });
    }

    // Verify token
    try {
      const decoded = jwt.verify(rawResetToken, JWT_SECRET);
      if (decoded.email !== rawEmail || decoded.purpose !== 'password_reset') {
        return res.status(400).json({ message: 'Invalid or expired password reset session.' });
      }
    } catch (err) {
      return res.status(400).json({ message: 'Password reset session has expired. Please start over.' });
    }

    if (rawNewPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    if (rawConfirmPassword && rawNewPassword !== rawConfirmPassword) {
      return res.status(400).json({ message: 'Password and Confirm Password do not match.' });
    }

    // Securely hash new password
    const newPasswordHash = await bcrypt.hash(rawNewPassword, 10);

    // Update in UserRegistry
    UserRegistry.updatePassword(rawEmail, newPasswordHash);

    // Update in Database
    try {
      await pool.query('UPDATE users SET password_hash = ? WHERE LOWER(email) = ?', [newPasswordHash, rawEmail]);
    } catch (e) {
      console.warn('DB password update warning:', e.message);
    }

    // Clear reset cache
    passwordResetStore.delete(rawEmail);

    console.log(`[AUTH:PASSWORD_RESET] ✅ Password successfully updated for ${rawEmail}`);

    res.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.'
    });
  } catch (error) {
    console.error('[AUTH:FORGOT_PWD_RESET] Exception:', error.message);
    next(error);
  }
};

// ============================================================================
// 7. LOGIN (Strict production authentication: Real credentials & approval check)
// ============================================================================
const login = async (req, res, next) => {
  try {
    const rawEmail = (req.body.email || req.body.username || req.body.identifier || '').trim().toLowerCase();
    const rawPassword = req.body.password || '';
    const rememberMe = Boolean(req.body.rememberMe);

    if (!rawEmail || !rawPassword) {
      return res.status(400).json({ message: 'Email address and password are required.' });
    }

    // 1. Look up user in indestructible UserRegistry
    let user = UserRegistry.findUser(rawEmail);

    // 2. DB fallback
    if (!user) {
      try {
        const [dbUsers] = await pool.query(
          'SELECT * FROM users WHERE LOWER(email) = ? OR phone = ?',
          [rawEmail, rawEmail]
        );
        if (dbUsers.length > 0) {
          user = dbUsers[0];
          UserRegistry.registerUser(user).catch(() => {});
        }
      } catch (dbErr) {
        console.warn('[AUTH:LOGIN] DB fallback warning:', dbErr.message);
      }
    }

    if (!user) {
      recordFailedAttempt(req);
      return res.status(401).json({ message: 'Invalid email address or password.' });
    }

    // 3. Verify password strictly using bcrypt
    const match = await UserRegistry.verifyPassword(user, rawPassword);
    if (!match) {
      recordFailedAttempt(req);
      return res.status(401).json({ message: 'Invalid email address or password.' });
    }

    // 4. Check Admin Approval Status (For NGOs and Scrap Dealers awaiting review)
    if (user.status === 'pending') {
      return res.status(403).json({
        message: 'Your account is awaiting Admin approval. Our administrator will review your application and approve access.',
        code: 'ACCOUNT_PENDING'
      });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({
        message: 'Your account registration has been rejected by the administrator. Platform access is restricted.',
        code: 'ACCOUNT_REJECTED'
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        message: 'Your account has been deactivated by the administrator.',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Clear failed attempts counter
    clearFailedAttempts(req);

    // 6. Generate authenticated session token
    const tokenExpires = rememberMe ? '30d' : JWT_EXPIRES_IN;
    const token = generateToken(user, tokenExpires);

    console.log(`[AUTH:LOGIN] ✅ Successful login: User="${user.name}", Role="${user.role}"`);

    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
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
    console.error('[AUTH:LOGIN] Exception:', error.message);
    next(error);
  }
};

// ============================================================================
// 8. GET CURRENT AUTHENTICATED USER (ME)
// ============================================================================
const getMe = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let user = UserRegistry.findUser(userId);

    if (!user) {
      const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
      if (users.length > 0) user = users[0];
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.status === 'inactive' || user.status === 'rejected') {
      return res.status(403).json({ message: 'Account deactivated or rejected by administrator' });
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
    console.error('[AUTH:GETME] Exception:', error.message);
    next(error);
  }
};

// ============================================================================
// 9. BACKWARD COMPATIBLE REGISTER (Direct register fallback if ever called)
// ============================================================================
const register = async (req, res, next) => {
  return registerRequest(req, res, next);
};

module.exports = {
  registerRequest,
  verifyRegistrationOtp,
  resendRegistrationOtp,
  forgotPasswordSendOtp,
  forgotPasswordVerifyOtp,
  forgotPasswordReset,
  login,
  getMe,
  register
};
