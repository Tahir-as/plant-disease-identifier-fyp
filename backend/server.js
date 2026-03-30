// server.js — Entry point: load env → connect DB → start Express
require('dotenv').config();

const app                = require('./src/app');
const { connectMongo }  = require('./src/config/database');

const PORT = process.env.PORT || 5000;

(async () => {
  // Connect to MongoDB before accepting requests
  await connectMongo();

  app.listen(PORT, () => {
    console.log(`🚀  Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
})();
