import mongoose from "mongoose";

const passwordResetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  clubId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Club",
    default: null,
  },
  clubName: { type: String, default: "" },
  organizerName: { type: String, default: "" },
  contactEmail: { type: String, default: "" },
  reason: { type: String, default: "" },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  adminNotes: { type: String, default: "" },
  rejectionReason: { type: String, default: "" },
  completedAt: Date,
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  newGeneratedPassword: { type: String, default: null },
});

// Index for better query performance
passwordResetSchema.index({ userId: 1, status: 1 });
passwordResetSchema.index({ requestedAt: -1 });

export default mongoose.model("PasswordReset", passwordResetSchema);
