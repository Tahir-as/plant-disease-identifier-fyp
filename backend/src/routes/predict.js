const express  = require('express');
const multer   = require('multer');
const axios    = require('axios');
const FormData = require('form-data');
const router   = express.Router();

// ── Multer: keep image in memory, forward to Flask ────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 },           // 10 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
});

// ── POST /api/predict ─────────────────────────────────────────────────────────
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    // ── Forward image to the Python/Flask ML server ───────────────────────
    const ML_URL = process.env.ML_API_URL || 'http://localhost:8000/predict';

    const form = new FormData();
    form.append('image', req.file.buffer, {
      filename:    req.file.originalname || 'plant.jpg',
      contentType: req.file.mimetype,
    });

    const mlResponse = await axios.post(ML_URL, form, {
      headers: { ...form.getHeaders() },
      timeout: 30_000,           // 30 s — model inference may be slow
    });

    const prediction = mlResponse.data;

    // ── Optionally save scan to DB (wired in next milestone) ─────────────
    // const userId = req.user._id;
    // await Scan.create({ userId, ...prediction });

    return res.json({
      success:    true,
      disease:    prediction.disease,
      plant:      prediction.plant,
      label:      prediction.label,
      confidence: prediction.confidence,
      is_healthy: prediction.is_healthy,
      top_results: prediction.top_results,
      solutions:  prediction.solutions,
    });

  } catch (err) {
    // Distinguish ML server down vs other errors
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      return res.status(503).json({
        message: 'ML inference service is unavailable. Please try again later.',
      });
    }
    if (err.response) {
      // ML server returned an error response
      return res.status(err.response.status || 500).json({
        message: err.response.data?.error || 'ML server error',
      });
    }
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
