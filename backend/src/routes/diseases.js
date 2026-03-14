const express = require('express');
const router = express.Router();

// GET /api/diseases — list all known plant diseases
router.get('/', async (req, res) => {
  try {
    // TODO: fetch from PostgreSQL diseases table
    const mockDiseases = [
      { id: 1, name: 'Tomato Early Blight', plant: 'Tomato' },
      { id: 2, name: 'Powdery Mildew', plant: 'Wheat' },
    ];
    res.json(mockDiseases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/diseases/:id — get details for a specific disease
router.get('/:id', async (req, res) => {
  try {
    // TODO: fetch by ID from DB
    res.json({ id: req.params.id, name: 'Tomato Early Blight (stub)' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
