// Rate limiter removed: Cooldown period and lockout feature disabled per user request
const attemptsMap = new Map();

const loginRateLimiter = (req, res, next) => {
  // Always allow login requests without any cooldown or lockout
  next();
};

const recordFailedAttempt = () => {
  // Cooldown feature removed - no-op
};

const clearFailedAttempts = () => {
  // Cooldown feature removed - no-op
};

module.exports = {
  loginRateLimiter,
  recordFailedAttempt,
  clearFailedAttempts
};

