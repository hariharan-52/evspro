// In-memory rate limiter to protect authentication endpoints from brute-force attacks
const attemptsMap = new Map();

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout

// Clean up expired lockout entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of attemptsMap.entries()) {
    if (data.lockedUntil && data.lockedUntil < now) {
      attemptsMap.delete(key);
    } else if (!data.lockedUntil && now - data.firstAttempt > LOCKOUT_MS) {
      attemptsMap.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

const getClientIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || req.connection?.remoteAddress || 'unknown';
};

const isLocalhostIp = (ip) => {
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip === 'localhost';
};

const loginRateLimiter = (req, res, next) => {
  const ip = getClientIp(req);
  if (process.env.NODE_ENV !== 'production' && isLocalhostIp(ip)) {
    return next();
  }

  const data = attemptsMap.get(ip);
  const now = Date.now();

  if (data && data.lockedUntil && data.lockedUntil > now) {
    const remainingMinutes = Math.ceil((data.lockedUntil - now) / 60000);
    return res.status(429).json({
      message: `Too many failed login attempts. Please wait ${remainingMinutes} minute(s) before trying again.`
    });
  }

  next();
};

const recordFailedAttempt = (ipOrReq) => {
  const ip = typeof ipOrReq === 'string' ? ipOrReq : getClientIp(ipOrReq);
  if (process.env.NODE_ENV !== 'production' && isLocalhostIp(ip)) {
    return;
  }

  const now = Date.now();
  const data = attemptsMap.get(ip) || { count: 0, firstAttempt: now, lockedUntil: null };

  data.count += 1;
  if (data.count >= MAX_ATTEMPTS) {
    data.lockedUntil = now + LOCKOUT_MS;
  }
  attemptsMap.set(ip, data);
};

const clearFailedAttempts = (ipOrReq) => {
  const ip = typeof ipOrReq === 'string' ? ipOrReq : getClientIp(ipOrReq);
  attemptsMap.delete(ip);
};

module.exports = {
  loginRateLimiter,
  recordFailedAttempt,
  clearFailedAttempts
};
