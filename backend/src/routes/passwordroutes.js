import express from "express";
import {
  requestPasswordReset,
  approvePasswordReset,
  rejectPasswordReset,
  changeParticipantPassword,
  getPasswordResetRequests,
  getPasswordResetHistory,
} from "../controllers/passwordcontroller.js";
import { protect } from "../middleware/authmiddleware.js";
import { adminOnly } from "../middleware/rolemiddleware.js";

const router = express.Router();

// Organizer: request a password reset (admin will approve)
router.post("/request", protect, requestPasswordReset);

// Admin: get all password reset requests
router.get("/requests", protect, adminOnly, getPasswordResetRequests);

// Admin: approve a reset request (generates new password)
router.post("/approve/:requestId", protect, adminOnly, approvePasswordReset);

// Admin: reject a reset request
router.post("/reject/:requestId", protect, adminOnly, rejectPasswordReset);

// Organizer: view their own reset history
router.get("/history", protect, getPasswordResetHistory);

// Participant: change their own password
router.post("/change", protect, changeParticipantPassword);

export default router;
