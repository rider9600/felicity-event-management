import mongoose from "mongoose";
const userschema = new mongoose.Schema(
  {
    firstname: String,
    lastname: String,
    email: {
      type: String,
      unique: true,
    },
    password: String,
    role: {
      type: String,
      enum: ["participant", "organizer", "admin"],
      default: "participant",
    },
    participantType: {
      type: String,
      enum: ["iiit", "non-iiit"],
      required: true,
    },
    college: { type: String },
    contactNumber: { type: String },
    interests: [{ type: String }],
    followedClubs: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    // Clubs this user (organizer) belongs to
    clubs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Club" }],
    // Onboarding fields
    isOnboarded: { type: Boolean, default: false },
    onboardingCompletedAt: { type: Date },
    // Organizer-specific fields
    organizerName: { type: String },
    category: { type: String },
    description: { type: String },
    contactEmail: { type: String },
    discordWebhook: { type: String },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true },
);
export default mongoose.model("user", userschema);
