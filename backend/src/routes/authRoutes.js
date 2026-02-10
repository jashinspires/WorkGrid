const express = require('express');
const router = express.Router();
const { login, registerTenant, getMe, logout } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Public login route
router.post('/login', login);
router.post('/register-tenant', registerTenant);

// Protected routes
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

module.exports = router;
