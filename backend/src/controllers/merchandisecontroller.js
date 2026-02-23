import Ticket from "../models/ticket.js";
import Event from "../models/event.js";
import User from "../models/user.js";
import { generateQRCode } from "../utils/qrcode.js";
import { sendEmail } from "../utils/email.js";

// Upload payment proof for a merchandise purchase (participant)
export const uploadPaymentProof = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const participantId = req.user._id;

    // Validate file uploaded
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: "No file uploaded" });
    }

    const ticket = await Ticket.findOne({ ticketId, participantId });
    if (!ticket) {
      return res
        .status(404)
        .json({ success: false, error: "Ticket not found" });
    }

    // Check ticket is waiting for payment proof
    if (ticket.paymentStatus !== "pending") {
      return res.status(400).json({
        success: false,
        error: `Cannot upload proof for ticket with status: ${ticket.paymentStatus}`,
      });
    }

    // Store proof path/URL (local disk or S3 URL)
    ticket.paymentProof = `/uploads/${req.file.filename}`;
    ticket.paymentProofUploadedAt = new Date();
    ticket.paymentStatus = "pending_approval";

    await ticket.save();

    res.json({
      success: true,
      ticket,
      message: "Payment proof uploaded. Awaiting admin review.",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Admin views pending merchandise payments
export const getPendingPayments = async (req, res) => {
  try {
    // Admin only
    if (req.user?.role !== "admin") {
      return res.status(403).json({ success: false, error: "Admin only" });
    }

    const pendingTickets = await Ticket.find({
      paymentStatus: "pending_approval",
    })
      .populate("participantId", "firstname lastname email")
      .populate("eventId", "eventName merchandise");

    res.json({ success: true, payments: pendingTickets });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Admin approves a merchandise payment
export const approvePayment = async (req, res) => {
  try {
    // Admin only
    if (req.user?.role !== "admin") {
      return res.status(403).json({ success: false, error: "Admin only" });
    }

    const { ticketId } = req.params;

    const ticket = await Ticket.findOne({ ticketId })
      .populate("eventId")
      .populate("participantId");
    if (!ticket) {
      return res
        .status(404)
        .json({ success: false, error: "Ticket not found" });
    }

    if (ticket.paymentStatus !== "pending_approval") {
      return res
        .status(400)
        .json({ success: false, error: "Ticket is not pending approval" });
    }

    // Decrement stock atomically
    let itemIndex = -1;
    if (ticket.eventId.merchandise?.items && ticket.purchaseDetails?.itemId) {
      itemIndex = ticket.eventId.merchandise.items.findIndex(
        (i) => i._id.toString() === ticket.purchaseDetails.itemId,
      );

      if (itemIndex === -1) {
        return res
          .status(400)
          .json({ success: false, error: "Item not found" });
      }

      const item = ticket.eventId.merchandise.items[itemIndex];
      if (item.stock <= 0) {
        return res
          .status(400)
          .json({ success: false, error: "Item is out of stock" });
      }

      item.stock -= 1;
    }

    // Mark payment as paid
    ticket.paymentStatus = "paid";
    ticket.paymentApprovedBy = req.user._id;
    ticket.paymentApprovedAt = new Date();

    // Generate QR code now that payment is approved
    const qrCodeData = `TICKET:${ticket.ticketId}:${ticket.eventId._id}:${ticket.participantId._id}`;
    try {
      ticket.qrCode = await generateQRCode(qrCodeData);
    } catch (qrErr) {
      console.error("QR generation error:", qrErr);
      // Non-blocking: continue without QR
    }

    await ticket.save();
    if (itemIndex >= 0) {
      await ticket.eventId.save();
    }

    // Send approval email
    const participant = ticket.participantId;
    const event = ticket.eventId;
    try {
      await sendEmail({
        to: participant.email,
        subject: `Payment Approved for ${event.eventName}`,
        html: `
          <h3>Payment Approved</h3>
          <p>Hi ${participant.firstname},</p>
          <p>Your payment for <strong>${event.eventName}</strong> has been approved.</p>
          <p><strong>Ticket ID:</strong> ${ticket.ticketId}</p>
          <p>You can now access your event details and QR code in your dashboard.</p>
        `,
      });
    } catch (emailErr) {
      console.error("Email send error:", emailErr);
    }

    res.json({
      success: true,
      ticket,
      message: "Payment approved, QR generated, and email sent",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Admin rejects a merchandise payment
export const rejectPayment = async (req, res) => {
  try {
    // Admin only
    if (req.user?.role !== "admin") {
      return res.status(403).json({ success: false, error: "Admin only" });
    }

    const { ticketId } = req.params;
    const { reason } = req.body;

    const ticket = await Ticket.findOne({ ticketId }).populate("participantId");
    if (!ticket) {
      return res
        .status(404)
        .json({ success: false, error: "Ticket not found" });
    }

    if (ticket.paymentStatus !== "pending_approval") {
      return res
        .status(400)
        .json({ success: false, error: "Ticket is not pending approval" });
    }

    ticket.paymentStatus = "rejected";
    ticket.paymentApprovedBy = req.user._id;
    ticket.paymentApprovedAt = new Date();
    ticket.paymentRejectedReason = reason || "Rejected by admin";

    await ticket.save();

    // Send rejection email
    const participant = ticket.participantId;
    try {
      await sendEmail({
        to: participant.email,
        subject: "Payment Rejected",
        html: `
          <h3>Payment Rejected</h3>
          <p>Hi ${participant.firstname},</p>
          <p>Your payment proof has been reviewed and rejected.</p>
          <p><strong>Reason:</strong> ${reason || "No reason provided"}</p>
          <p>Please contact the organizer for further assistance.</p>
        `,
      });
    } catch (emailErr) {
      console.error("Email send error:", emailErr);
    }

    res.json({
      success: true,
      ticket,
      message: "Payment rejected and email sent",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get payment history for an organizer's events
export const getOrganizerPaymentHistory = async (req, res) => {
  try {
    const organizerId = req.user._id;

    // Get all events by organizer
    const events = await Event.find({ organizerId });
    const eventIds = events.map((e) => e._id);

    // Get all tickets for these events
    const tickets = await Ticket.find({
      eventId: { $in: eventIds },
      paymentStatus: { $in: ["pending_approval", "paid", "rejected"] },
    })
      .populate("participantId", "firstname lastname email")
      .populate("eventId", "eventName")
      .sort({ paymentProofUploadedAt: -1 });

    res.json({ success: true, payments: tickets });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
