// Database connection setup using Mongoose (MongoDB)
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Database connection error: ${error.message}`);
    // Exit the process if DB connection fails - server can't run without it
    process.exit(1);
  }
};

module.exports = connectDB;
