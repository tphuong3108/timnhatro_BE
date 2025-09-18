const dotenv = require('dotenv');
const mongoose = require('mongoose');
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.DATABASE_NAME;

const connectDB = async () => {
  await mongoose.connect(MONGODB_URI, {
    dbName: DATABASE_NAME
  });
};

module.exports = { connectDB };