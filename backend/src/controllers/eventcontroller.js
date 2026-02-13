// Admin: update any event
export const adminUpdateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    // Allow admin to update any field
    Object.assign(event, updates);
    await event.save();
    res.json({ message: "Event updated by admin", event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: delete any event
export const adminDeleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    await Event.findByIdAndDelete(id);
    res.json({ message: "Event deleted by admin" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
import Event from "../models/event.js";
import Ticket from "../models/ticket.js";
import user from "../models/user.js";
import { postToDiscord } from "../utils/discord.js";

// Create a new event
export const createEvent = async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    // Post to Discord if organizer has webhook configured
    const organizer = await user.findById(event.organizerId);
    if (organizer && organizer.discordWebhook) {
      await postToDiscord(organizer.discordWebhook, event);
    }
    res.status(201).json({ message: "Event created", event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all events
export const getEvents = async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get event by ID
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    res.json({ message: "Event updated", event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete event
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    await Event.findByIdAndDelete(id);
    res.json({ message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Search events with filters
export const searchEvents = async (req, res) => {
  try {
    const { query, eventType, eligibility, startDate, endDate, followedClubs } =
      req.query;
    let filter = { status: "published" };
    // Fuzzy/partial search on eventName
    if (query) {
      filter.eventName = { $regex: query, $options: "i" };
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
    const events = await Event.find(filter);
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    const events = await Event.find({ _id: { $in: eventIds } });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get events by organizer ID
export const getEventsByOrganizer = async (req, res) => {
  try {
    const { organizerId } = req.params;
    const events = await Event.find({ organizerId });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
