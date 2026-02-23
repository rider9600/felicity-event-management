import mongoose from "mongoose";

const teamMemberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  status: {
    type: String,
    enum: ["invited", "accepted", "declined"],
    default: "invited",
  },
  joinedAt: {
    type: Date,
  },
});

const teamSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    leaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    teamName: {
      type: String,
      required: true,
    },
    teamSize: {
      type: Number,
      required: true,
      min: 2,
      max: 10,
    },
    inviteCode: {
      type: String,
      unique: true,
      required: true,
    },
    members: [teamMemberSchema],
    status: {
      type: String,
      enum: ["forming", "complete", "cancelled"],
      default: "forming",
    },
    registrationComplete: {
      type: Boolean,
      default: false,
    },
    registrationCompletedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Team", teamSchema);
