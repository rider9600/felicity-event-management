import user from "../models/user.js";
import Admin from "../models/admin.js";
import bcrypt from "bcrypt";
import { sendOrganizerCredentials } from "../utils/email.js";
const generatepassword = () => {
  return Math.random().toString(36).slice(-8);
};
export const createorganizer = async (req, res) => {
  try {
    const { firstname, lastname, email } = req.body;
    const exists = await user.findOne({ email });
    if (exists) {
      return res
        .status(400)
        .json({ msg: "try again with new email th euser alrady exists" });
    }
    const newpassword = generatepassword();
    const hashed = await bcrypt.hash(newpassword, 10);
    const organiser = await user.create({
      firstname,
      lastname,
      email,
      password: hashed,
      role: "organizer",
      participantType: "non-iiit",
    });
    const { password: _, ...safeUser } = organiser._doc;

    // Send credentials email
    await sendOrganizerCredentials(
      email,
      `${firstname} ${lastname}`,
      newpassword,
    );

    res.json({
      msg: "Organizer created successfully",
      loginPassword: newpassword,
      organizer: safeUser,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Organizer listing
export const getOrganizers = async (req, res) => {
  try {
    const organizers = await user.find({ role: "organizer" });
    res.json(organizers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Organizer removal
export const removeOrganizer = async (req, res) => {
  try {
    const { id } = req.params;
    await user.findByIdAndDelete(id);
    res.json({ message: "Organizer removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
