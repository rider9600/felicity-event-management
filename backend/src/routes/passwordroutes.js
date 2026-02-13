import express from "express";
import {
  requestPasswordReset,
  resetOrganizerPassword,
  changeParticipantPassword,
  getPasswordResetRequests,
  rejectPasswordReset,
} from "../controllers/passwordcontroller.js";
import { protect } from "../middleware/authmiddleware.js";
import { adminOnly } from "../middleware/rolemiddleware.js";

const router = express.Router();

router.post("/request-reset", requestPasswordReset);
router.post("/reset", protect, adminOnly, resetOrganizerPassword);
router.post("/reject", protect, adminOnly, rejectPasswordReset);
router.get("/requests", protect, adminOnly, getPasswordResetRequests);
router.post("/change", protect, changeParticipantPassword);

export default router;
