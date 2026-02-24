import express from "express";
import {
  getOrganizers,
  getOrganizerById,
  updateOrganizer,
  getOrganizerProfile,
  updateOrganizerProfile,
} from "../controllers/organizercontroller.js";
import { getOrganizerAnalytics } from "../controllers/organizeranalyticscontroller.js";
import {
  requestPasswordReset,
  getPasswordResetHistory,
  getPasswordResetRequestDetails,
} from "../controllers/passwordcontroller.js";
import { protect } from "../middleware/authmiddleware.js";
import { organizerOnly } from "../middleware/rolemiddleware.js";

const router = express.Router();

router.get("/list", getOrganizers);
router.get("/detail/:id", getOrganizerById);
router.get("/profile", protect, organizerOnly, getOrganizerProfile);
router.put("/profile", protect, organizerOnly, updateOrganizerProfile);
router.put("/update/:id", protect, organizerOnly, updateOrganizer);
router.get("/analytics", protect, organizerOnly, getOrganizerAnalytics);

// Password reset routes for organizer
router.post(
  "/password-reset/request",
  protect,
  organizerOnly,
  requestPasswordReset,
);
router.get(
  "/password-reset/history",
  protect,
  organizerOnly,
  getPasswordResetHistory,
);
router.get(
  "/password-reset/:requestId",
  protect,
  organizerOnly,
  getPasswordResetRequestDetails,
);

export default router;
