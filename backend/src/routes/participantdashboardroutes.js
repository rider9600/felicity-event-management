import express from "express";
import {
  getDashboard,
  updateProfile,
  getProfile,
  getFollowedOrganizers,
  completeOnboarding,
  getRecommendedEvents,
} from "../controllers/participantcontroller.js";
import { protect } from "../middleware/authmiddleware.js";
import { participantOnly } from "../middleware/rolemiddleware.js";

const router = express.Router();

router.get("/dashboard", protect, participantOnly, getDashboard);
router.get("/profile", protect, participantOnly, getProfile);
router.put("/profile", protect, participantOnly, updateProfile);
// Get organizers a participant follows
router.get("/following", protect, participantOnly, getFollowedOrganizers);
// Onboarding and recommendations
router.post("/onboarding", protect, participantOnly, completeOnboarding);
router.get("/recommended-events", protect, participantOnly, getRecommendedEvents);

export default router;
