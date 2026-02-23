import Ticket from "../models/ticket.js";

// Get tickets for a participant
export const getMyTickets = async (req, res) => {
  try {
    const participantId = req.user._id;
    const tickets = await Ticket.find({ participantId })
      .populate("eventId", "eventName eventType eventStartDate eventEndDate eventDescription venue registrationFee")
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get ticket by ID
export const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findOne({ ticketId: id });
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
