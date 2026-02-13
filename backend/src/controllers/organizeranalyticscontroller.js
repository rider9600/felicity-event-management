import Event from "../models/event.js";
import Ticket from "../models/ticket.js";
import user from "../models/user.js";

// Organizer analytics: registrations, sales, revenue, attendance
export const getOrganizerAnalytics = async (req, res) => {
  try {
    const organizerId = req.user._id;
    const events = await Event.find({ organizerId });
    let analytics = [];

    for (const event of events) {
      // Get comprehensive ticket data
      const tickets = await Ticket.find({ eventId: event._id });
      const registrations = tickets.length;
      const attendance = tickets.filter((t) => t.attendance).length;
      const completedTickets = tickets.filter(
        (t) => t.status === "completed",
      ).length;
      const cancelledTickets = tickets.filter(
        (t) => t.status === "cancelled",
      ).length;

      let sales = 0;
      let revenue = 0;

      if (event.eventType === "merchandise") {
        sales = tickets.filter((t) => t.paymentStatus === "paid").length;
        revenue = tickets.reduce((sum, ticket) => {
          return sum + (ticket.purchaseDetails?.price || 0);
        }, 0);
      } else {
        sales = registrations;
        revenue = registrations * (event.registrationFee || 0);
      }

      analytics.push({
        eventId: event._id,
        eventName: event.eventName,
        eventType: event.eventType,
        registrations,
        sales,
        revenue,
        attendance,
        attendanceRate:
          registrations > 0
            ? ((attendance / registrations) * 100).toFixed(2)
            : 0,
        completedTickets,
        cancelledTickets,
        status: event.status,
        eventDate: event.eventStartDate,
        registrationLimit: event.registrationLimit,
        utilizationRate: event.registrationLimit
          ? ((registrations / event.registrationLimit) * 100).toFixed(2)
          : 100,
      });
    }

    // Overall summary
    const summary = {
      totalEvents: events.length,
      totalRegistrations: analytics.reduce(
        (sum, a) => sum + a.registrations,
        0,
      ),
      totalRevenue: analytics.reduce((sum, a) => sum + a.revenue, 0),
      totalAttendance: analytics.reduce((sum, a) => sum + a.attendance, 0),
      averageAttendanceRate:
        analytics.length > 0
          ? (
              analytics.reduce(
                (sum, a) => sum + parseFloat(a.attendanceRate),
                0,
              ) / analytics.length
            ).toFixed(2)
          : 0,
    };

    res.json({ analytics, summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Export participant list as CSV
export const exportParticipantList = async (req, res) => {
  try {
    const { eventId } = req.params;
    const organizerId = req.user._id;

    // Verify organizer owns this event
    const event = await Event.findById(eventId);
    if (!event || event.organizerId.toString() !== organizerId.toString()) {
      return res.status(403).json({ msg: "Access denied" });
    }

    // Get all tickets with participant data
    const tickets = await Ticket.find({ eventId })
      .populate(
        "participantId",
        "firstname lastname email college contactNumber participantType",
      )
      .sort({ createdAt: 1 });

    // Generate CSV content
    let csvContent =
      "Ticket ID,Participant Name,Email,College,Contact,Type,Registration Date,Status,Attendance,Payment Status\n";

    tickets.forEach((ticket) => {
      const participant = ticket.participantId;
      csvContent += `"${ticket.ticketId}","${participant.firstname} ${participant.lastname}","${participant.email}","${participant.college || "N/A"}","${participant.contactNumber || "N/A"}","${participant.participantType}","${ticket.createdAt.toISOString().split("T")[0]}","${ticket.status}","${ticket.attendance ? "Yes" : "No"}","${ticket.paymentStatus}"\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${event.eventName}_participants.csv"`,
    );
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mark attendance for a participant
export const markAttendance = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { attended } = req.body;
    const organizerId = req.user._id;

    // Find ticket with event data
    const ticket = await Ticket.findOne({ ticketId }).populate("eventId");
    if (!ticket) {
      return res.status(404).json({ msg: "Ticket not found" });
    }

    // Verify organizer owns this event
    if (ticket.eventId.organizerId.toString() !== organizerId.toString()) {
      return res.status(403).json({ msg: "Access denied" });
    }

    // Update attendance
    ticket.attendance = attended;
    if (attended) {
      ticket.status = "completed";
    }
    await ticket.save();

    res.json({ msg: "Attendance updated", ticket });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
