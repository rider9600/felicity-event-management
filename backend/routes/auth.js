import express from "express";
import {
  signup,
  login,
  getProfile,
  updateProfile,
  changePassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.post("/signup", signup);
router.post("/login", login);

// Private routes
router.route("/profile").get(protect, getProfile).put(protect, updateProfile);

router.put("/change-password", protect, changePassword);

export default router;
