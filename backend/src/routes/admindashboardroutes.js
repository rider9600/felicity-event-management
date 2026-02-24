import express from "express";
import {
  getOrganizers,
  removeOrganizer,
  createorganizer,
} from "../controllers/admincontroller.js";
import { getAdminAnalytics } from "../controllers/adminanalyticscontroller.js";
import {
  getPasswordResetRequests,
  approvePasswordReset,
  rejectPasswordReset,
} from "../controllers/passwordcontroller.js";
import { protect } from "../middleware/authmiddleware.js";
import { adminOnly } from "../middleware/rolemiddleware.js";

const router = express.Router();

router.get("/organizers", protect, adminOnly, getOrganizers);
router.post("/organizer", protect, adminOnly, createorganizer);
router.delete("/organizer/:id", protect, adminOnly, removeOrganizer);
router.get("/analytics", protect, adminOnly, getAdminAnalytics);

// Password reset management for admin
router.get(
  "/password-reset/requests",
  protect,
  adminOnly,
  getPasswordResetRequests,
);
router.post(
  "/password-reset/approve/:requestId",
  protect,
  adminOnly,
  approvePasswordReset,
);
router.post(
  "/password-reset/reject/:requestId",
  protect,
  adminOnly,
  rejectPasswordReset,
);

export default router;
