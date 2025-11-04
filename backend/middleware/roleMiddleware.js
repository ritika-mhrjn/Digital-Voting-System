const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    // NOTE: This middleware assumes 'protect' or similar middleware has
    // already run and attached the user object to req.user.
    if (req.user && allowedRoles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ message: "Access denied: insufficient permissions" });
    }
  };
};

// --- CommonJS Export ---
module.exports = {
  roleMiddleware,
};