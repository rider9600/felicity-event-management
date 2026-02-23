import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    ticketId: { type: String, required: true, unique: true },
    participantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    qrCode: { type: String }, // base64 or url
    status: {
      type: String,
      enum: ["active", "completed", "cancelled", "rejected"],
      default: "active",
    },
    registrationStatus: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    purchaseDetails: { type: Object }, // for merchandise
    formData: { type: Object }, // for custom registration form data
    attendance: { type: Boolean, default: false },
    attendedAt: { type: Date, default: null },
    paymentStatus: {
      type: String,
      enum: ["pending", "pending_approval", "paid", "rejected", "refunded"],
      default: "pending",
    },
    // Merchandise payment proof fields
    paymentProof: { type: String, default: null },
    paymentProofUploadedAt: { type: Date, default: null },
    paymentApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
    paymentApprovedAt: { type: Date, default: null },
    paymentRejectedReason: { type: String, default: null },
    // Audit log for manual attendance overrides
    auditLog: [
      {
        action: String,
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
        reason: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model("Ticket", ticketSchema);
