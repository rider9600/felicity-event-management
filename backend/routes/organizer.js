import express from "express";
import {
  getOrganizerEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  publishEvent,
  getEventParticipants,
  updateRegistrationStatus,
  markAttendance,
  getEventAnalytics,
  sendDiscordNotification,
} from "../controllers/organizerController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// All routes require organizer role
router.use(protect, authorize("organizer"));

// Event management
router.route("/events").get(getOrganizerEvents).post(createEvent);

router.route("/events/:id").put(updateEvent).delete(deleteEvent);

router.put("/events/:id/publish", publishEvent);

// Participant management
router.get("/events/:id/participants", getEventParticipants);
router.put("/registrations/:id", updateRegistrationStatus);
router.post("/events/:id/attendance/:ticketId", markAttendance);

// Analytics and notifications
router.get("/events/:id/analytics", getEventAnalytics);
router.post("/events/:id/notify", sendDiscordNotification);

export default router;
