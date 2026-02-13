import express from "express";
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  searchEvents,
  getTrendingEvents,
  getEventsByOrganizer,
} from "../controllers/eventcontroller.js";
import { protect } from "../middleware/authmiddleware.js";
import { organizerOnly } from "../middleware/rolemiddleware.js";
const router = express.Router();
router.post("/", protect, organizerOnly, createEvent);
router.get("/", getEvents);
router.get("/search", searchEvents);
router.get("/trending", getTrendingEvents);
router.get("/organizer/:organizerId", getEventsByOrganizer);
router.get("/:id", getEventById);
router.put("/:id", protect, organizerOnly, updateEvent);
router.delete("/:id", protect, organizerOnly, deleteEvent);
export default router;
