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

const router = express.Router();

// Participant uploads payment proof for a merchandise ticket
router.post(
  "/:ticketId/proof",
  protect,
  uploadMiddleware.single("proof"),
  uploadPaymentProof,
);

// Admin views pending approvals
router.get("/admin/pending", protect, getPendingPayments);

// Admin approves/rejects payment
router.put("/:ticketId/approve", protect, approvePayment);
router.put("/:ticketId/reject", protect, rejectPayment);

// Organizer views payment history for their events
router.get("/organizer/history", protect, getOrganizerPaymentHistory);

export default router;
