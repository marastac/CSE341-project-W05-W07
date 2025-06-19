const crypto = require('crypto');

// Simple token storage (in production, use Redis or database)
const validTokens = new Set();

// Generate a simple token
const generateToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  validTokens.add(token);
  return token;
};

// Authentication middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token || !validTokens.has(token)) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'Please provide a valid token. Use POST /auth/login to get a token.'
    });
  }
  
  next();
};

// Remove token from valid tokens
const invalidateToken = (token) => {
  validTokens.delete(token);
};

module.exports = {
  generateToken,
  authenticate,
  invalidateToken
};