import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["registered", "completed", "cancelled", "rejected"],
      default: "registered",
    },
    formData: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
    teamName: {
      type: String,
      trim: true,
    },
    ticketId: {
      type: String,
      unique: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "completed", // For now, assume immediate payment
    },
    attended: {
      type: Boolean,
      default: false,
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Generate unique ticket ID before saving
registrationSchema.pre("save", function (next) {
  if (!this.ticketId) {
    this.ticketId = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  next();
});

// Index for faster queries
registrationSchema.index({ event: 1, participant: 1 }, { unique: true });

const Registration = mongoose.model("Registration", registrationSchema);

export default Registration;
