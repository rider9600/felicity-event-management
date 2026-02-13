import express from "express";
import { createorganizer } from "../controllers/admincontroller.js";
import {
  adminUpdateEvent,
  adminDeleteEvent,
} from "../controllers/eventcontroller.js";
import { protect, allowRoles } from "../middleware/authmiddleware.js";
const router = express.Router();
router.post("/create-organizer", protect, allowRoles("admin"), createorganizer);
// Admin event management
import { protect } from "../middleware/authmiddleware.js";
import { adminOnly } from "../middleware/rolemiddleware.js";
router.put("/event/:id", protect, adminOnly, adminUpdateEvent);
router.delete("/event/:id", protect, adminOnly, adminDeleteEvent);
export default router;
