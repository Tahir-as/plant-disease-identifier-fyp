const express = require('express');
const router = express.Router();

// GET /api/admin/users — list all users (admin only)
router.get('/users', async (req, res) => {
  try {
    // TODO: verify req.user.role === 'admin', then fetch all users from DB
    res.json({ message: 'All users list (stub)' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/stats — return system statistics
router.get('/stats', async (req, res) => {
  try {
    res.json({
      totalScans: 0,
      totalUsers: 0,
      topDisease: 'N/A',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
