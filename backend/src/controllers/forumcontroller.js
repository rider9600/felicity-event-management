import ForumPost from "../models/forumpost.js";
import Ticket from "../models/ticket.js";
import Event from "../models/event.js";

// Helper: check if user is registered for event (or is organizer/admin)
const canAccessForum = async (userId, userRole, eventId) => {
  if (userRole === "admin") return true;
  const event = await Event.findById(eventId);
  if (!event) return false;
  if (String(event.organizerId) === String(userId)) return true;
  // Check if participant has a ticket for this event
  const ticket = await Ticket.findOne({ participantId: userId, eventId });
  return !!ticket;
};

// Get all posts for an event (threaded)
export const getForumPosts = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const hasAccess = await canAccessForum(userId, userRole, eventId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: "You must be registered for this event to view the forum." });
    }

    const posts = await ForumPost.find({ eventId, isDeleted: false })
      .populate("authorId", "firstname lastname role organizerName")
      .sort({ isPinned: -1, createdAt: 1 });

    res.json({ success: true, posts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Post a message
export const createForumPost = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { content, type, parentPostId } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    if (!content?.trim()) {
      return res.status(400).json({ success: false, error: "Content is required" });
    }

    const hasAccess = await canAccessForum(userId, userRole, eventId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: "You must be registered to post in this forum." });
    }

    // Only organizer/admin can post announcements
    const postType = (type === "announcement" && (userRole === "organizer" || userRole === "admin"))
      ? "announcement"
      : (type === "question" ? "question" : "message");

    const post = new ForumPost({
      eventId,
      authorId: userId,
      content: content.trim(),
      type: postType,
      parentPostId: parentPostId || null,
    });

    await post.save();
    await post.populate("authorId", "firstname lastname role organizerName");

    // Emit via socket if io is attached to app
    if (req.app.get("io")) {
      req.app.get("io").to(`forum-${eventId}`).emit("new_forum_post", post);
    }

    res.status(201).json({ success: true, post });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Delete a post (organizer/admin — soft delete)
export const deleteForumPost = async (req, res) => {
  try {
    const { eventId, postId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, error: "Event not found" });

    // Organizer of this event or admin can delete
    const isOrganizer = String(event.organizerId) === String(userId);
    if (!isOrganizer && userRole !== "admin") {
      return res.status(403).json({ success: false, error: "Only organizers can delete posts" });
    }

    const post = await ForumPost.findById(postId);
    if (!post) return res.status(404).json({ success: false, error: "Post not found" });

    post.isDeleted = true;
    await post.save();

    if (req.app.get("io")) {
      req.app.get("io").to(`forum-${eventId}`).emit("forum_post_deleted", { postId });
    }

    res.json({ success: true, message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Pin/unpin a post (organizer/admin)
export const togglePinForumPost = async (req, res) => {
  try {
    const { eventId, postId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, error: "Event not found" });

    const isOrganizer = String(event.organizerId) === String(userId);
    if (!isOrganizer && userRole !== "admin") {
      return res.status(403).json({ success: false, error: "Only organizers can pin posts" });
    }

    const post = await ForumPost.findById(postId);
    if (!post) return res.status(404).json({ success: false, error: "Post not found" });

    post.isPinned = !post.isPinned;
    await post.save();
    await post.populate("authorId", "firstname lastname role organizerName");

    if (req.app.get("io")) {
      req.app.get("io").to(`forum-${eventId}`).emit("forum_post_pinned", post);
    }

    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// React to a post (emoji reaction)
export const reactToForumPost = async (req, res) => {
  try {
    const { eventId, postId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    const hasAccess = await canAccessForum(userId, req.user.role, eventId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    const post = await ForumPost.findById(postId);
    if (!post) return res.status(404).json({ success: false, error: "Post not found" });

    // Toggle: if user already reacted with same emoji, remove it
    const existingIdx = post.reactions.findIndex(
      (r) => String(r.userId) === String(userId) && r.emoji === emoji
    );

    if (existingIdx > -1) {
      post.reactions.splice(existingIdx, 1);
    } else {
      post.reactions.push({ userId, emoji });
    }

    await post.save();
    await post.populate("authorId", "firstname lastname role organizerName");

    if (req.app.get("io")) {
      req.app.get("io").to(`forum-${eventId}`).emit("forum_post_reacted", { postId, reactions: post.reactions });
    }

    res.json({ success: true, reactions: post.reactions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
