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
    purchaseDetails: { type: Object }, // for merchandise
    formData: { type: Object }, // for custom registration form data
    attendance: { type: Boolean, default: false },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Ticket", ticketSchema);
