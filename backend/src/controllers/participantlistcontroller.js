import Ticket from "../models/ticket.js";
import Event from "../models/event.js";
import user from "../models/user.js";
import { exportToCSV } from "../utils/csvexport.js";

// Get participants for an event (organizer view)
export const getEventParticipants = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { search } = req.query;
    let tickets = await Ticket.find({ eventId }).populate(
      "participantId",
      "firstname lastname email contactNumber college",
    );
    let participants = tickets.map((t) => ({
      ticketId: t.ticketId,
      name: `${t.participantId.firstname} ${t.participantId.lastname}`,
      email: t.participantId.email,
      contactNumber: t.participantId.contactNumber || "",
      college: t.participantId.college || "",
      registrationDate: t.createdAt,
      paymentStatus: t.paymentStatus,
      attendance: t.attendance,
      status: t.status,
    }));
    // Search filter
    if (search) {
      const s = search.toLowerCase();
      participants = participants.filter(
        (p) =>
          p.name.toLowerCase().includes(s) || p.email.toLowerCase().includes(s),
      );
    }
    res.json(participants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Export participants as CSV
export const exportParticipantsCSV = async (req, res) => {
  try {
    const { eventId } = req.params;
    const tickets = await Ticket.find({ eventId }).populate(
      "participantId",
      "firstname lastname email contactNumber college",
    );
    const participants = tickets.map((t) => ({
      ticketId: t.ticketId,
      name: `${t.participantId.firstname} ${t.participantId.lastname}`,
      email: t.participantId.email,
      contactNumber: t.participantId.contactNumber || "",
      college: t.participantId.college || "",
      registrationDate: t.createdAt,
      paymentStatus: t.paymentStatus,
      attendance: t.attendance ? "Yes" : "No",
      status: t.status,
    }));
    const fields = [
      "ticketId",
      "name",
      "email",
      "contactNumber",
      "college",
      "registrationDate",
      "paymentStatus",
      "attendance",
      "status",
    ];
    const csv = exportToCSV(participants, fields);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=participants_${eventId}.csv`,
    );
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mark attendance
export const markAttendance = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const ticket = await Ticket.findOneAndUpdate(
      { ticketId },
      { attendance: true },
      { new: true },
    );
    if (!ticket) return res.status(404).json({ msg: "Ticket not found" });
    res.json({ msg: "Attendance marked", ticket });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
