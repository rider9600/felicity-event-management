import user from "../models/user.js";
import Event from "../models/event.js";

// Admin analytics: clubs/organizers, events
export const getAdminAnalytics = async (req, res) => {
  try {
    const organizers = await user.countDocuments({ role: "organizer" });
    const events = await Event.countDocuments();
    res.json({ organizers, events });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
