import user from "../models/user.js";
import PasswordReset from "../models/passwordreset.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

// Request password reset (for organizer, handled by admin)
export const requestPasswordReset = async (req, res) => {
  try {
    const userId = req.user._id;
    const { reason } = req.body;

    const orgUser = await user.findById(userId);
    if (!orgUser || orgUser.role !== "organizer") {
      return res
        .status(403)
        .json({
          success: false,
          error: "Only organizers can request password reset",
        });
    }

    // Check if there's already a pending request
    const existingRequest = await PasswordReset.findOne({
      userId,
      status: "pending",
    });

    if (existingRequest) {
      return res
        .status(400)
        .json({
          success: false,
          error: "You already have a pending password reset request",
        });
    }

    // Create reset request
    const resetRequest = new PasswordReset({
      userId,
      organizerName:
        orgUser.organizerName ||
        `${orgUser.firstname || ""} ${orgUser.lastname || ""}`.trim(),
      contactEmail: orgUser.contactEmail || orgUser.email,
      reason: reason || "Password reset request",
      status: "pending",
    });

    await resetRequest.save();
    res
      .status(201)
      .json({
        success: true,
        request: resetRequest,
        message: "Password reset request submitted to admin",
      });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Admin views password reset requests
export const getPasswordResetRequests = async (req, res) => {
  try {
    // Admin only
    if (req.user?.role !== "admin") {
      return res.status(403).json({ success: false, error: "Admin only" });
    }

    const requests = await PasswordReset.find()
      .populate("userId", "firstname lastname email organizerName")
      .populate("completedBy", "firstname lastname")
      .sort({ requestedAt: -1 });

    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Admin approves password reset
export const approvePasswordReset = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ success: false, error: "Admin only" });
    }

    const { requestId } = req.params;
    const { adminNotes } = req.body;

    const resetRequest = await PasswordReset.findById(requestId);
    if (!resetRequest)
      return res
        .status(404)
        .json({ success: false, error: "Request not found" });

    if (resetRequest.status !== "pending") {
      return res
        .status(400)
        .json({ success: false, error: "Request already processed" });
    }

    // Generate random password
    const newPassword = crypto.randomBytes(8).toString("hex");
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    resetRequest.status = "approved";
    resetRequest.adminNotes = adminNotes || "";
    resetRequest.completedAt = new Date();
    resetRequest.completedBy = req.user._id;
    resetRequest.newGeneratedPassword = newPassword;

    await resetRequest.save();

    // Update organizer password
    const orgUser = await user.findById(resetRequest.userId);
    orgUser.password = hashedPassword;
    await orgUser.save();

    res.json({
      success: true,
      request: resetRequest,
      newPassword,
      message: "Password reset approved. Share the password with organizer.",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Admin rejects password reset
export const rejectPasswordReset = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ success: false, error: "Admin only" });
    }

    const { requestId } = req.params;
    const { reason } = req.body;

    const resetRequest = await PasswordReset.findById(requestId);
    if (!resetRequest)
      return res
        .status(404)
        .json({ success: false, error: "Request not found" });

    if (resetRequest.status !== "pending") {
      return res
        .status(400)
        .json({ success: false, error: "Request already processed" });
    }

    resetRequest.status = "rejected";
    resetRequest.adminNotes = reason || "Rejected by admin";
    resetRequest.completedAt = new Date();
    resetRequest.completedBy = req.user._id;

    await resetRequest.save();

    res.json({ success: true, request: resetRequest });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get password reset history for an organizer
export const getPasswordResetHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const history = await PasswordReset.find({ userId }).sort({
      requestedAt: -1,
    });

    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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
