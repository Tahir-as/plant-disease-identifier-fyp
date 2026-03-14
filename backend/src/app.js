const express = require('express');
const cors = require('cors');

// Route imports
const authRoutes     = require('./routes/auth');
const diseaseRoutes  = require('./routes/diseases');
const predictRoutes  = require('./routes/predict');
const historyRoutes  = require('./routes/history');
const adminRoutes    = require('./routes/admin');

// Auth middleware (used on protected routes)
const { protect } = require('./middleware/auth');

const app = express();

// ── Global Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ─────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/diseases', diseaseRoutes);
app.use('/api/predict',  protect, predictRoutes);  // protected
app.use('/api/history',  protect, historyRoutes);  // protected
app.use('/api/admin',    protect, adminRoutes);    // protected (admin only)

// ── Health Check ───────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ── 404 Handler ────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ── Global Error Handler ───────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;
