import Event from "../models/Event.js";
import Registration from "../models/Registration.js";

// @desc    Get all events (with filters)
// @route   GET /api/events
// @access  Public
export const getEvents = async (req, res) => {
  try {
    const {
      type,
      eligibility,
      startDate,
      endDate,
      search,
      status = "published",
    } = req.query;

    let query = { status };

    // Apply filters
    if (type) query.type = type;
    if (eligibility) query.eligibility = eligibility;

    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    const events = await Event.find(query)
      .populate("organizer", "organizerName category")
      .sort({ startDate: 1 });

    console.log(
      `[EVENTS] Retrieved ${events.length} events (status: ${status}, type: ${type || "any"}, eligibility: ${eligibility || "any"})`,
    );

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get event by ID
// @route   GET /api/events/:id
// @access  Public
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate(
      "organizer",
      "organizerName category description contactEmail",
    );

    if (event) {
      console.log(`[EVENTS] Retrieved event ${event._id} (${event.name})`);
      res.json(event);
    } else {
      res.status(404).json({ message: "Event not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get trending events (top 5 in last 24h)
// @route   GET /api/events/trending
// @access  Public
export const getTrendingEvents = async (req, res) => {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const events = await Event.find({
      status: "published",
      createdAt: { $gte: last24Hours },
    })
      .populate("organizer", "organizerName category")
      .sort({ registeredCount: -1 })
      .limit(5);

    console.log(
      `[EVENTS] Retrieved ${events.length} trending events from last 24h`,
    );

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register for event
// @route   POST /api/events/:id/register
// @access  Private (Participant)
export const registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if already registered
    const existingRegistration = await Registration.findOne({
      event: req.params.id,
      participant: req.user._id,
    });

    if (existingRegistration) {
      return res
        .status(400)
        .json({ message: "Already registered for this event" });
    }

    // Check deadline
    if (new Date() > new Date(event.registrationDeadline)) {
      return res
        .status(400)
        .json({ message: "Registration deadline has passed" });
    }

    // Check limit
    if (
      event.registrationLimit &&
      event.registeredCount >= event.registrationLimit
    ) {
      return res.status(400).json({ message: "Registration limit reached" });
    }

    // Check eligibility
    if (event.eligibility === "iiit" && req.user.participantType !== "iiit") {
      return res
        .status(403)
        .json({ message: "This event is only for IIIT students" });
    }

    // Create registration
    const registration = await Registration.create({
      event: req.params.id,
      participant: req.user._id,
      formData: req.body,
      teamName: req.body.teamName,
    });

    // Update event statistics
    event.registeredCount += 1;
    event.totalRevenue += event.registrationFee;
    await event.save();

    await registration.populate("event", "name startDate endDate");

    console.log(
      `[EVENTS] Registered user ${req.user._id} for event ${event._id} (registration ${registration._id})`,
    );

    res.status(201).json(registration);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Purchase merchandise
// @route   POST /api/events/:id/purchase
// @access  Private (Participant)
export const purchaseMerchandise = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event || event.type !== "merchandise") {
      return res.status(404).json({ message: "Merchandise event not found" });
    }

    // Check stock
    if (event.itemDetails?.stock <= 0) {
      return res.status(400).json({ message: "Out of stock" });
    }

    // Create registration (purchase)
    const registration = await Registration.create({
      event: req.params.id,
      participant: req.user._id,
      formData: req.body,
    });

    // Update event statistics and stock
    event.registeredCount += 1;
    event.totalRevenue += event.registrationFee;
    if (event.itemDetails) {
      event.itemDetails.stock -= 1;
    }
    await event.save();

    console.log(
      `[EVENTS] Merchandise purchase by user ${req.user._id} for event ${event._id} (registration ${registration._id})`,
    );

    res.status(201).json(registration);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get ticket by ID
// @route   GET /api/tickets/:ticketId
// @access  Private
export const getTicket = async (req, res) => {
  try {
    const registration = await Registration.findOne({
      ticketId: req.params.ticketId,
    })
      .populate("event", "name startDate endDate registrationFee")
      .populate("participant", "firstName lastName email");

    if (registration) {
      console.log(
        `[EVENTS] Retrieved ticket ${req.params.ticketId} (registration ${registration._id})`,
      );
      res.json(registration);
    } else {
      res.status(404).json({ message: "Ticket not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
