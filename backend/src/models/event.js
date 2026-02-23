import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    eventName: { type: String, required: true },

    // Spec requires description
    eventDescription: { type: String, required: true },

    eventType: {
      type: String,
      enum: ["normal", "merchandise"],
      required: true,
    },

    // Spec requires eligibility
    eligibility: { type: String, default: "" },

    // Frontend already sends venue but schema didn't have it
    venue: { type: String, default: "" },

    registrationDeadline: { type: Date, required: true },
    eventStartDate: { type: Date, required: true },
    eventEndDate: { type: Date, required: true },

    // safer defaults
    registrationLimit: { type: Number, default: 0 },
    registrationFee: { type: Number, default: 0 },

    // REQUIRED by spec
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: false,
    },

    // spec requires tags
    eventTags: { type: [String], default: [] },

    status: {
      type: String,
      enum: ["draft", "published", "ongoing", "completed", "closed"],
      default: "draft",
    },

    // Normal events
    customForm: { type: Object },
    customFormLocked: { type: Boolean, default: false },

    registrationCount: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },

    // Merchandise events
    merchandise: {
      items: [
        {
          name: String,
          size: String,
          color: String,
          variant: String,
          stock: Number,
          purchaseLimit: Number,
        },
      ],
    },
  },
  {
    timestamps: true, // Needed for trending / analytics features
  },
);

// Helpful for search performance
eventSchema.index({ eventName: "text" });

export default mongoose.model("Event", eventSchema);
