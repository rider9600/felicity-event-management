import user from "../models/user.js";
import Event from "../models/event.js";
import Ticket from "../models/ticket.js";

// Admin analytics: organizers, events, revenue
export const getAdminAnalytics = async (req, res) => {
  try {
    // High level counts
    const [organizersCount, eventsCount, usersCount] = await Promise.all([
      user.countDocuments({ role: "organizer" }),
      Event.countDocuments(),
      user.countDocuments(),
    ]);

    // Aggregate revenue per event (sum of ticket-level price info)
    const ticketAgg = await Ticket.aggregate([
      {
        $group: {
          _id: "$eventId",
          ticketCount: { $sum: 1 },
          // For merchandise tickets we stored purchaseDetails.price * quantity
          merchandiseRevenue: {
            $sum: {
              $cond: [
                { $ifNull: ["$purchaseDetails.price", false] },
                {
                  $multiply: [
                    { $ifNull: ["$purchaseDetails.price", 0] },
                    { $ifNull: ["$purchaseDetails.quantity", 1] },
                  ],
                },
                0,
              ],
            },
          },
        },
      },
    ]);

    // Read base event metadata & combine with ticket aggregates
    const events = await Event.find()
      .populate("organizerId", "firstname lastname organizerName email")
      .lean();

    const revenueByEvent = events.map((ev) => {
      const agg = ticketAgg.find(
        (t) => t._id && t._id.toString() === ev._id.toString(),
      );
      const ticketCount = agg?.ticketCount || 0;
      // registrationFee * registrationCount from event + merchandise revenue from tickets
      const registrationRevenue =
        (ev.registrationFee || 0) * (ev.registrationCount || 0);
      const merchandiseRevenue = agg?.merchandiseRevenue || 0;
      const totalRevenue = registrationRevenue + merchandiseRevenue;

      return {
        eventId: ev._id,
        // For backwards compatibility with existing frontend charts
        name: ev.eventName,
        date: ev.eventStartDate,
        revenue: totalRevenue,
        registrations: ev.registrationCount || ticketCount,
        // New, richer fields
        eventName: ev.eventName,
        eventType: ev.eventType,
        organizerId: ev.organizerId?._id,
        organizerName:
          ev.organizerId?.organizerName ||
          `${ev.organizerId?.firstname || ""} ${
            ev.organizerId?.lastname || ""
          }`.trim(),
        status: ev.status,
        registrationCount: ev.registrationCount || ticketCount,
        registrationFee: ev.registrationFee || 0,
        registrationRevenue,
        merchandiseRevenue,
        totalRevenue,
      };
    });

    // Aggregate per organizer from per-event breakdown
    const revenueByOrganizerMap = new Map();
    revenueByEvent.forEach((ev) => {
      if (!ev.organizerId) return;
      const key = ev.organizerId.toString();
      const existing = revenueByOrganizerMap.get(key) || {
        organizerId: ev.organizerId,
        organizerName: ev.organizerName,
        totalEvents: 0,
        totalRegistrations: 0,
        totalRevenue: 0,
      };
      existing.totalEvents += 1;
      existing.totalRegistrations += ev.registrationCount;
      existing.totalRevenue += ev.totalRevenue;
      revenueByOrganizerMap.set(key, existing);
    });

    const revenueByOrganizer = Array.from(revenueByOrganizerMap.values()).sort(
      (a, b) => b.totalRevenue - a.totalRevenue,
    );

    const totalPlatformRevenue = revenueByEvent.reduce(
      (sum, ev) => sum + ev.totalRevenue,
      0,
    );

    res.json({
      success: true,
      data: {
        overview: {
          totalEvents: eventsCount,
          totalRegistrations: revenueByEvent.reduce(
            (sum, ev) => sum + ev.registrationCount,
            0,
          ),
          totalRevenue: totalPlatformRevenue,
          averageEventSize:
            eventsCount > 0
              ? revenueByEvent.reduce(
                  (sum, ev) => sum + ev.registrationCount,
                  0,
                ) / eventsCount
              : 0,
          organizersCount,
          usersCount,
        },
        eventMetrics: revenueByEvent,
        organizerMetrics: revenueByOrganizer,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
