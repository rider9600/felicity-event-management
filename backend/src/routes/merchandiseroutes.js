import express from "express";
import {
  uploadPaymentProof,
  getPendingPayments,
  approvePayment,
  rejectPayment,
  getOrganizerPaymentHistory,
} from "../controllers/merchandisecontroller.js";
import { protect } from "../middleware/authmiddleware.js";
import { uploadPaymentProof as uploadMiddleware } from "../middleware/uploadmiddleware.js";
import { organizerOnly } from "../middleware/rolemiddleware.js";

const router = express.Router();

// Participant uploads payment proof for a merchandise ticket
router.post(
  "/:ticketId/proof",
  protect,
  uploadMiddleware.single("proof"),
  uploadPaymentProof,
);

// Organizer views pending approvals for their events
router.get("/organizer/pending", protect, organizerOnly, getPendingPayments);

// Organizer approves/rejects payment
router.put("/:ticketId/approve", protect, organizerOnly, approvePayment);
router.put("/:ticketId/reject", protect, organizerOnly, rejectPayment);

// Organizer views payment history for their events
router.get("/organizer/history", protect, getOrganizerPaymentHistory);

export default router;
