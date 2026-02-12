import express from "express";
import {
  createOrganizer,
  getAllOrganizers,
  getPendingOrganizers,
  updateOrganizerStatus,
  disableOrganizer,
  enableOrganizer,
  deleteOrganizer,
  getAllUsers,
  getAllEvents,
  updateEventStatus,
  deleteEvent,
  getPlatformStats,
  resetUserPassword,
} from "../controllers/adminController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// All routes require admin role
router.use(protect, authorize("admin"));

// Organizer management
router.post("/organizers", createOrganizer);
router.get("/organizers", getAllOrganizers);
router.get("/organizers/pending", getPendingOrganizers);
router.put("/organizers/:id/status", updateOrganizerStatus);
router.put("/organizers/:id/disable", disableOrganizer);
router.put("/organizers/:id/enable", enableOrganizer);
router.delete("/organizers/:id", deleteOrganizer);

// User management
router.get("/users", getAllUsers);
router.put("/users/:id/reset-password", resetUserPassword);

// Event management
router.get("/events", getAllEvents);
router.put("/events/:id/status", updateEventStatus);
router.delete("/events/:id", deleteEvent);

// Platform statistics
router.get("/stats", getPlatformStats);

export default router;
