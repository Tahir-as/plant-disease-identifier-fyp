// database.js — MongoDB connection via Mongoose
const mongoose = require('mongoose');

const connectMongo = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set in environment variables');
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,   // fail fast if Mongo unreachable
    });
    console.log('✅  MongoDB connected:', mongoose.connection.host);
  } catch (err) {
    console.error('❌  MongoDB connection failed:', err.message);
    process.exit(1);
  }

  // Log disconnects for observability
  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️   MongoDB disconnected');
  });
};

module.exports = { connectMongo };
