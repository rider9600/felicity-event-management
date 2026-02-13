import user from "../models/user.js";
import bcrypt from "bcrypt";

export const createOrganizer = async (req, res) => {
  try {
    const {
      organizerName,
      category,
      description,
      contactEmail,
      contactNumber,
      password,
    } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const organizer = new user({
      firstname: organizerName,
      lastname: "",
      email: contactEmail,
      organizerName,
      category,
      description,
      contactEmail,
      contactNumber,
      password: hashedPassword,
      role: "organizer",
      participantType: "non-iiit",
    });
    await organizer.save();
    const { password: _, ...safeOrganizer } = organizer._doc;
    res
      .status(201)
      .json({ message: "Organizer created", organizer: safeOrganizer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getOrganizers = async (req, res) => {
  try {
    const organizers = await user
      .find({ role: "organizer", isArchived: { $ne: true } })
      .select("-password");
    res.json(organizers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getOrganizerById = async (req, res) => {
  try {
    const { id } = req.params;
    const organizer = await user
      .findOne({ _id: id, role: "organizer" })
      .select("-password");
    if (!organizer) return res.status(404).json({ msg: "Organizer not found" });
    res.json(organizer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const removeOrganizer = async (req, res) => {
  try {
    const { id } = req.params;
    await user.findByIdAndUpdate(id, { isArchived: true });
    res.json({ message: "Organizer archived" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteOrganizerPermanently = async (req, res) => {
  try {
    const { id } = req.params;
    await user.findByIdAndDelete(id);
    res.json({ message: "Organizer permanently deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateOrganizer = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      organizerName,
      category,
      description,
      contactEmail,
      contactNumber,
      discordWebhook,
    } = req.body;
    const updates = {};
    if (organizerName) {
      updates.organizerName = organizerName;
      updates.firstname = organizerName;
    }
    if (category) updates.category = category;
    if (description) updates.description = description;
    if (contactEmail) updates.contactEmail = contactEmail;
    if (contactNumber) updates.contactNumber = contactNumber;
    if (discordWebhook !== undefined) updates.discordWebhook = discordWebhook;
    const organizer = await user
      .findByIdAndUpdate(id, updates, { new: true })
      .select("-password");
    res.json({ message: "Organizer updated", organizer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get organizer profile (self)
export const getOrganizerProfile = async (req, res) => {
  try {
    const organizerId = req.user._id;
    const organizer = await user.findById(organizerId).select("-password");
    res.json(organizer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update organizer profile (self)
export const updateOrganizerProfile = async (req, res) => {
  try {
    const organizerId = req.user._id;
    const {
      organizerName,
      category,
      description,
      contactEmail,
      contactNumber,
      discordWebhook,
    } = req.body;
    const updates = {};
    if (organizerName) {
      updates.organizerName = organizerName;
      updates.firstname = organizerName;
    }
    if (category) updates.category = category;
    if (description) updates.description = description;
    if (contactEmail) updates.contactEmail = contactEmail;
    if (contactNumber) updates.contactNumber = contactNumber;
    if (discordWebhook !== undefined) updates.discordWebhook = discordWebhook;
    const organizer = await user
      .findByIdAndUpdate(organizerId, updates, { new: true })
      .select("-password");
    res.json({ message: "Profile updated", organizer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
