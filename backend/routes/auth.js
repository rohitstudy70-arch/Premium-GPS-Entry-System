// routes/auth.js
// Simple authentication route for Arshi GPS staff login
// Uses hardcoded credentials for demo purposes
// POST /api/auth/login { username, password }

const express = require('express');
const router = express.Router();

// Dummy user store (replace with real DB in production if multiple users needed)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'arshigps';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123';

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    // Valid login
    const token = 'dummy-token-' + Date.now();
    return res.json({ success: true, token, user: { name: 'Admin Staff' } });
  }
  
  return res.status(401).json({ success: false, message: 'Invalid credentials' });
  // In real app, generate JWT. Here return dummy token.
  const token = 'dummy-token-' + Date.now();
  return res.json({ success: true, token, user: { name: user.name } });
});

module.exports = router;
