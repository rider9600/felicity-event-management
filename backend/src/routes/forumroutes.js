import express from "express";
import {
  getForumPosts,
  createForumPost,
  deleteForumPost,
  togglePinForumPost,
  reactToForumPost,
} from "../controllers/forumcontroller.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

// Get all posts for an event
router.get("/:eventId", protect, getForumPosts);

// Create a post
router.post("/:eventId", protect, createForumPost);

// Delete a post (organizer/admin)
router.delete("/:eventId/:postId", protect, deleteForumPost);

// Pin/unpin a post (organizer/admin)
router.put("/:eventId/:postId/pin", protect, togglePinForumPost);

// React to a post (emoji)
router.post("/:eventId/:postId/react", protect, reactToForumPost);

export default router;
