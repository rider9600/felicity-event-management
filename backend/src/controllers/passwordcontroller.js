import user from "../models/user.js";
import Club from "../models/club.js";
import PasswordReset from "../models/passwordreset.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

// Request password reset (for organizer, handled by admin)
export const requestPasswordReset = async (req, res) => {
  try {
    const userId = req.user._id;
    const { reason, clubId } = req.body;

    const orgUser = await user.findById(userId);
    if (!orgUser || orgUser.role !== "organizer") {
      return res.status(403).json({
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
      return res.status(400).json({
        success: false,
        error: "You already have a pending password reset request",
      });
    }

    // Get club information if clubId is provided
    let clubData = null;
    let clubNameForRequest = "";

    if (clubId) {
      clubData = await Club.findById(clubId);
      if (clubData) {
        clubNameForRequest = clubData.name;
      }
    }

    // If no club found from clubId, try to get from user's clubs
    if (!clubNameForRequest && orgUser.clubs && orgUser.clubs.length > 0) {
      const firstClub = await Club.findById(orgUser.clubs[0]);
      if (firstClub) {
        clubNameForRequest = firstClub.name;
      }
    }

    // Create reset request
    const resetRequest = new PasswordReset({
      userId,
      clubId: clubData?._id || null,
      clubName: clubNameForRequest,
      organizerName:
        orgUser.organizerName ||
        `${orgUser.firstname || ""} ${orgUser.lastname || ""}`.trim(),
      contactEmail: orgUser.contactEmail || orgUser.email,
      reason: reason || "Password reset request",
      status: "pending",
    });

    await resetRequest.save();
    res.status(201).json({
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

    const { status: filterStatus } = req.query; // Optional status filter

    let query = {};
    if (
      filterStatus &&
      ["pending", "approved", "rejected"].includes(filterStatus)
    ) {
      query.status = filterStatus;
    }

    const requests = await PasswordReset.find(query)
      .populate("userId", "firstname lastname email organizerName")
      .populate("clubId", "name category description")
      .populate("completedBy", "firstname lastname email")
      .sort({ requestedAt: -1 });

    res.json({
      success: true,
      requests,
      summary: {
        total: requests.length,
        pending: requests.filter((r) => r.status === "pending").length,
        approved: requests.filter((r) => r.status === "approved").length,
        rejected: requests.filter((r) => r.status === "rejected").length,
      },
    });
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

    // Generate secure random password (12 characters with mixed case, numbers, symbols)
    const newPassword = generateSecurePassword();
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
      organizer: {
        name:
          orgUser.organizerName || `${orgUser.firstname} ${orgUser.lastname}`,
        email: orgUser.email,
        club: resetRequest.clubName,
      },
      message:
        "Password reset approved. Share the password with organizer through official communication.",
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
    const { rejectionReason, adminNotes } = req.body;

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
    resetRequest.rejectionReason =
      rejectionReason || "Request rejected by admin";
    resetRequest.adminNotes = adminNotes || "";
    resetRequest.completedAt = new Date();
    resetRequest.completedBy = req.user._id;

    await resetRequest.save();

    res.json({
      success: true,
      request: resetRequest,
      message: "Password reset request rejected",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get password reset history for an organizer
export const getPasswordResetHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    // Only organizers can view their own history
    if (req.user.role !== "organizer") {
      return res.status(403).json({
        success: false,
        error: "Only organizers can view their password reset history",
      });
    }

    const history = await PasswordReset.find({ userId })
      .populate("clubId", "name category")
      .populate("completedBy", "firstname lastname")
      .sort({ requestedAt: -1 });

    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get a specific password reset request details
export const getPasswordResetRequestDetails = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const resetRequest = await PasswordReset.findById(requestId)
      .populate("userId", "firstname lastname email organizerName")
      .populate("clubId", "name category description")
      .populate("completedBy", "firstname lastname email");

    if (!resetRequest) {
      return res
        .status(404)
        .json({ success: false, error: "Request not found" });
    }

    // Allow organizer to see only their own request, admin can see any
    if (
      req.user.role === "organizer" &&
      resetRequest.userId._id.toString() !== userId.toString()
    ) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    res.json({ success: true, request: resetRequest });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Participant password change (participants only)
export const changeParticipantPassword = async (req, res) => {
  try {
    const participantId = req.user._id;

    // Only participants can change their password directly
    if (req.user.role !== "participant") {
      return res.status(403).json({
        success: false,
        error:
          "Only participants can change their password directly. Organizers must submit a password reset request for admin approval.",
      });
    }

    const { oldPassword, newPassword } = req.body;
    const participant = await user.findById(participantId);
    const match = await bcrypt.compare(oldPassword, participant.password);
    if (!match) return res.status(400).json({ msg: "Incorrect old password" });
    participant.password = await bcrypt.hash(newPassword, 10);
    await participant.save();
    res.json({ success: true, msg: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Utility function to generate secure password
function generateSecurePassword() {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*";

  const allChars = uppercase + lowercase + numbers + symbols;

  let password = "";
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Fill the rest randomly
  for (let i = 4; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}
