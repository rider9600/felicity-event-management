import Event from "../models/event.js";

// Publish event
export const publishEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event)
      return res.status(404).json({ success: false, error: "Event not found" });

    if (event.status !== "draft") {
      return res.status(400).json({
        success: false,
        error: "Only draft events can be published",
      });
    }

    event.status = "published";
    await event.save();

    res.json({
      success: true,
      message: "Event published",
      event,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Close event registration
export const closeEventRegistration = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event)
      return res.status(404).json({ success: false, error: "Event not found" });

    if (event.status === "completed") {
      return res.status(400).json({
        success: false,
        error: "Completed events cannot be closed",
      });
    }

    event.status = "closed";
    await event.save();

    res.json({
      success: true,
      message: "Event registration closed",
      event,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Mark event as completed
export const markEventCompleted = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event)
      return res.status(404).json({ success: false, error: "Event not found" });

    if (event.status !== "ongoing") {
      return res.status(400).json({
        success: false,
        error: "Only ongoing events can be completed",
      });
    }

    event.status = "completed";
    await event.save();

    res.json({
      success: true,
      message: "Event marked as completed",
      event,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};