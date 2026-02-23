import Event from "../models/event.js";
import Ticket from "../models/ticket.js";
import user from "../models/user.js";
import { postToDiscord } from "../utils/discord.js"; // Admin: update any event
const isRegistrationOpen = (event) => {
  const now = new Date();
  if (event.status !== "published") return false;
  if (event.registrationDeadline && event.registrationDeadline < now)
    return false;
  if (
    event.registrationLimit &&
    event.registrationCount >= event.registrationLimit
  )
    return false;
  return true;
};
export const adminUpdateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    // Allow admin to update any field
    const allowedFields = [
      "eventName",
      "eventDescription",
      "eligibility",
      "venue",
      "eventTags",
      "registrationLimit",
      "registrationFee",
      "registrationDeadline",
      "eventStartDate",
      "eventEndDate",
      "status",
    ];

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        if (
          ["registrationDeadline", "eventStartDate", "eventEndDate"].includes(
            field,
          )
        ) {
          event[field] = new Date(updates[field]);
        } else {
          event[field] = updates[field];
        }
      }
    });
    await event.save();
    res.json({
      success: true,
      message: "Event updated by admin",
      event,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// Admin: delete any event
export const adminDeleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Event.findByIdAndDelete(id);
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }
    res.json({
      success: true,
      message: "Event deleted by admin",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

export const createEvent = async (req, res) => {
  try {
    console.log("[createEvent] Starting event creation");
    console.log("[createEvent] User:", req.user?._id);
    console.log("[createEvent] Payload from request:", req.body);

    const payload = {
      ...req.body,
      organizerId: req.user._id,
      eventStartDate: new Date(req.body.eventStartDate),
      eventEndDate: new Date(req.body.eventEndDate),
      registrationDeadline: new Date(req.body.registrationDeadline),
    };

    console.log("[createEvent] Processed payload:", payload);

    if (payload.eventType === "merchandise") {
      if (!payload.merchandise?.items?.length) {
        console.log("[createEvent] Merchandise event but no items");
        return res.status(400).json({
          success: false,
          error: "Merchandise items required for merchandise events",
        });
      }
    }

    // Validate required fields
    if (!payload.eventName || !payload.eventDescription) {
      console.log("[createEvent] Missing required fields");
      return res.status(400).json({
        success: false,
        error: "Event name and description are required",
      });
    }

    console.log("[createEvent] Creating Event model instance");
    const event = new Event(payload);

    console.log("[createEvent] Calling save()");
    const savedEvent = await event.save();

    console.log("[createEvent] Event saved successfully:", savedEvent._id);

    // Post to Discord (non-blocking)
    const organizer = await user.findById(savedEvent.organizerId);
    if (organizer?.discordWebhook) {
      console.log("[createEvent] Posting to Discord");
      postToDiscord(organizer.discordWebhook, savedEvent).catch((err) => {
        console.error("[createEvent] Discord webhook error:", err);
      });
    }

    console.log("[createEvent] Sending success response");
    res.status(201).json({
      success: true,
      event: savedEvent,
    });
  } catch (err) {
    console.error("[createEvent] ERROR:", err);
    console.error("[createEvent] Error message:", err.message);
    console.error("[createEvent] Error stack:", err.stack);
    res.status(500).json({
      success: false,
      error: err.message || "Failed to create event",
    });
  }
};

// Get all events
export const getEvents = async (req, res) => {
  try {
    const events = await Event.find();

    res.json({
      success: true,
      events,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// Get event by ID
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id).populate(
      "organizerId",
      "firstname lastname email organization",
    );
    if (!event) return res.status(404).json({ message: "Event not found" });
    const now = new Date();
    const registrationCount = await Ticket.countDocuments({ eventId: id });

    // Compute status based on dates
    let computedStatus = event.status;
    if (event.status === "published" && event.eventStartDate <= now) {
      computedStatus = "ongoing";
    }

    if (
      (event.status === "published" || event.status === "ongoing") &&
      event.eventEndDate <= now
    ) {
      computedStatus = "completed";
    }

    // Check blocking conditions for registration
    const deadlinePassed =
      event.registrationDeadline && now > event.registrationDeadline;
    const registrationLimitExhausted =
      event.registrationLimit && registrationCount >= event.registrationLimit;

    let outOfStock = false;
    if (event.eventType === "merchandise" && event.merchandise?.items) {
      outOfStock = event.merchandise.items.every((item) => item.stock <= 0);
    }

    res.json({
      success: true,
      event: {
        ...event.toObject(),
        status: computedStatus,
        registrationCount,
      },
      canRegister: isRegistrationOpen(event),
      blocking: {
        deadlinePassed,
        registrationLimitExhausted,
        outOfStock,
        reason: deadlinePassed
          ? "Registration deadline has passed"
          : registrationLimitExhausted
            ? "Registration limit has been reached"
            : outOfStock
              ? "All items are out of stock"
              : null,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// Update event
// Enforce event editing rules by status
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    // Editing rules
    if (updates.registrationDeadline)
      updates.registrationDeadline = new Date(updates.registrationDeadline);

    if (updates.eventStartDate)
      updates.eventStartDate = new Date(updates.eventStartDate);

    if (updates.eventEndDate)
      updates.eventEndDate = new Date(updates.eventEndDate);
    if (event.status === "draft") {
      // Free edits
      Object.assign(event, updates);
    } else if (event.status === "published") {
      // Only allow description, deadline, limit, status
      if (updates.eventDescription !== undefined)
        event.eventDescription = updates.eventDescription;
      if (updates.registrationDeadline !== undefined)
        event.registrationDeadline = updates.registrationDeadline;
      if (updates.registrationLimit !== undefined)
        event.registrationLimit = updates.registrationLimit;
      if (updates.status !== undefined) event.status = updates.status;
    } else if (event.status === "ongoing" || event.status === "completed") {
      // Only allow status change
      if (updates.status !== undefined) event.status = updates.status;
    } else if (event.status === "closed") {
      // No edits allowed
      return res
        .status(403)
        .json({ message: "No edits allowed for closed events" });
    }
    await event.save();
    res.json({
      success: true,
      event,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// Delete event
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    await Event.findByIdAndDelete(id);
    res.json({
      success: true,
      message: "Event deleted",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// Search events with filters - supports fuzzy search on event & organizer names
export const searchEvents = async (req, res) => {
  try {
    const { query, eventType, eligibility, startDate, endDate, followedClubs } =
      req.query;
    let filter = { status: "published" };

    // Fuzzy/partial search on eventName AND description
    if (query) {
      filter.$or = [
        { eventName: { $regex: query, $options: "i" } },
        { eventDescription: { $regex: query, $options: "i" } },
      ];
    }

    if (eventType) {
      filter.eventType = eventType;
    }

    if (eligibility) {
      filter.eligibility = eligibility;
    }

    if (startDate || endDate) {
      filter.eventStartDate = {};
      if (startDate) filter.eventStartDate.$gte = new Date(startDate);
      if (endDate) filter.eventStartDate.$lte = new Date(endDate);
    }

    if (followedClubs) {
      const clubIds = followedClubs.split(",");
      filter.organizerId = { $in: clubIds };
    }

    let events = await Event.find(filter).populate(
      "organizerId",
      "firstname lastname email organization",
    );

    // Filter by organizer name if query is provided (fuzzy match)
    if (query) {
      events = events.filter((event) => {
        const organizerName =
          `${event.organizerId?.firstname || ""} ${event.organizerId?.lastname || ""}`.toLowerCase();
        return organizerName.includes(query.toLowerCase());
      });
    }

    res.json({
      success: true,
      events,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// Trending events (top 5 by registrations in last 24h)
export const getTrendingEvents = async (req, res) => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const trending = await Ticket.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: "$eventId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const eventIds = trending.map((t) => t._id);
    const events = await Event.find({
      _id: { $in: eventIds },
      status: "published",
    }).populate("organizerId", "firstname lastname email organization");

    // Sort by trending order
    const trendingMap = Object.fromEntries(
      trending.map((t, idx) => [t._id.toString(), idx]),
    );
    events.sort((a, b) => {
      return trendingMap[a._id.toString()] - trendingMap[b._id.toString()];
    });

    res.json({
      success: true,
      events,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// Get events by organizer ID
export const getEventsByOrganizer = async (req, res) => {
  try {
    const { organizerId } = req.params;
    const events = await Event.find({ organizerId }).populate(
      "organizerId",
      "organizerName email",
    );
    res.json({
      success: true,
      events,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// Get events for the authenticated user (organizer)
export const getMyEvents = async (req, res) => {
  try {
    const organizerId = req.user && req.user._id;
    if (!organizerId)
      return res.status(401).json({ success: false, error: "Unauthorized" });

    const events = await Event.find({ organizerId }).populate(
      "organizerId",
      "firstname lastname email organization",
    );

    // Return data in `data` field to match some frontend expectations
    return res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Organizer-level analytics (completed events)
export const getOrganizerAnalytics = async (req, res) => {
  try {
    const organizerId = req.user && req.user._id;
    if (!organizerId)
      return res.status(401).json({ success: false, error: "Unauthorized" });

    const completedEvents = await Event.find({
      organizerId,
      status: "completed",
    });

    const perEvent = [];
    let totals = { registrations: 0, sales: 0, revenue: 0, attendance: 0 };

    for (const ev of completedEvents) {
      const tickets = await Ticket.find({ eventId: ev._id }).lean();
      const registrations = tickets.length;
      const sales = tickets.filter((t) => t.paymentStatus === "paid").length;
      const revenue = tickets.reduce((sum, t) => {
        const amt =
          (t.purchaseDetails &&
            (t.purchaseDetails.amount || t.purchaseDetails.price)) ||
          ev.registrationFee ||
          0;
        return sum + (t.paymentStatus === "paid" ? Number(amt) : 0);
      }, 0);
      const attendance = tickets.filter((t) => t.attendance).length;

      totals.registrations += registrations;
      totals.sales += sales;
      totals.revenue += revenue;
      totals.attendance += attendance;

      perEvent.push({
        eventId: ev._id,
        eventName: ev.eventName,
        registrations,
        sales,
        revenue,
        attendance,
      });
    }

    res.json({ success: true, totals, events: perEvent });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Event-level analytics
export const getEventAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event)
      return res.status(404).json({ success: false, error: "Event not found" });

    // Ownership check for organizers
    if (
      req.user?.role === "organizer" &&
      String(event.organizerId) !== String(req.user._id)
    ) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const tickets = await Ticket.find({ eventId: id })
      .populate("participantId", "firstname lastname email")
      .lean();

    const registrations = tickets.length;
    const sales = tickets.filter((t) => t.paymentStatus === "paid").length;
    const revenue = tickets.reduce((sum, t) => {
      const amt =
        (t.purchaseDetails &&
          (t.purchaseDetails.amount || t.purchaseDetails.price)) ||
        event.registrationFee ||
        0;
      return sum + (t.paymentStatus === "paid" ? Number(amt) : 0);
    }, 0);
    const attendance = tickets.filter((t) => t.attendance).length;

    // Team completion (if tickets include formData.team)
    const teams = {};
    tickets.forEach((t) => {
      const teamId = t.formData && (t.formData.team || t.formData.teamId);
      if (teamId) {
        teams[teamId] = teams[teamId] || { members: 0, attended: 0 };
        teams[teamId].members += 1;
        if (t.attendance) teams[teamId].attended += 1;
      }
    });

    const teamStats = Object.keys(teams).map((tid) => ({
      teamId: tid,
      members: teams[tid].members,
      attended: teams[tid].attended,
      completed: teams[tid].members === teams[tid].attended,
    }));

    res.json({
      success: true,
      data: {
        eventId: id,
        eventName: event.eventName,
        registrations,
        sales,
        revenue,
        attendance,
        teamStats,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Participants list for an event
export const getEventParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event)
      return res.status(404).json({ success: false, error: "Event not found" });

    // Only organizer (owner) or admin can access
    if (
      req.user?.role === "organizer" &&
      String(event.organizerId) !== String(req.user._id)
    ) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const tickets = await Ticket.find({ eventId: id })
      .populate("participantId", "firstname lastname email")
      .lean();

    const participants = tickets.map((t) => ({
      ticketId: t.ticketId,
      _ticketMongoId: t._id,
      name: t.participantId
        ? `${t.participantId.firstname || ""} ${t.participantId.lastname || ""}`.trim()
        : "",
      email: t.participantId?.email || "",
      registeredAt: t.createdAt,
      paymentStatus: t.paymentStatus,
      registrationStatus: t.registrationStatus || "pending",
      paymentDetails: t.purchaseDetails || null,
      team:
        t.formData && (t.formData.team || t.formData.teamId)
          ? t.formData.team || t.formData.teamId
          : null,
      attendance: !!t.attendance,
      formData: t.formData || {},
    }));

    res.json({ success: true, data: participants });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Accept a registration — sets registrationStatus to 'accepted' and sends ticket email
export const acceptRegistration = async (req, res) => {
  try {
    const { id: eventId, ticketId } = req.params;
    const event = await Event.findById(eventId);
    if (!event)
      return res.status(404).json({ success: false, error: "Event not found" });

    if (
      req.user?.role === "organizer" &&
      String(event.organizerId) !== String(req.user._id)
    ) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const ticket = await Ticket.findOne({ ticketId, eventId }).populate(
      "participantId",
      "firstname lastname email",
    );
    if (!ticket)
      return res.status(404).json({ success: false, error: "Ticket not found" });

    if (ticket.registrationStatus === "accepted") {
      return res.status(400).json({ success: false, error: "Already accepted" });
    }

    ticket.registrationStatus = "accepted";
    await ticket.save();

    // Import email utility inline to avoid circular deps at top
    const { sendTicketEmail } = await import("../utils/email.js");
    const populatedEvent = await Event.findById(eventId).populate("organizerId");
    const participant = ticket.participantId;

    sendTicketEmail(
      participant.email,
      `Your Ticket for ${event.eventName}`,
      {
        ticketId: ticket.ticketId,
        eventName: event.eventName,
        eventType: event.eventType,
        eventDate: event.eventStartDate,
        eventEndDate: event.eventEndDate,
        venue: event.venue,
        organizerName:
          (populatedEvent.organizerId?.firstname || "") +
          " " +
          (populatedEvent.organizerId?.lastname || ""),
        organizerEmail: populatedEvent.organizerId?.email,
        status: "active",
        participantName:
          (participant.firstname || "") + " " + (participant.lastname || ""),
        participantEmail: participant.email,
      },
      ticket.qrCode,
    ).catch((err) => console.error("[Email] Accept ticket email failed:", err.message));

    res.json({ success: true, message: "Registration accepted and email sent." });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Reject a registration
export const rejectRegistration = async (req, res) => {
  try {
    const { id: eventId, ticketId } = req.params;
    const event = await Event.findById(eventId);
    if (!event)
      return res.status(404).json({ success: false, error: "Event not found" });

    if (
      req.user?.role === "organizer" &&
      String(event.organizerId) !== String(req.user._id)
    ) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const ticket = await Ticket.findOne({ ticketId, eventId });
    if (!ticket)
      return res.status(404).json({ success: false, error: "Ticket not found" });

    ticket.registrationStatus = "rejected";
    await ticket.save();

    res.json({ success: true, message: "Registration rejected." });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Mark attendance for a participant using their ticket number
export const markAttendance = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const { ticketNumber } = req.body;

    if (!ticketNumber) {
      return res.status(400).json({ success: false, error: "Ticket number required" });
    }

    const event = await Event.findById(eventId);
    if (!event)
      return res.status(404).json({ success: false, error: "Event not found" });

    if (
      req.user?.role === "organizer" &&
      String(event.organizerId) !== String(req.user._id)
    ) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const ticket = await Ticket.findOne({ ticketId: ticketNumber, eventId })
      .populate("participantId", "firstname lastname email");

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: "Ticket not found for this event. Check the ticket number.",
      });
    }

    if (ticket.registrationStatus !== "accepted") {
      return res.status(400).json({
        success: false,
        error: `Cannot mark attendance: registration is '${ticket.registrationStatus}'.`,
      });
    }

    if (ticket.attendance) {
      return res.status(400).json({
        success: false,
        error: "Attendance already marked for this ticket.",
      });
    }

    ticket.attendance = true;
    ticket.attendedAt = new Date();
    await ticket.save();

    const p = ticket.participantId;
    res.json({
      success: true,
      message: `Attendance marked for ${p?.firstname || ""} ${p?.lastname || ""} (${p?.email || ""})`,
      attendedAt: ticket.attendedAt,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Manual override attendance (bypass accepted-status check) with audit log
export const manualOverrideAttendance = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const { ticketNumber, reason } = req.body;

    if (!ticketNumber) {
      return res.status(400).json({ success: false, error: "Ticket number required" });
    }

    const event = await Event.findById(eventId);
    if (!event)
      return res.status(404).json({ success: false, error: "Event not found" });

    if (
      req.user?.role === "organizer" &&
      String(event.organizerId) !== String(req.user._id)
    ) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const ticket = await Ticket.findOne({ ticketId: ticketNumber, eventId })
      .populate("participantId", "firstname lastname email");

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: "Ticket not found for this event",
      });
    }

    const wasAlreadyAttended = ticket.attendance;
    ticket.attendance = true;
    ticket.attendedAt = ticket.attendedAt || new Date();
    ticket.auditLog = ticket.auditLog || [];
    ticket.auditLog.push({
      action: wasAlreadyAttended ? "manual_override_duplicate" : "manual_override",
      performedBy: req.user._id,
      reason: reason || "Manual override by organizer",
      timestamp: new Date(),
    });

    await ticket.save();

    const p = ticket.participantId;
    res.json({
      success: true,
      wasAlreadyAttended,
      message: `Manual override: attendance marked for ${p?.firstname || ""} ${p?.lastname || ""} (${p?.email || ""})`,
      attendedAt: ticket.attendedAt,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Export participants CSV
export const exportEventParticipantsCSV = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event)
      return res.status(404).json({ success: false, error: "Event not found" });

    if (
      req.user?.role === "organizer" &&
      String(event.organizerId) !== String(req.user._id)
    ) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const tickets = await Ticket.find({ eventId: id })
      .populate("participantId", "firstname lastname email")
      .lean();

    const rows = [];
    // Header
    rows.push(
      [
        "Ticket ID",
        "Name",
        "Email",
        "Registered At",
        "Payment Status",
        "Team",
        "Attendance",
      ].join(","),
    );

    tickets.forEach((t) => {
      const name = t.participantId
        ? `${t.participantId.firstname || ""} ${t.participantId.lastname || ""}`.trim()
        : "";
      const email = t.participantId?.email || "";
      const reg = t.createdAt ? new Date(t.createdAt).toISOString() : "";
      const team =
        t.formData && (t.formData.team || t.formData.teamId)
          ? t.formData.team || t.formData.teamId
          : "";
      const attendance = t.attendance ? "true" : "false";
      const payment = t.paymentStatus || "";

      // Escape fields containing commas/quotes
      const esc = (s) => {
        if (s === null || s === undefined) return "";
        const str = String(s);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      rows.push(
        [
          esc(t.ticketId),
          esc(name),
          esc(email),
          esc(reg),
          esc(payment),
          esc(team),
          esc(attendance),
        ].join(","),
      );
    });

    const csv = rows.join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="participants_${id}.csv"`,
    );
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// FORM BUILDER ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

// Update custom form for an event (only if form not locked)
export const updateEventForm = async (req, res) => {
  try {
    const { id } = req.params;
    const { formSchema } = req.body;

    const event = await Event.findById(id);
    if (!event)
      return res.status(404).json({ success: false, error: "Event not found" });

    // Organizer ownership check
    if (
      String(event.organizerId) !== String(req.user._id) &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    // Prevent edits if form is locked
    if (event.customFormLocked) {
      return res
        .status(400)
        .json({
          success: false,
          error: "Form is locked after first registration",
        });
    }

    event.customForm = formSchema;
    await event.save();

    res.json({ success: true, event });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get custom form for an event
export const getEventForm = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id).select(
      "customForm customFormLocked",
    );

    if (!event)
      return res.status(404).json({ success: false, error: "Event not found" });

    res.json({
      success: true,
      form: event.customForm,
      locked: event.customFormLocked,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ORGANIZER PROFILE ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

// Get organizer profile
export const getOrganizerProfile = async (req, res) => {
  try {
    const organizerId = req.user._id;
    const organizer = await user
      .findById(organizerId)
      .select(
        "firstname lastname organizerName category description contactEmail email followers",
      );

    if (!organizer || organizer.role !== "organizer") {
      return res
        .status(403)
        .json({ success: false, error: "Not an organizer" });
    }

    res.json({ success: true, profile: organizer });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update organizer profile (editable fields only)
export const updateOrganizerProfile = async (req, res) => {
  try {
    const organizerId = req.user._id;
    const {
      firstname,
      lastname,
      organizerName,
      category,
      description,
      contactEmail,
      contactNumber,
    } = req.body;

    const organizer = await user.findById(organizerId);
    if (!organizer || organizer.role !== "organizer") {
      return res
        .status(403)
        .json({ success: false, error: "Not an organizer" });
    }

    // Update allowed fields
    if (firstname !== undefined) organizer.firstname = firstname;
    if (lastname !== undefined) organizer.lastname = lastname;
    if (organizerName !== undefined) organizer.organizerName = organizerName;
    if (category !== undefined) organizer.category = category;
    if (description !== undefined) organizer.description = description;
    if (contactEmail !== undefined) organizer.contactEmail = contactEmail;
    if (contactNumber !== undefined) organizer.contactNumber = contactNumber;
    // Note: login email is NOT editable

    await organizer.save();

    res.json({ success: true, profile: organizer });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// CALENDAR ICS EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

// Generate .ics calendar file for an event
export const generateCalendarICS = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id).populate("organizerId", "organizerName firstname lastname email");
    if (!event)
      return res.status(404).json({ success: false, error: "Event not found" });

    const formatICSDate = (date) => {
      if (!date) return "";
      const d = new Date(date);
      return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    const escape = (str) =>
      (str || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

    const organizerName =
      event.organizerId?.organizerName ||
      `${event.organizerId?.firstname || ""} ${event.organizerId?.lastname || ""}`.trim() ||
      "Felicity";

    const uid = `${event._id}@felicity-platform`;
    const now = formatICSDate(new Date());
    const start = formatICSDate(event.eventStartDate);
    const end = formatICSDate(event.eventEndDate || event.eventStartDate);

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Felicity Platform//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${escape(event.eventName)}`,
      `DESCRIPTION:${escape(event.eventDescription)}`,
      `LOCATION:${escape(event.venue || "")}`,
      `ORGANIZER;CN=${escape(organizerName)}:MAILTO:${event.organizerId?.email || ""}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${event.eventName.replace(/\s+/g, "_")}.ics"`,
    );
    res.send(icsContent);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

