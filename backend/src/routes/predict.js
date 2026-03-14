const express = require('express');
const multer = require('multer');
const router = express.Router();

// Configure multer to store uploaded images in memory (buffer)
// In production, point to a persistent disk path or cloud (S3, etc.)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// POST /api/predict — receive plant image, forward to AI model, return result
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    // TODO: forward req.file.buffer to the Python/Flask AI model
    // const prediction = await callAIModel(req.file.buffer);

    // Mock response — replace with actual AI model integration
    const mockResult = {
      disease: 'Tomato Early Blight',
      confidence: 0.94,
      solutions: {
        en: 'Remove infected lower leaves. Apply copper-based fungicide.',
        ur: 'متاثرہ نچلے پتوں کو ہٹا دیں۔ تانبے پر مبنی فنگسائڈ لگائیں۔',
        pa: 'ਪ੍ਰਭਾਵਿਤ ਹੇਠਲੇ ਪੱਤੇ ਹਟਾਓ। ਤਾਂਬੇ ਦਾ ਉੱਲੀਨਾਸ਼ਕ ਲਗਾਓ।',
        sd: 'متاثر ٿيل هيٺين پنن کي هٽايو۔ تانبي وارو فنگسائڊ لڳايو۔',
      },
    };

    res.json(mockResult);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
