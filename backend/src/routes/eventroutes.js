import express from "express";
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  searchEvents,
  getTrendingEvents,
  getOrganizerAnalytics,
  getEventAnalytics,
  getEventParticipants,
  exportEventParticipantsCSV,
  getEventsByOrganizer,
  getMyEvents,
  updateEventForm,
  getEventForm,
  getOrganizerProfile,
  updateOrganizerProfile,
  acceptRegistration,
  rejectRegistration,
  markAttendance,
  manualOverrideAttendance,
  generateCalendarICS,
} from "../controllers/eventcontroller.js";
import { protect } from "../middleware/authmiddleware.js";
import { organizerOnly } from "../middleware/rolemiddleware.js";
const router = express.Router();
router.post("/", protect, organizerOnly, createEvent);
router.get("/", getEvents);
router.get("/search", searchEvents);
router.get("/trending", getTrendingEvents);

// Organizer profile
router.get("/organizer/profile", protect, getOrganizerProfile);
router.put("/organizer/profile", protect, updateOrganizerProfile);

router.get("/organizer/analytics", protect, getOrganizerAnalytics);
router.get("/organizer/:organizerId", getEventsByOrganizer);
router.get("/my-events", protect, getMyEvents);

// Form builder (before event-level routes)
router.get("/:id/form", getEventForm);
router.put("/:id/form", protect, updateEventForm);

// Event-level analytics and participants (must be before "/:id")
router.get("/:id/analytics", protect, getEventAnalytics);
router.get("/:id/participants", protect, getEventParticipants);
router.get("/:id/participants/export", protect, exportEventParticipantsCSV);

// Accept / reject individual registrations (organizer)
router.post("/:id/registrations/:ticketId/accept", protect, organizerOnly, acceptRegistration);
router.post("/:id/registrations/:ticketId/reject", protect, organizerOnly, rejectRegistration);

// Mark attendance by ticket number (organizer)
router.post("/:id/attendance", protect, organizerOnly, markAttendance);

// Manual override attendance with audit log
router.post("/:id/attendance/override", protect, organizerOnly, manualOverrideAttendance);

// Calendar .ics download (public)
router.get("/:id/calendar.ics", generateCalendarICS);

// Core event routes (catch-all at end)
router.get("/:id", getEventById);
router.put("/:id", protect, organizerOnly, updateEvent);
router.delete("/:id", protect, organizerOnly, deleteEvent);
export default router;
