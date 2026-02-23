import Message from "../models/message.js";
import Team from "../models/team.js";

// Get chat history for a team
export const getTeamChatHistory = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { limit = 50, skip = 0 } = req.query;
    const userId = req.user._id;

    const team = await Team.findById(teamId);
    if (!team)
      return res.status(404).json({ success: false, error: "Team not found" });

    // Check if user is a team member
    if (!team.members.some((m) => String(m.userId) === String(userId))) {
      return res
        .status(403)
        .json({ success: false, error: "Not a team member" });
    }

    const messages = await Message.find({ teamId })
      .populate("senderId", "firstname lastname email")
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    res.json({ success: true, messages: messages.reverse() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Store message in DB (called by Socket.IO after broadcast)
export const storeMessage = async (req, res) => {
  try {
    const { teamId, content, fileUrl, fileType } = req.body;
    const senderId = req.user._id;

    const team = await Team.findById(teamId);
    if (!team)
      return res.status(404).json({ success: false, error: "Team not found" });

    if (!team.members.some((m) => String(m.userId) === String(senderId))) {
      return res
        .status(403)
        .json({ success: false, error: "Not a team member" });
    }

    const message = new Message({
      teamId,
      senderId,
      content: content || "",
      fileUrl: fileUrl || null,
      fileType: fileType || null,
    });

    await message.save();
    await message.populate("senderId", "firstname lastname email");

    res.status(201).json({ success: true, message });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Mark message as read
export const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message)
      return res
        .status(404)
        .json({ success: false, error: "Message not found" });

    if (!message.readBy.includes(userId)) {
      message.readBy.push(userId);
      await message.save();
    }

    res.json({ success: true, message });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
