import user from "../models/user.js";
import Event from "../models/event.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

// Auto-generate a random password
const generatePassword = () => {
  return crypto.randomBytes(8).toString("hex");
};

// Admin: Create an organizer account (auto-generates login email and password)
export const createorganizer = async (req, res) => {
  try {
    const { firstname, lastname, organizerName, category, description } =
      req.body;

    if (!firstname || !lastname) {
      return res.status(400).json({
        success: false,
        error: "firstname and lastname are required",
      });
    }

    const displayName =
      organizerName && organizerName.trim().length > 0
        ? organizerName.trim()
        : `${firstname} ${lastname}`.trim();

    // Generate a unique login email for the organizer
    const domain =
      process.env.ORGANIZER_EMAIL_DOMAIN || "organizer.felicity.local";
    const baseSlug =
      displayName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "")
        .slice(0, 20) || "organizer";

    let loginEmail = "";
    for (let i = 0; i < 5; i += 1) {
      const suffix = i === 0 ? "" : `_${crypto.randomBytes(2).toString("hex")}`;
      const candidate = `${baseSlug}${suffix}@${domain}`;
      // eslint-disable-next-line no-await-in-loop
      const exists = await user.findOne({ email: candidate });
      if (!exists) {
        loginEmail = candidate;
        break;
      }
    }

    if (!loginEmail) {
      loginEmail = `${baseSlug}_${crypto
        .randomBytes(4)
        .toString("hex")}@${domain}`;
    }

    const newpassword = generatePassword();
    const hashed = await bcrypt.hash(newpassword, 10);

    const organiser = await user.create({
      firstname,
      lastname,
      email: loginEmail,
      password: hashed,
      role: "organizer",
      participantType: "non-iiit",
      organizerName: displayName,
      category: category || "General",
      description: description || "",
    });

    const { password: _, ...safeUser } = organiser._doc;

    res.status(201).json({
      success: true,
      message: "Organizer created successfully",
      data: {
        organizer: safeUser,
        loginEmail,
        loginPassword: newpassword, // Admin shares these with the organizer
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

    // Delete all events belonging to this organizer
    await Event.deleteMany({ organizerId: id });

    // Delete the organizer account itself
    await user.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Organizer and all associated events permanently deleted",
    });
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
