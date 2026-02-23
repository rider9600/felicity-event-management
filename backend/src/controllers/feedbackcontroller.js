import Feedback from "../models/feedback.js";
import Ticket from "../models/ticket.js";
import Event from "../models/event.js";

// Submit anonymous feedback (participant only, after attendance)
export const submitFeedback = async (req, res) => {
  try {
    const participantId = req.user._id;
    const { eventId, rating, comment } = req.body;

    // Validate event exists
    const event = await Event.findById(eventId);
    if (!event)
      return res.status(404).json({ success: false, error: "Event not found" });

    // Check participant attended the event
    const ticket = await Ticket.findOne({
      eventId,
      participantId,
      attendance: true,
    });
    if (!ticket) {
      return res
        .status(400)
        .json({
          success: false,
          error: "You must have attended the event to submit feedback",
        });
    }

    // Check if already submitted (one per participant per event)
    const existingFeedback = await Feedback.findOne({ eventId, participantId });
    if (existingFeedback) {
      return res
        .status(400)
        .json({
          success: false,
          error: "You have already submitted feedback for this event",
        });
    }

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ success: false, error: "Rating must be between 1 and 5" });
    }

    const feedback = new Feedback({
      eventId,
      participantId,
      rating,
      comment: comment || "",
    });

    await feedback.save();

    // Return feedback without participantId
    const { participantId: _, ...safeFeedback } = feedback.toObject();
    res.status(201).json({ success: true, feedback: safeFeedback });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get aggregated feedback for an event (organizer/admin only)
export const getEventFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);

    if (!event)
      return res.status(404).json({ success: false, error: "Event not found" });

    // Organizer ownership check
    if (
      req.user?.role === "organizer" &&
      String(event.organizerId) !== String(req.user._id)
    ) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    // Get all feedback (exclude participantId for anonymity)
    const allFeedback = await Feedback.find({ eventId }).select(
      "-participantId",
    );

    // Calculate aggregate stats
    const stats = {
      totalFeedback: allFeedback.length,
      averageRating:
        allFeedback.length > 0
          ? (
              allFeedback.reduce((sum, f) => sum + f.rating, 0) /
              allFeedback.length
            ).toFixed(2)
          : 0,
      ratingDistribution: {
        5: allFeedback.filter((f) => f.rating === 5).length,
        4: allFeedback.filter((f) => f.rating === 4).length,
        3: allFeedback.filter((f) => f.rating === 3).length,
        2: allFeedback.filter((f) => f.rating === 2).length,
        1: allFeedback.filter((f) => f.rating === 1).length,
      },
    };

    res.json({
      success: true,
      eventId,
      event: event.eventName,
      stats,
      feedback: allFeedback,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get participant's own feedback submissions (with participantId hidden from others)
export const getMyFeedback = async (req, res) => {
  try {
    const participantId = req.user._id;
    const feedback = await Feedback.find({ participantId }).populate(
      "eventId",
      "eventName",
    );

    res.json({ success: true, feedback });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
