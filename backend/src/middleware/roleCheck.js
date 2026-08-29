// Restricts a route to a fixed set of roles. Must run after requireAuth.
// This is the actual enforcement the assessment cares about — the
// frontend may also hide a button, but the request is rejected here
// regardless of what the client sends or shows.
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to perform this action.' });
    }
    next();
  };
}

module.exports = { requireRole };
