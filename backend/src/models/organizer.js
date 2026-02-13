import mongoose from "mongoose";

const organizerSchema = new mongoose.Schema({
  organizerName: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String },
  contactEmail: { type: String, required: true, unique: true },
  contactNumber: { type: String },
  password: { type: String, required: true }, // hashed
  events: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  role: { type: String, default: "organizer" },
});

export default mongoose.model("Organizer", organizerSchema);
