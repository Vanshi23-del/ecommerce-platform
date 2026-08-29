const express = require('express');
const { register, login, me, updateUserRole, listUsers } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, me);

// Admin-only user management
router.get('/users', requireAuth, requireRole('admin'), listUsers);
router.patch('/users/:id/role', requireAuth, requireRole('admin'), updateUserRole);

module.exports = router;
