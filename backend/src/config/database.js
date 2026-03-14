// Database configuration
// This file exports connection setup for PostgreSQL (pg) and MongoDB (mongoose).
// Install the drivers when ready:
//   npm install pg mongoose

// ── PostgreSQL (pg) ────────────────────────────────────────────────
// const { Pool } = require('pg');
// const pgPool = new Pool({
//   host:     process.env.DB_HOST,
//   port:     process.env.DB_PORT,
//   user:     process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
// });
// module.exports.pgPool = pgPool;

// ── MongoDB (mongoose) ─────────────────────────────────────────────
// const mongoose = require('mongoose');
// const connectMongo = async () => {
//   await mongoose.connect(process.env.MONGODB_URI);
//   console.log('MongoDB connected');
// };
// module.exports.connectMongo = connectMongo;

// Placeholder — uncomment sections above once drivers are installed
module.exports = {};
