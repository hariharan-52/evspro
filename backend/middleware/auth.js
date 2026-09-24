const jwt = require('jsonwebtoken');

// In-memory set of revoked JWT tokens for logout invalidation
const revokedTokens = new Set();

// Periodically clean up expired tokens from the revocation list
setInterval(() => {
  const now = Math.floor(Date.now() / 1000);
  for (const token of revokedTokens) {
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp && decoded.exp < now) {
        revokedTokens.delete(token);
      }
    } catch (e) {
      revokedTokens.delete(token);
    }
  }
}, 30 * 60 * 1000).unref();

const revokeToken = (token) => {
  if (token) {
    revokedTokens.add(token);
  }
};

const isTokenRevoked = (token) => {
  return revokedTokens.has(token);
};

const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    if (isTokenRevoked(token)) {
      return res.status(401).json({ message: 'Session has ended. Please log in again.' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'ecodonate_default_jwt_secret_key_2026';
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (!isTokenRevoked(token)) {
        const jwtSecret = process.env.JWT_SECRET || 'ecodonate_default_jwt_secret_key_2026';
        req.user = jwt.verify(token, jwtSecret);
      }
    }
  } catch (error) {
    // Ignore invalid token in optional auth
  }
  next();
};

module.exports = auth;
module.exports.auth = auth;
module.exports.optionalAuth = optionalAuth;
module.exports.revokeToken = revokeToken;
module.exports.isTokenRevoked = isTokenRevoked;
