const jwt = require('jsonwebtoken');

// Verifies the Bearer token and attaches { id, role } to req.user.
// Every protected route in this app relies on req.user being trustworthy —
// it is set here from a verified token, never from a client-supplied field.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = { requireAuth };
