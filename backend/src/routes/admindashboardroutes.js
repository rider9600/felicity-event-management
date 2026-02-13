import express from "express";
import {
  getOrganizers,
  removeOrganizer,
  createorganizer,
} from "../controllers/admincontroller.js";
import { getAdminAnalytics } from "../controllers/adminanalyticscontroller.js";
import { protect } from "../middleware/authmiddleware.js";
import { adminOnly } from "../middleware/rolemiddleware.js";
const router = express.Router();
router.get("/organizers", protect, adminOnly, getOrganizers);
router.post("/organizer", protect, adminOnly, createorganizer);
router.delete("/organizer/:id", protect, adminOnly, removeOrganizer);
router.get("/analytics", protect, adminOnly, getAdminAnalytics);
export default router;
