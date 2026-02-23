import express from "express";
import {
  createorganizer,
  getOrganizers,
  getAllUsers,
  removeOrganizer,
  deleteOrganizer,
  handleUserAction,
} from "../controllers/admincontroller.js";
import {
  adminUpdateEvent,
  adminDeleteEvent,
} from "../controllers/eventcontroller.js";
import { protect, allowRoles } from "../middleware/authmiddleware.js";
import { adminOnly } from "../middleware/rolemiddleware.js";

const router = express.Router();

// Organizer management
router.post("/create-organizer", protect, allowRoles("admin"), createorganizer);
router.get("/organizers", protect, allowRoles("admin"), getOrganizers);
router.put("/organizer/:id/remove", protect, allowRoles("admin"), removeOrganizer);   // soft delete
router.delete("/organizer/:id", protect, allowRoles("admin"), deleteOrganizer);        // hard delete

// All users (for ManageUsers page)
router.get("/users", protect, allowRoles("admin"), getAllUsers);
router.put("/users/:id/:action", protect, allowRoles("admin"), handleUserAction);

// Admin event management
router.put("/event/:id", protect, adminOnly, adminUpdateEvent);
router.delete("/event/:id", protect, adminOnly, adminDeleteEvent);

export default router;
