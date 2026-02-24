import Ticket from "../models/ticket.js";
import Event from "../models/event.js";
import User from "../models/user.js";
import { generateQRCode } from "../utils/qrcode.js";
import { sendEmail, sendTicketEmail } from "../utils/email.js";

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
      message: "Payment proof uploaded. Awaiting organizer review.",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Organizer views pending merchandise payments for their events
export const getPendingPayments = async (req, res) => {
  try {
    // Organizer only
    if (req.user?.role !== "organizer") {
      return res
        .status(403)
        .json({ success: false, error: "Organizers only" });
    }

    // Find events belonging to this organizer
    const organizerId = req.user._id;
    const events = await Event.find({ organizerId }).select("_id");
    const eventIds = events.map((e) => e._id);

    const pendingTickets = await Ticket.find({
      paymentStatus: "pending_approval",
      eventId: { $in: eventIds },
    })
      .populate("participantId", "firstname lastname email")
      .populate("eventId", "eventName merchandise");

    res.json({ success: true, payments: pendingTickets });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Organizer approves a merchandise payment
export const approvePayment = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await Ticket.findOne({ ticketId })
      .populate("eventId")
      .populate("participantId");
    if (!ticket) {
      return res
        .status(404)
        .json({ success: false, error: "Ticket not found" });
    }

    // Ensure the current user is the organizer of this event
    if (
      !ticket.eventId.organizerId ||
      String(ticket.eventId.organizerId) !== String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        error: "You can only approve payments for your own events",
      });
    }

    if (ticket.paymentStatus !== "pending_approval") {
      return res
        .status(400)
        .json({ success: false, error: "Ticket is not pending approval" });
    }

    // Decrement stock atomically on approval
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
      const qty = ticket.purchaseDetails?.quantity || 1;
      if (item.stock < qty) {
        return res
          .status(400)
          .json({ success: false, error: "Item is out of stock" });
      }

      item.stock -= qty;

      // Track analytics
      ticket.eventId.registrationCount =
        (ticket.eventId.registrationCount || 0) + 1;
      ticket.eventId.revenue =
        (ticket.eventId.revenue || 0) + (item.price || 0) * qty;
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

    // Send approval email with QR ticket details
    const participant = ticket.participantId;
    const event = ticket.eventId;
    try {
      await sendTicketEmail(
        participant.email,
        `Your Ticket for ${event.eventName}`,
        {
          ticketId: ticket.ticketId,
          eventName: event.eventName,
          eventType: event.eventType,
          eventDate: event.eventStartDate,
          eventEndDate: event.eventEndDate,
          venue: event.venue,
          status: ticket.status,
          participantName: `${participant.firstname || ""} ${participant.lastname || ""}`.trim(),
          participantEmail: participant.email,
          purchaseItem: ticket.purchaseDetails?.name,
          purchaseSize: ticket.purchaseDetails?.size,
        },
        ticket.qrCode,
      );
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

// Organizer rejects a merchandise payment
export const rejectPayment = async (req, res) => {
  try {
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

    // Ensure the current user is the organizer of this event
    if (
      !ticket.eventId.organizerId ||
      String(ticket.eventId.organizerId) !== String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        error: "You can only reject payments for your own events",
      });
    }

    ticket.paymentStatus = "rejected";
    ticket.paymentApprovedBy = req.user._id;
    ticket.paymentApprovedAt = new Date();
    ticket.paymentRejectedReason = reason || "Rejected by organizer";

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
