import express from "express";
import {
  getOrganizerAnalytics,
  exportParticipantList,
  markAttendance,
} from "../controllers/organizeranalyticscontroller.js";
import { protect } from "../middleware/authmiddleware.js";
import { organizerOnly } from "../middleware/rolemiddleware.js";

const router = express.Router();

router.get("/", protect, organizerOnly, getOrganizerAnalytics);
router.get("/export/:eventId", protect, organizerOnly, exportParticipantList);
router.put("/attendance/:ticketId", protect, organizerOnly, markAttendance);

export default router;
