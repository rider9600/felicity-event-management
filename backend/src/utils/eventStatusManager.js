import Event from "../models/event.js";

// Update event statuses based on current date and time
export const updateEventStatuses = async () => {
  try {
    const now = new Date();

    // Move published events to ongoing if start date has passed
    await Event.updateMany(
      {
        status: "published",
        eventStartDate: { $lte: now },
      },
      {
        $set: { status: "ongoing" },
      },
    );

    // Move ongoing events to completed if end date has passed
    await Event.updateMany(
      {
        status: "ongoing",
        eventEndDate: { $lte: now },
      },
      {
        $set: { status: "completed" },
      },
    );

    // Close registration for events that have reached registration deadline
    await Event.updateMany(
      {
        status: { $in: ["published", "ongoing"] },
        registrationDeadline: { $lte: now },
      },
      {
        $set: { status: "closed" },
      },
    );

    console.log(`Event statuses updated at ${now}`);
    return true;
  } catch (error) {
    console.error("Error updating event statuses:", error);
    return false;
  }
};

// Get events by status with automatic status updates
export const getEventsByStatus = async (status) => {
  try {
    // First update statuses
    await updateEventStatuses();

    // Then fetch events by status
    const events = await Event.find({ status })
      .populate("organizerId", "firstname lastname organizerName")
      .populate("club", "name")
      .sort({ eventStartDate: 1 });

    return events;
  } catch (error) {
    console.error("Error fetching events by status:", error);
    return [];
  }
};

// Check if event can accept new registrations
export const canRegisterForEvent = async (eventId) => {
  try {
    const event = await Event.findById(eventId);
    if (!event) return { canRegister: false, reason: "Event not found" };

    const now = new Date();

    // Check if registration deadline has passed
    if (now > event.registrationDeadline) {
      return { canRegister: false, reason: "Registration deadline has passed" };
    }

    // Check if event has already started
    if (now > event.eventStartDate) {
      return { canRegister: false, reason: "Event has already started" };
    }

    // Check if registration limit is reached
    if (
      event.registrationLimit &&
      event.registrationCount >= event.registrationLimit
    ) {
      return { canRegister: false, reason: "Registration limit reached" };
    }

    // Check if event is published
    if (event.status !== "published") {
      return { canRegister: false, reason: "Event is not published" };
    }

    return { canRegister: true };
  } catch (error) {
    console.error("Error checking registration eligibility:", error);
    return { canRegister: false, reason: "Error checking eligibility" };
  }
};

// Start automatic status update scheduler (call every 5 minutes)
export const startEventStatusScheduler = () => {
  // Update immediately on startup
  updateEventStatuses();

  // Then update every 5 minutes (300000 ms)
  setInterval(() => {
    updateEventStatuses();
  }, 300000);

  console.log("Event status scheduler started");
};

export default {
  updateEventStatuses,
  getEventsByStatus,
  canRegisterForEvent,
  startEventStatusScheduler,
};
