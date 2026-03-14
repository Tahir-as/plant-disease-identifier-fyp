const express = require('express');
const router = express.Router();

// GET /api/history — return scan history for the authenticated user
router.get('/', async (req, res) => {
  try {
    // req.user is attached by the protect middleware
    // TODO: query DB for scans belonging to req.user.id
    const mockHistory = [
      { id: 1, disease: 'Tomato Early Blight', date: '2026-03-14', confidence: 0.94 },
    ];
    res.json(mockHistory);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/history/:id — delete a specific scan record
router.delete('/:id', async (req, res) => {
  try {
    // TODO: verify ownership and delete from DB
    res.json({ message: `Record ${req.params.id} deleted (stub)` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
