import express from "express";
import {
  getEvents,
  getEventById,
  getTrendingEvents,
  registerForEvent,
  purchaseMerchandise,
  getTicket,
} from "../controllers/eventController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.get("/", getEvents);
router.get("/trending", getTrendingEvents);
router.get("/:id", getEventById);

// Private routes (Participant only)
router.post(
  "/:id/register",
  protect,
  authorize("participant"),
  registerForEvent,
);
router.post(
  "/:id/purchase",
  protect,
  authorize("participant"),
  purchaseMerchandise,
);

// Ticket verification (any authenticated user)
router.get("/tickets/:ticketId", protect, getTicket);

export default router;
