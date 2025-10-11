const mongoose = require("mongoose");
require("dotenv").config();

const mongoUri = process.env.MONGODB;

const initializeDatabase = async () => {
  try {
    const connection = mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000,
    });
    if (connection) {
      console.log("Database connected successfully");
    } else {
      console.log("Database Connection failed");
    }
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = { initializeDatabase };
