import mongoose from "mongoose";

const clubSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  category: String,
  organizers: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  events: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Club", clubSchema);
