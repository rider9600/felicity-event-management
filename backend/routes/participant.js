import express from "express";
import {
  getMyRegistrations,
  cancelRegistration,
  getOrganizers,
  getOrganizerDetail,
  getFollowedOrganizers,
  followOrganizer,
  unfollowOrganizer,
  updatePreferences,
} from "../controllers/participantController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// All routes require participant role
router.use(protect, authorize("participant"));

// Registration management
router.get("/registrations", getMyRegistrations);
router.put("/registrations/:id/cancel", cancelRegistration);

// Organizer interaction
router.get("/organizers", getOrganizers);
router.get("/organizers/:id", getOrganizerDetail);
router.get("/followed-organizers", getFollowedOrganizers);
router.post("/follow/:organizerId", followOrganizer);
router.delete("/follow/:organizerId", unfollowOrganizer);

// Preferences
router.put("/preferences", updatePreferences);

export default router;
