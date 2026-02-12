import mongoose from "mongoose";

const customFieldSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "text",
        "textarea",
        "email",
        "number",
        "date",
        "dropdown",
        "checkbox",
        "radio",
        "file",
      ],
      required: true,
    },
    required: {
      type: Boolean,
      default: false,
    },
    options: [
      {
        type: String,
      },
    ],
  },
  { _id: false },
);

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["normal", "merchandise"],
      required: true,
    },
    eligibility: {
      type: String,
      enum: ["all", "iiit"],
      required: true,
    },
    registrationDeadline: {
      type: Date,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    registrationLimit: {
      type: Number,
      min: 0,
    },
    registrationFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ["draft", "published", "ongoing", "completed", "closed"],
      default: "draft",
    },
    // Custom registration form
    customForm: {
      fields: [customFieldSchema],
    },
    // Merchandise-specific fields
    itemDetails: {
      stock: {
        type: Number,
        min: 0,
      },
      sizes: [
        {
          type: String,
        },
      ],
      colors: [
        {
          type: String,
        },
      ],
      variants: [
        {
          type: String,
        },
      ],
      purchaseLimit: {
        type: Number,
        min: 1,
      },
    },
    // Statistics
    registeredCount: {
      type: Number,
      default: 0,
    },
    attendanceCount: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Index for searching
eventSchema.index({ name: "text", description: "text" });
eventSchema.index({ startDate: 1 });
eventSchema.index({ status: 1 });

const Event = mongoose.model("Event", eventSchema);

export default Event;
