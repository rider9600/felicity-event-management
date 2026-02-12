import User from "../models/User.js";
import Registration from "../models/Registration.js";
import Event from "../models/Event.js";

// @desc    Get participant registrations
// @route   GET /api/participant/registrations
// @access  Private (Participant)
export const getMyRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({
      participant: req.user._id,
    })
      .populate("event", "name startDate endDate registrationFee type")
      .sort({ createdAt: -1 });

    console.log(
      `[PARTICIPANT] Retrieved ${registrations.length} registrations for user ${req.user._id}`,
    );

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel registration
// @route   PUT /api/participant/registrations/:id/cancel
// @access  Private (Participant)
export const cancelRegistration = async (req, res) => {
  try {
    const registration = await Registration.findOne({
      _id: req.params.id,
      participant: req.user._id,
    });

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    if (registration.status === "cancelled") {
      return res
        .status(400)
        .json({ message: "Registration already cancelled" });
    }

    // Update registration status
    registration.status = "cancelled";
    await registration.save();

    // Update event statistics
    const event = await Event.findById(registration.event);
    if (event) {
      event.registeredCount = Math.max(0, event.registeredCount - 1);
      event.totalRevenue = Math.max(
        0,
        event.totalRevenue - event.registrationFee,
      );
      await event.save();
    }

    console.log(
      `[PARTICIPANT] Cancelled registration ${registration._id} for event ${registration.event}`,
    );

    res.json({ message: "Registration cancelled successfully", registration });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get list of organizers
// @route   GET /api/participant/organizers
// @access  Private (Participant)
export const getOrganizers = async (req, res) => {
  try {
    const { category, search } = req.query;

    let query = { role: "organizer" };

    if (category) query.category = category;
    if (search) {
      query.organizerName = { $regex: search, $options: "i" };
    }

    const organizers = await User.find(query).select(
      "organizerName category description contactEmail",
    );

    console.log(
      `[PARTICIPANT] Retrieved ${organizers.length} organizers (category: ${category || "any"}, search: ${search || "none"})`,
    );

    res.json(organizers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get organizers followed by current participant
// @route   GET /api/participant/followed-organizers
// @access  Private (Participant)
export const getFollowedOrganizers = async (req, res) => {
  try {
    const participant = await User.findById(req.user._id).populate(
      "followedOrganizers",
      "organizerName category description contactEmail",
    );

    if (!participant) {
      return res.status(404).json({ message: "User not found" });
    }

    const followed = participant.followedOrganizers || [];

    console.log(
      `[PARTICIPANT] Retrieved ${followed.length} followed organizers for user ${req.user._id}`,
    );

    res.json(followed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Follow organizer
// @route   POST /api/participant/follow/:organizerId
// @access  Private (Participant)
export const followOrganizer = async (req, res) => {
  try {
    const participant = await User.findById(req.user._id);
    const organizer = await User.findOne({
      _id: req.params.organizerId,
      role: "organizer",
    });

    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }

    if (participant.followedOrganizers.includes(req.params.organizerId)) {
      return res
        .status(400)
        .json({ message: "Already following this organizer" });
    }

    participant.followedOrganizers.push(req.params.organizerId);
    await participant.save();

    console.log(
      `[PARTICIPANT] User ${req.user._id} followed organizer ${req.params.organizerId}`,
    );

    res.json({
      message: "Successfully followed organizer",
      followedOrganizers: participant.followedOrganizers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Unfollow organizer
// @route   DELETE /api/participant/follow/:organizerId
// @access  Private (Participant)
export const unfollowOrganizer = async (req, res) => {
  try {
    const participant = await User.findById(req.user._id);

    if (!participant.followedOrganizers.includes(req.params.organizerId)) {
      return res.status(400).json({ message: "Not following this organizer" });
    }

    participant.followedOrganizers = participant.followedOrganizers.filter(
      (id) => id.toString() !== req.params.organizerId,
    );
    await participant.save();

    console.log(
      `[PARTICIPANT] User ${req.user._id} unfollowed organizer ${req.params.organizerId}`,
    );

    res.json({
      message: "Successfully unfollowed organizer",
      followedOrganizers: participant.followedOrganizers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update participant preferences
// @route   PUT /api/participant/preferences
// @access  Private (Participant)
export const updatePreferences = async (req, res) => {
  try {
    const participant = await User.findById(req.user._id);

    if (participant) {
      participant.interests = req.body.interests || participant.interests;
      participant.contactNumber =
        req.body.contactNumber || participant.contactNumber;

      const updatedParticipant = await participant.save();

      console.log(
        `[PARTICIPANT] Updated preferences for user ${req.user._id} (interests: ${updatedParticipant.interests?.length || 0})`,
      );

      res.json({
        message: "Preferences updated successfully",
        interests: updatedParticipant.interests,
        contactNumber: updatedParticipant.contactNumber,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get organizer detail with events
// @route   GET /api/participant/organizers/:id
// @access  Private (Participant)
export const getOrganizerDetail = async (req, res) => {
  try {
    const organizer = await User.findOne({
      _id: req.params.id,
      role: "organizer",
    }).select("organizerName category description contactEmail");

    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }

    const now = new Date();

    // Get upcoming events (published, start date in future)
    const upcomingEvents = await Event.find({
      organizer: req.params.id,
      status: "published",
      startDate: { $gte: now },
    })
      .select(
        "name description type startDate endDate registrationFee registrationLimit statistics",
      )
      .sort({ startDate: 1 });

    // Get past events (completed or end date passed)
    const pastEvents = await Event.find({
      organizer: req.params.id,
      $or: [
        { status: "completed" },
        { status: "published", endDate: { $lt: now } },
      ],
    })
      .select("name description type startDate endDate statistics")
      .sort({ startDate: -1 });

    // Check if participant is following this organizer
    const participant = await User.findById(req.user._id);
    const isFollowing = participant.followedOrganizers.includes(req.params.id);

    console.log(
      `[PARTICIPANT] Loaded organizer detail for ${req.params.id} (upcoming: ${upcomingEvents.length}, past: ${pastEvents.length}, following: ${isFollowing})`,
    );

    res.json({
      organizer,
      events: {
        upcoming: upcomingEvents,
        past: pastEvents,
      },
      isFollowing,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
