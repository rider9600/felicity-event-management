import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
export const signup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      participantType,
      collegeOrg,
      contactNumber,
    } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Validate IIIT email - must be @students.iiit.ac.in or @research.iiit.ac.in
    if (participantType === "iiit") {
      const iiitEmailRegex =
        /@(students\.iiit\.ac\.in|research\.iiit\.ac\.in)$/;
      if (!iiitEmailRegex.test(email)) {
        return res.status(400).json({
          message:
            "IIIT participants must use email ending with @students.iiit.ac.in or @research.iiit.ac.in",
        });
      }
    }

    // Validate non-IIIT email
    if (participantType === "non-iiit") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          message: "Please enter a valid email address",
        });
      }
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: "participant",
      participantType,
      collegeOrg,
      contactNumber,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        participantType: user.participantType,
        token: generateToken(user._id),
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      // Check if organizer account is active
      if (user.role === "organizer" && user.isActive === false) {
        return res.status(403).json({
          message: "Your account has been disabled. Please contact the admin.",
        });
      }

      const userData = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      };

      // Add role-specific data
      if (user.role === "participant") {
        userData.participantType = user.participantType;
      } else if (user.role === "organizer") {
        userData.name =
          user.organizerName || user.firstName + " " + user.lastName;
      }

      res.json({
        user: userData,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("followedOrganizers", "organizerName category description");

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.firstName = req.body.firstName || user.firstName;
      user.lastName = req.body.lastName || user.lastName;
      user.contactNumber = req.body.contactNumber || user.contactNumber;
      user.collegeOrg = req.body.collegeOrg || user.collegeOrg;
      user.interests = req.body.interests || user.interests;
      user.followedOrganizers =
        req.body.followedOrganizers || user.followedOrganizers;

      // Organizer-specific updates
      if (user.role === "organizer") {
        user.organizerName = req.body.name || user.organizerName;
        user.category = req.body.category || user.category;
        user.description = req.body.description || user.description;
        user.contactEmail = req.body.contactEmail || user.contactEmail;
        user.discordWebhook = req.body.discordWebhook || user.discordWebhook;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        role: updatedUser.role,
        contactNumber: updatedUser.contactNumber,
        collegeOrg: updatedUser.collegeOrg,
        interests: updatedUser.interests,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);

    if (user && (await user.matchPassword(currentPassword))) {
      user.password = newPassword;
      await user.save();

      res.json({ message: "Password updated successfully" });
    } else {
      res.status(401).json({ message: "Current password is incorrect" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
