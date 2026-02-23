import user from "../models/user.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

// Auto-generate a random password
const generatePassword = () => {
  return crypto.randomBytes(8).toString("hex");
};

// Admin: Create an organizer account (auto-generates password)
export const createorganizer = async (req, res) => {
  try {
    const { firstname, lastname, email, organizerName, category, description } = req.body;

    if (!firstname || !lastname || !email) {
      return res.status(400).json({ success: false, error: "firstname, lastname and email are required" });
    }

    const exists = await user.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, error: "A user with this email already exists" });
    }

    const newpassword = generatePassword();
    const hashed = await bcrypt.hash(newpassword, 10);

    const organiser = await user.create({
      firstname,
      lastname,
      email,
      password: hashed,
      role: "organizer",
      participantType: "non-iiit",
      organizerName: organizerName || `${firstname} ${lastname}`,
      category: category || "General",
      description: description || "",
    });

    const { password: _, ...safeUser } = organiser._doc;

    res.status(201).json({
      success: true,
      message: "Organizer created successfully",
      data: {
        organizer: safeUser,
        loginPassword: newpassword, // Admin shares this with the organizer
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Admin: List all organizers
export const getOrganizers = async (req, res) => {
  try {
    const organizers = await user.find({ role: "organizer" }).select("-password").lean();
    res.json({
      success: true,
      data: organizers,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Admin: Get all users (participants + organizers)
export const getAllUsers = async (req, res) => {
  try {
    const users = await user.find({}).select("-password").lean();
    res.json({
      success: true,
      data: users,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Admin: Remove/archive an organizer
export const removeOrganizer = async (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = await user.findById(id);
    if (!targetUser) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    // Archive (soft delete) instead of permanent deletion
    targetUser.isArchived = true;
    await targetUser.save();
    res.json({ success: true, message: "Organizer removed/archived successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Admin: Delete organizer permanently
export const deleteOrganizer = async (req, res) => {
  try {
    const { id } = req.params;
    await user.findByIdAndDelete(id);
    res.json({ success: true, message: "Organizer permanently deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Admin: Suspend or activate a user
export const handleUserAction = async (req, res) => {
  try {
    const { id, action } = req.params;
    let update = {};

    if (action === "suspend") {
      update = { isArchived: true };
    } else if (action === "activate") {
      update = { isArchived: false };
    } else {
      return res.status(400).json({ success: false, error: "Invalid action. Use 'suspend' or 'activate'." });
    }

    const updatedUser = await user.findByIdAndUpdate(id, update, { new: true }).select("-password");
    if (!updatedUser) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({ success: true, data: updatedUser });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
