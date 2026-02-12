import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import connectDB from "../config/db.js";

dotenv.config();

// Create Admin Account
const createAdmin = async () => {
  try {
    await connectDB();

    // Check if admin already exists
    const adminExists = await User.findOne({ role: "admin" });
    if (adminExists) {
      console.log("Admin account already exists!");
      console.log("Email:", adminExists.email);
      process.exit(0);
    }

    // Create admin account
    const admin = await User.create({
      firstName: "Admin",
      lastName: "Felicity",
      email: "admin@felicity.iiit.ac.in",
      password: "admin123456", // Will be hashed by pre-save hook
      role: "admin",
    });

    console.log("✅ Admin account created successfully!");
    console.log("====================================");
    console.log("Email:", admin.email);
    console.log("Password: admin123456");
    console.log("====================================");
    console.log("Please change the password after first login!");

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
};

createAdmin();
