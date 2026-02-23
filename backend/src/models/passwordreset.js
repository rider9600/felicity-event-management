import mongoose from "mongoose";

const passwordResetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
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
  completedAt: Date,
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  newGeneratedPassword: { type: String, default: null },
});

export default mongoose.model("PasswordReset", passwordResetSchema);
