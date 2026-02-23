import mongoose from "mongoose";

const forumPostSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    content: { type: String, required: true },
    type: {
      type: String,
      enum: ["message", "announcement", "question"],
      default: "message",
    },
    isPinned: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    parentPostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ForumPost",
      default: null,
    },
    reactions: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
        emoji: { type: String },
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model("ForumPost", forumPostSchema);
