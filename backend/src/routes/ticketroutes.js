import express from "express";
import {
  getMyTickets,
  getTicketById,
} from "../controllers/ticketcontroller.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.get("/my", protect, getMyTickets);
router.get("/:id", protect, getTicketById);

export default router;
