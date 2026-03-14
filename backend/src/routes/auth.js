const express = require('express');
const router = express.Router();

// POST /api/auth/register — create a new user account
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    // TODO: validate input, hash password (bcryptjs), save to DB, return JWT
    res.status(201).json({ message: 'User registered (stub)' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login — authenticate user and return a JWT
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    // TODO: look up user, compare password (bcryptjs), sign JWT (jsonwebtoken)
    res.status(200).json({ message: 'Login successful (stub)', token: 'placeholder-jwt' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me — return currently authenticated user profile
router.get('/me', async (req, res) => {
  // This route is protected in app.js via the protect middleware
  res.json({ message: 'Current user (stub)' });
});

module.exports = router;
