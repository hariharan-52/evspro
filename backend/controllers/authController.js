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
// 1. REGISTRATION REQUEST (Step 1: Validate, Hash, Send Email OTP)
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

    // Role-specific verification requirements
    let ngoDetails = null;
    let scrapDealerDetails = null;

    if (rawRole === 'ngo') {
      const ngoName = (req.body.ngo_name || req.body.ngoName || rawName).trim();
      const contactPerson = (req.body.contact_person || req.body.contactPerson || rawName).trim();
      const regNumber = (req.body.registration_number || req.body.registrationNumber || '').trim();
      const description = (req.body.description || '').trim();

      if (!ngoName) return res.status(400).json({ message: 'NGO / Organization name is required.' });
      if (!contactPerson) return res.status(400).json({ message: 'Contact person name is required.' });
      if (!regNumber) return res.status(400).json({ message: 'NGO Registration / Trust / 80G Certificate number is required for verification.' });

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
      if (!regNumber) return res.status(400).json({ message: 'Business Trade License / GST / Registration number is required for verification.' });

      scrapDealerDetails = {
        business_name: businessName,
        contact_person: contactPerson,
        registration_number: regNumber,
        accepted_materials: acceptedMaterials,
        verification_status: 'pending'
      };
    }

    // 3. Check if email is already registered and active/approved
    const existing = UserRegistry.findUser(rawEmail);
    if (existing && (existing.is_email_verified === 1 || existing.status === 'active' || existing.status === 'approved' || existing.status === 'pending')) {
      return res.status(400).json({ 
        message: 'An account with this email address is already registered. Please log in or use Forgot Password.' 
      });
    }

    // Also check database directly
    try {
      const [dbUsers] = await pool.query('SELECT id, is_email_verified, status FROM users WHERE LOWER(email) = ?', [rawEmail]);
      if (dbUsers.length > 0 && (dbUsers[0].is_email_verified === 1 || dbUsers[0].status === 'active' || dbUsers[0].status === 'approved' || dbUsers[0].status === 'pending')) {
        return res.status(400).json({ 
          message: 'An account with this email address is already registered. Please log in or use Forgot Password.' 
        });
      }
    } catch (e) {
      // Continue if DB check fails
    }

    // 4. Securely hash password
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    // 5. Generate secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAtMs = Date.now() + 10 * 60 * 1000; // 10 minutes
    const expiresAtIso = new Date(expiresAtMs).toISOString();

    // 6. Save in persistent UserRegistry & DB so serverless container switches NEVER lose it
    const pendingUser = await UserRegistry.registerUser({
      name: rawName,
      email: rawEmail,
      phone: rawPhone,
      password_hash: passwordHash,
      role: rawRole,
      address: rawAddress,
      city: rawCity,
      state: rawState,
      pincode: rawPincode,
      ngo_details: ngoDetails,
      scrap_dealer_details: scrapDealerDetails,
      is_email_verified: 0,
      status: 'pending',
      otp_code: otp,
      otp_expires_at: expiresAtIso
    });

    pendingRegistrations.set(rawEmail, {
      name: rawName,
      email: rawEmail,
      otp,
      expiresAt: expiresAtMs,
      attempts: 0
    });

    // Sync to database
    UserRegistry.syncToDatabase(pool).catch(() => {});

    // 7. Dispatch OTP via Email Service
    await sendRegistrationOtp(rawEmail, rawName, otp);

    console.log(`[AUTH:REGISTER_REQ] Email OTP dispatched to ${rawEmail} (${rawRole}). Awaiting verification.`);

    res.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${rawEmail}. Please verify your email to complete registration.`,
      email: rawEmail
    });
  } catch (error) {
    console.error('[AUTH:REGISTER_REQ] Exception:', error.message);
    next(error);
  }
};

// ============================================================================
// 2. VERIFY REGISTRATION OTP (Step 2: Verify OTP -> Enter PENDING APPROVAL)
// ============================================================================
const verifyRegistrationOtp = async (req, res, next) => {
  try {
    const rawEmail = (req.body.email || '').trim().toLowerCase();
    const rawOtp = (req.body.otp || '').trim();

    if (!rawEmail || !rawOtp) {
      return res.status(400).json({ message: 'Email address and verification code are required.' });
    }

    const pendingMem = pendingRegistrations.get(rawEmail);
    let registeredUser = UserRegistry.findUser(rawEmail);

    if (!registeredUser) {
      try {
        const [dbUsers] = await pool.query('SELECT * FROM users WHERE LOWER(email) = ?', [rawEmail]);
        if (dbUsers.length > 0) registeredUser = dbUsers[0];
      } catch (e) {}
    }

    const storedOtp = pendingMem ? pendingMem.otp : (registeredUser ? registeredUser.otp_code : null);
    const storedExpiresAt = pendingMem
      ? pendingMem.expiresAt
      : (registeredUser && registeredUser.otp_expires_at ? new Date(registeredUser.otp_expires_at).getTime() : 0);

    if (!storedOtp) {
      return res.status(400).json({ 
        message: 'No pending registration session found for this email, or the session has expired. Please register again.' 
      });
    }

    // Check expiration
    if (Date.now() > storedExpiresAt) {
      pendingRegistrations.delete(rawEmail);
      if (registeredUser) UserRegistry.clearOtp(rawEmail);
      return res.status(400).json({ 
        message: 'Verification code has expired. Please request a new code or register again.' 
      });
    }

    // Verify OTP code
    if (String(storedOtp).trim() !== rawOtp) {
      return res.status(400).json({ message: 'Invalid verification code. Please check your email and try again.' });
    }

    // OTP Verified! Mark verified and status pending approval
    UserRegistry.updateEmailVerification(rawEmail, 1);
    UserRegistry.updateUserStatus(rawEmail, 'pending');
    UserRegistry.clearOtp(rawEmail);

    try {
      await pool.query(
        'UPDATE users SET is_email_verified = 1, status = "pending", otp_code = NULL WHERE LOWER(email) = ?',
        [rawEmail]
      );
    } catch (e) {}

    pendingRegistrations.delete(rawEmail);

    console.log(`[AUTH:OTP_VERIFIED] ✅ Email verified for ${rawEmail}. Account set to PENDING approval.`);

    return res.status(201).json({
      success: true,
      status: 'pending',
      message: 'Email verified successfully! Your account registration has been submitted and is currently awaiting Administrator approval.',
      user: {
        email: rawEmail,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('[AUTH:VERIFY_REG_OTP] Exception:', error.message);
    next(error);
  }
};

// ============================================================================
// 3. RESEND REGISTRATION OTP
// ============================================================================
const resendRegistrationOtp = async (req, res, next) => {
  try {
    const rawEmail = (req.body.email || '').trim().toLowerCase();
    if (!rawEmail) {
      return res.status(400).json({ message: 'Email address is required.' });
    }

    let user = UserRegistry.findUser(rawEmail);
    if (!user) {
      try {
        const [dbUsers] = await pool.query('SELECT * FROM users WHERE LOWER(email) = ?', [rawEmail]);
        if (dbUsers.length > 0) user = dbUsers[0];
      } catch (e) {}
    }

    if (!user) {
      return res.status(404).json({ 
        message: 'No pending registration found for this email. Please register again.' 
      });
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAtMs = Date.now() + 10 * 60 * 1000;
    const expiresAtIso = new Date(expiresAtMs).toISOString();

    UserRegistry.setOtp(rawEmail, newOtp, expiresAtIso);

    pendingRegistrations.set(rawEmail, {
      name: user.name,
      email: rawEmail,
      otp: newOtp,
      expiresAt: expiresAtMs,
      attempts: 0
    });

    try {
      await pool.query(
        'UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE LOWER(email) = ?',
        [newOtp, expiresAtIso, rawEmail]
      );
    } catch (e) {}

    await sendRegistrationOtp(rawEmail, user.name, newOtp);

    console.log(`[AUTH:RESEND_OTP] New verification code dispatched to ${rawEmail}`);

    res.json({
      success: true,
      message: `A new 6-digit verification code has been sent to ${rawEmail}.`
    });
  } catch (error) {
    console.error('[AUTH:RESEND_OTP] Exception:', error.message);
    next(error);
  }
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

    console.log(`[AUTH:FORGOT_PWD_SEND] Password reset OTP sent to ${user.email}`);

    res.json({
      success: true,
      message: `Password reset verification code has been sent to ${user.email}.`,
      email: user.email
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

    // 4. Check Email Verification Status
    if (user.is_email_verified === 0 || user.is_email_verified === false) {
      return res.status(403).json({
        message: 'Your email address has not been verified yet. Please verify your email before logging in.',
        code: 'EMAIL_NOT_VERIFIED',
        email: user.email
      });
    }

    // 5. Check Admin Approval Status
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
