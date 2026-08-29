const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const ALLOWED_SIGNUP_ROLES = ['user', 'sales_person'];
// Note: 'admin' is deliberately excluded from public signup. Admins are
// created directly in the database (see seed.js) or promoted by an
// existing admin via PATCH /api/auth/users/:id/role.

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function sanitize(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are required.' });
    }

    const requestedRole = ALLOWED_SIGNUP_ROLES.includes(role) ? role : 'user';

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4) RETURNING id, name, email, role`,
      [name, email, passwordHash, requestedRole]
    );

    const user = result.rows[0];
    const token = signToken(user);
    res.status(201).json({ token, user: sanitize(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed.' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required.' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signToken(user);
    res.json({ token, user: sanitize(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed.' });
  }
}

async function me(req, res) {
  const result = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [req.user.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: result.rows[0] });
}

// Admin-only: change a user's role (e.g. promote to admin, or demote).
async function updateUserRole(req, res) {
  const { id } = req.params;
  const { role } = req.body;
  if (!['admin', 'sales_person', 'user'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role.' });
  }
  const result = await pool.query(
    'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
    [role, id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: result.rows[0] });
}

async function listUsers(req, res) {
  const result = await pool.query('SELECT id, name, email, role, created_at FROM users ORDER BY id');
  res.json({ users: result.rows });
}

module.exports = { register, login, me, updateUserRole, listUsers };
