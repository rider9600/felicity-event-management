import User from "../models/User.js";
import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import { generateToken } from "../utils/generateToken.js";

// @desc    Create organizer account
// @route   POST /api/admin/organizers
// @access  Private (Admin)
export const createOrganizer = async (req, res) => {
  try {
    const { name, category, description, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required" });
    }

    const organizerEmail = email.toLowerCase().trim();
    const tempPassword = password;

    // Check if organizer with this email exists
    const existingOrganizer = await User.findOne({ email: organizerEmail });
    if (existingOrganizer) {
      return res.status(400).json({
        message: "Organizer with similar name already exists",
      });
    }

    // Create organizer account
    const organizer = await User.create({
      firstName: name.split(" ")[0] || name,
      lastName: name.split(" ").slice(1).join(" ") || "Organizer",
      email: organizerEmail,
      password: tempPassword,
      role: "organizer",
      organizerName: name,
      category,
      description,
      contactEmail: organizerEmail,
    });

    console.log(
      `[ADMIN] Created organizer ${organizer.organizerName} (${organizerEmail}) with id ${organizer._id}`,
    );

    res.status(201).json({
      message: "Organizer created successfully",
      organizerName: organizer.organizerName,
      email: organizerEmail,
      tempPassword: tempPassword,
      _id: organizer._id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all organizers
// @route   GET /api/admin/organizers
// @access  Private (Admin)
export const getAllOrganizers = async (req, res) => {
  try {
    const organizers = await User.find({ role: "organizer" })
      .select("-password")
      .sort({ createdAt: -1 });

    console.log(`[ADMIN] Retrieved ${organizers.length} organizers`);

    res.json(organizers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all pending organizers
// @route   GET /api/admin/organizers/pending
// @access  Private (Admin)
export const getPendingOrganizers = async (req, res) => {
  try {
    const organizers = await User.find({ role: "organizer" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(organizers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve/Reject organizer
// @route   PUT /api/admin/organizers/:id/status
// @access  Private (Admin)
export const updateOrganizerStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'

    const organizer = await User.findOne({
      _id: req.params.id,
      role: "organizer",
    });

    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }

    // Store status in a custom field or handle as needed
    // For now, we'll just return success
    res.json({ message: `Organizer ${status} successfully`, organizer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Disable organizer (soft delete)
// @route   PUT /api/admin/organizers/:id/disable
// @access  Private (Admin)
export const disableOrganizer = async (req, res) => {
  try {
    const organizer = await User.findOne({
      _id: req.params.id,
      role: "organizer",
    });

    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }

    organizer.isActive = false;
    await organizer.save();

    res.json({
      message: "Organizer disabled successfully. They cannot log in anymore.",
      organizer,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Enable organizer
// @route   PUT /api/admin/organizers/:id/enable
// @access  Private (Admin)
export const enableOrganizer = async (req, res) => {
  try {
    const organizer = await User.findOne({
      _id: req.params.id,
      role: "organizer",
    });

    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }

    organizer.isActive = true;
    await organizer.save();

    res.json({
      message: "Organizer enabled successfully. They can now log in.",
      organizer,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete organizer permanently
// @route   DELETE /api/admin/organizers/:id
// @access  Private (Admin)
export const deleteOrganizer = async (req, res) => {
  try {
    const organizer = await User.findOne({
      _id: req.params.id,
      role: "organizer",
    });

    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }

    // Delete all events created by this organizer
    await Event.deleteMany({ organizer: req.params.id });

    // Delete the organizer permanently
    await organizer.deleteOne();

    res.json({ message: "Organizer permanently deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
export const getAllUsers = async (req, res) => {
  try {
    const { role, search } = req.query;

    let query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 });

    console.log(
      `[ADMIN] Retrieved ${users.length} users (role filter: ${role || "any"})`,
    );

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all events
// @route   GET /api/admin/events
// @access  Private (Admin)
export const getAllEvents = async (req, res) => {
  try {
    const { status, type } = req.query;

    let query = {};
    if (status) query.status = status;
    if (type) query.type = type;

    const events = await Event.find(query)
      .populate("organizer", "organizerName category")
      .sort({ createdAt: -1 });

    console.log(
      `[ADMIN] Retrieved ${events.length} events (status: ${status || "any"}, type: ${type || "any"})`,
    );

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update event status
// @route   PUT /api/admin/events/:id/status
// @access  Private (Admin)
export const updateEventStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    event.status = status;
    await event.save();

    res.json({ message: "Event status updated successfully", event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete event
// @route   DELETE /api/admin/events/:id
// @access  Private (Admin)
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Delete all registrations for this event
    await Registration.deleteMany({ event: req.params.id });

    await event.deleteOne();

    console.log(`[ADMIN] Deleted event ${req.params.id} and its registrations`);

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get platform statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
export const getPlatformStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalParticipants = await User.countDocuments({
      role: "participant",
    });
    const totalOrganizers = await User.countDocuments({ role: "organizer" });
    const totalEvents = await Event.countDocuments();
    const publishedEvents = await Event.countDocuments({ status: "published" });
    const totalRegistrations = await Registration.countDocuments();

    const revenueData = await Event.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalRevenue" },
        },
      },
    ]);

    const stats = {
      users: {
        total: totalUsers,
        participants: totalParticipants,
        organizers: totalOrganizers,
      },
      events: {
        total: totalEvents,
        published: publishedEvents,
      },
      registrations: totalRegistrations,
      revenue: revenueData[0]?.totalRevenue || 0,
    };

    console.log("[ADMIN] Computed platform stats", stats);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset user password
// @route   PUT /api/admin/users/:id/reset-password
// @access  Private (Admin)
export const resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = newPassword;
    await user.save();

    console.log(`[ADMIN] Password reset for user ${user._id} (${user.email})`);

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
