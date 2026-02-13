import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  eventName: { type: String, required: true },
  eventDescription: { type: String },
  eventType: { type: String, enum: ["normal", "merchandise"], required: true },
  eligibility: { type: String },
  registrationDeadline: { type: Date, required: true },
  eventStartDate: { type: Date, required: true },
  eventEndDate: { type: Date, required: true },
  registrationLimit: { type: Number },
  registrationFee: { type: Number },
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
  eventTags: [{ type: String }],
  status: {
    type: String,
    enum: ["draft", "published", "ongoing", "completed", "closed"],
    default: "draft",
  },
  customForm: { type: Object }, // for normal events
  customFormLocked: { type: Boolean, default: false }, // lock after first registration
  registrationCount: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
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
});

export default mongoose.model("Event", eventSchema);
