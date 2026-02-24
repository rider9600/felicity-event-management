import express from "express";
import {
  requestPasswordReset,
  approvePasswordReset,
  rejectPasswordReset,
  changeParticipantPassword,
  getPasswordResetRequests,
  getPasswordResetHistory,
  getPasswordResetRequestDetails,
} from "../controllers/passwordcontroller.js";
import { protect } from "../middleware/authmiddleware.js";
import { adminOnly } from "../middleware/rolemiddleware.js";

const router = express.Router();

// Organizer: request a password reset (admin will approve)
router.post("/request", protect, requestPasswordReset);

// Organizer: view their own reset history with details
router.get("/history", protect, getPasswordResetHistory);

// Organizer: view specific request details
router.get("/:requestId", protect, getPasswordResetRequestDetails);

// Admin: get all password reset requests with optional filtering
router.get("/admin/requests", protect, adminOnly, getPasswordResetRequests);

// Admin: approve a reset request (generates new password)
router.post(
  "/admin/approve/:requestId",
  protect,
  adminOnly,
  approvePasswordReset,
);

// Admin: reject a reset request
router.post(
  "/admin/reject/:requestId",
  protect,
  adminOnly,
  rejectPasswordReset,
);

// Participant: change their own password
router.post("/change", protect, changeParticipantPassword);

export default router;
