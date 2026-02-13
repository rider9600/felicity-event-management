import user from "../models/user.js";
import PasswordReset from "../models/passwordreset.js";
import bcrypt from "bcrypt";

// Request password reset (for organizer, handled by admin)
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const organizer = await user.findOne({ email, role: "organizer" });
    if (!organizer) return res.status(404).json({ msg: "Organizer not found" });

    // Check if there's already a pending request
    const existingRequest = await PasswordReset.findOne({
      userId: organizer._id,
      status: "pending",
    });

    if (existingRequest) {
      return res
        .status(400)
        .json({ msg: "Password reset request already pending" });
    }

    // Create reset request
    const resetRequest = new PasswordReset({
      userId: organizer._id,
    });

    await resetRequest.save();
    res.json({ msg: "Password reset request sent to admin" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin views password reset requests
export const getPasswordResetRequests = async (req, res) => {
  try {
    const requests = await PasswordReset.find()
      .populate("userId", "firstname lastname email organizerName")
      .populate("completedBy", "firstname lastname")
      .sort({ requestedAt: -1 });

    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin resets organizer password
export const resetOrganizerPassword = async (req, res) => {
  try {
    const { requestId, newPassword } = req.body;
    const adminId = req.user._id;

    const resetRequest = await PasswordReset.findById(requestId);
    if (!resetRequest) {
      return res.status(404).json({ msg: "Reset request not found" });
    }

    if (resetRequest.status !== "pending") {
      return res.status(400).json({ msg: "Reset request already processed" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    const organizer = await user.findByIdAndUpdate(
      resetRequest.userId,
      { password: hashed },
      { new: true },
    );

    if (!organizer) return res.status(404).json({ msg: "Organizer not found" });

    // Update reset request
    resetRequest.status = "completed";
    resetRequest.completedAt = new Date();
    resetRequest.completedBy = adminId;
    await resetRequest.save();

    const { password: _, ...safeOrganizer } = organizer._doc;
    res.json({ msg: "Password reset successful", organizer: safeOrganizer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin rejects password reset request
export const rejectPasswordReset = async (req, res) => {
  try {
    const { requestId, reason } = req.body;
    const adminId = req.user._id;

    const resetRequest = await PasswordReset.findById(requestId);
    if (!resetRequest) {
      return res.status(404).json({ msg: "Reset request not found" });
    }

    resetRequest.status = "rejected";
    resetRequest.adminNotes = reason;
    resetRequest.completedAt = new Date();
    resetRequest.completedBy = adminId;
    await resetRequest.save();

    res.json({ msg: "Password reset request rejected" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Participant password change
export const changeParticipantPassword = async (req, res) => {
  try {
    const participantId = req.user._id;
    const { oldPassword, newPassword } = req.body;
    const participant = await user.findById(participantId);
    const match = await bcrypt.compare(oldPassword, participant.password);
    if (!match) return res.status(400).json({ msg: "Incorrect old password" });
    participant.password = await bcrypt.hash(newPassword, 10);
    await participant.save();
    res.json({ msg: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
