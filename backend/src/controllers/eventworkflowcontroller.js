import Event from "../models/event.js";

// Publish event
export const publishEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findByIdAndUpdate(
      id,
      { status: "published" },
      { new: true },
    );
    if (!event) return res.status(404).json({ msg: "Event not found" });
    res.json({ msg: "Event published", event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Close event registration
export const closeEventRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findByIdAndUpdate(
      id,
      { status: "closed" },
      { new: true },
    );
    if (!event) return res.status(404).json({ msg: "Event not found" });
    res.json({ msg: "Event registration closed", event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mark event as completed
export const markEventCompleted = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findByIdAndUpdate(
      id,
      { status: "completed" },
      { new: true },
    );
    if (!event) return res.status(404).json({ msg: "Event not found" });
    res.json({ msg: "Event marked as completed", event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
