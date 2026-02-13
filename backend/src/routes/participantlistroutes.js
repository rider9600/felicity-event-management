import express from "express";
import {
  getEventParticipants,
  exportParticipantsCSV,
  markAttendance,
} from "../controllers/participantlistcontroller.js";
import { protect } from "../middleware/authmiddleware.js";
import { organizerOnly } from "../middleware/rolemiddleware.js";

const router = express.Router();

router.get("/:eventId", protect, organizerOnly, getEventParticipants);
router.get("/:eventId/export", protect, organizerOnly, exportParticipantsCSV);
router.put("/attendance/:ticketId", protect, organizerOnly, markAttendance);

export default router;
