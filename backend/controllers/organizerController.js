import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import axios from "axios";

// @desc    Get organizer's events
// @route   GET /api/organizer/events
// @access  Private (Organizer)
export const getOrganizerEvents = async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user._id }).sort({
      createdAt: -1,
    });

    console.log(
      `[ORGANIZER] Retrieved ${events.length} events for organizer ${req.user._id}`,
    );

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new event
// @route   POST /api/organizer/events
// @access  Private (Organizer)
export const createEvent = async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      eligibility,
      startDate,
      endDate,
      registrationDeadline,
      registrationLimit,
      registrationFee,
      tags,
      customForm,
      itemDetails,
    } = req.body;

    // Allow frontend to specify initial status (published or draft)
    const initialStatus = req.body.status || "draft";

    // Create event
    const event = await Event.create({
      organizer: req.user._id,
      name,
      description,
      type,
      eligibility,
      startDate,
      endDate,
      registrationDeadline,
      registrationLimit,
      registrationFee,
      tags,
      customForm,
      itemDetails,
      status: initialStatus,
    });

    console.log(
      `[ORGANIZER] Created event ${event._id} (${event.name}) for organizer ${req.user._id}`,
    );

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update event
// @route   PUT /api/organizer/events/:id
// @access  Private (Organizer)
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      organizer: req.user._id,
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Update fields
    Object.keys(req.body).forEach((key) => {
      if (req.body[key] !== undefined) {
        event[key] = req.body[key];
      }
    });

    const updatedEvent = await event.save();
    console.log(
      `[ORGANIZER] Updated event ${updatedEvent._id} for organizer ${req.user._id}`,
    );
    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete event
// @route   DELETE /api/organizer/events/:id
// @access  Private (Organizer)
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      organizer: req.user._id,
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    await event.deleteOne();
    console.log(
      `[ORGANIZER] Deleted event ${req.params.id} for organizer ${req.user._id}`,
    );
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Publish event
// @route   PUT /api/organizer/events/:id/publish
// @access  Private (Organizer)
export const publishEvent = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      organizer: req.user._id,
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    event.status = "published";
    await event.save();

    console.log(
      `[ORGANIZER] Published event ${event._id} for organizer ${req.user._id}`,
    );

    res.json({ message: "Event published successfully", event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get event participants
// @route   GET /api/organizer/events/:id/participants
// @access  Private (Organizer)
export const getEventParticipants = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      organizer: req.user._id,
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const registrations = await Registration.find({ event: req.params.id })
      .populate(
        "participant",
        "firstName lastName email participantType collegeOrg contactNumber",
      )
      .sort({ createdAt: -1 });

    console.log(
      `[ORGANIZER] Retrieved ${registrations.length} participants for event ${req.params.id}`,
    );

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update registration status
// @route   PUT /api/organizer/registrations/:id
// @access  Private (Organizer)
export const updateRegistrationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const registration = await Registration.findById(req.params.id).populate(
      "event",
    );

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    // Check if organizer owns this event
    if (registration.event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    registration.status = status;
    await registration.save();

    console.log(
      `[ORGANIZER] Updated registration ${registration._id} status to ${status}`,
    );

    res.json({ message: "Registration status updated", registration });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark attendance
// @route   POST /api/organizer/events/:id/attendance/:ticketId
// @access  Private (Organizer)
export const markAttendance = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      organizer: req.user._id,
    });

    if (!event) {
      return res
        .status(404)
        .json({ message: "Event not found or not authorized" });
    }

    const registration = await Registration.findOne({
      ticketId: req.params.ticketId,
      event: req.params.id,
    });

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    if (registration.attended) {
      return res.status(400).json({ message: "Attendance already marked" });
    }

    registration.attended = true;
    registration.attendedAt = new Date();
    await registration.save();

    // Update event attendance count
    event.attendanceCount += 1;
    await event.save();

    console.log(
      `[ORGANIZER] Marked attendance for ticket ${req.params.ticketId} in event ${req.params.id}`,
    );

    res.json({ message: "Attendance marked successfully", registration });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get analytics for event
// @route   GET /api/organizer/events/:id/analytics
// @access  Private (Organizer)
export const getEventAnalytics = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      organizer: req.user._id,
    }).populate("organizer", "organizerName");

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const registrations = await Registration.find({ event: req.params.id });

    // Calculate analytics
    const analytics = {
      eventName: event.name,
      totalRegistrations: event.registeredCount,
      attendanceCount: event.attendanceCount,
      totalRevenue: event.totalRevenue,
      cancelledCount: registrations.filter((r) => r.status === "cancelled")
        .length,
      completedCount: registrations.filter((r) => r.status === "completed")
        .length,
      attendanceRate:
        event.registeredCount > 0
          ? ((event.attendanceCount / event.registeredCount) * 100).toFixed(2)
          : 0,
      participantTypes: {
        iiit: registrations.filter(
          (r) => r.participant?.participantType === "iiit",
        ).length,
        nonIiit: registrations.filter(
          (r) => r.participant?.participantType === "non-iiit",
        ).length,
      },
    };

    console.log(
      `[ORGANIZER] Computed analytics for event ${event._id}: registrations=${analytics.totalRegistrations}, attendance=${analytics.attendanceCount}`,
    );

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send Discord notification
// @route   POST /api/organizer/events/:id/notify
// @access  Private (Organizer)
export const sendDiscordNotification = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      organizer: req.user._id,
    }).populate("organizer", "discordWebhook");

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const webhookUrl = event.organizer.discordWebhook;
    if (!webhookUrl) {
      return res
        .status(400)
        .json({ message: "Discord webhook not configured" });
    }

    const { message } = req.body;

    // Send to Discord
    await axios.post(webhookUrl, {
      content: message || `New update for event: ${event.name}`,
      embeds: [
        {
          title: event.name,
          description: event.description,
          fields: [
            {
              name: "Start Date",
              value: new Date(event.startDate).toLocaleDateString(),
            },
            { name: "Registrations", value: event.registeredCount.toString() },
          ],
        },
      ],
    });

    console.log(`[ORGANIZER] Sent Discord notification for event ${event._id}`);

    res.json({ message: "Discord notification sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
