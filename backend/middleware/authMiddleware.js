const jwt = require('jsonwebtoken');
const User = require('../models/User.js');

// --- Utility Functions ---

/**
 * Extract Bearer token from Authorization header (case-insensitive)
 */
function getBearerToken(req) {
  const h = req.headers.authorization || req.headers.Authorization;
  if (!h || typeof h !== 'string') return null;
  const [scheme, token] = h.split(' ');
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== 'bearer') return null;
  return token.trim();
}

// --- Middleware Functions ---

/**
 * Protect: verifies JWT, attaches req.user (without password) & req.auth (decoded)
 */
const protect = async (req, res, next) => {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, token missing' });
    }

    let decoded;
    try {
      // NOTE: Ensure process.env.JWT_SECRET is loaded (e.g., via dotenv in server.js)
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Session expired, please log in again' });
      }
      return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
    }

    // Find user by ID from the decoded token payload
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = user;    // sanitized user object
    req.auth = decoded; // raw token payload (id, role, iat, exp)
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    // General fallback error response
    res.status(401).json({ success: false, message: 'Not authorized' });
  }
};

/**
 * Role-based authorization: allow only specified roles
 * Usage: authorize('admin', 'electoral_committee')
 */
const authorize = (...roles) => (req, res, next) => {
  // This check assumes `protect` middleware has run successfully
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
  }
  next();
};

/**
 * Require verified users (e.g., for voting)
 */
const requireVerified = (req, res, next) => {
  // This check assumes `protect` middleware has run successfully
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Your account is pending verification by the Electoral Committee',
    });
  }
  next();
};

// --- Convenience Guards (using authorize) ---
const adminOnly = authorize('admin');
const committeeOnly = authorize('electoral_committee');
const committeeOrAdmin = authorize('electoral_committee', 'admin');

// --- CommonJS Export ---

// Export all middleware functions and convenience guards
module.exports = {
  protect,
  authorize,
  requireVerified,
  adminOnly,
  committeeOnly,
  committeeOrAdmin,
};