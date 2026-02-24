import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import DashboardCard from "../components/cards/DashboardCard";
import EventCard from "../components/cards/EventCard";
import PageContainer from "../components/layout/PageContainer";
import Button from "../components/common/Button";
import Loading from "../components/common/Loading";
import Badge from "../components/common/Badge";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { apiCall, loading } = useApi();

  const [dashboardData, setDashboardData] = useState({
    upcoming: [],
    normalHistory: [],
    merchandiseHistory: [],
    completed: [],
    cancelledRejected: [],
  });
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    completedEvents: 0,
  });
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setDataLoading(true);
    try {
      const [dashRes, recRes] = await Promise.all([
        apiCall("/point/participant/dashboard"),
        apiCall("/point/participant/recommended-events"),
      ]);

      if (dashRes && !dashRes.error) {
        const data = {
          upcoming: dashRes.upcoming || [],
          normalHistory: dashRes.normalHistory || [],
          merchandiseHistory: dashRes.merchandiseHistory || [],
          completed: dashRes.completed || [],
          cancelledRejected: dashRes.cancelledRejected || [],
        };

        setDashboardData(data);

        const allTickets = [
          ...data.upcoming,
          ...data.normalHistory,
          ...data.merchandiseHistory,
          ...data.completed,
          ...data.cancelledRejected,
        ];
        const unique = [...new Map(allTickets.map((t) => [t._id, t])).values()];

        setStats({
          totalEvents: unique.length,
          upcomingEvents: data.upcoming.length,
          completedEvents: data.completed.length,
        });
      }

      if (recRes && Array.isArray(recRes)) {
        setRecommendedEvents(recRes.slice(0, 4));
      } else if (recRes && Array.isArray(recRes.events)) {
        setRecommendedEvents(recRes.events.slice(0, 4));
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleViewTicket = () => {
    navigate("/tickets");
  };

  const getActiveTabTickets = () => {
    switch (activeTab) {
      case "upcoming":
        return dashboardData.upcoming;
      case "normal":
        return dashboardData.normalHistory;
      case "merchandise":
        return dashboardData.merchandiseHistory;
      case "completed":
        return dashboardData.completed;
      case "cancelled":
        return dashboardData.cancelledRejected;
      default:
        return [];
    }
  };

  const renderTicketRecord = (ticket) => {
    const event = ticket.eventId || {};

    const organizerName =
      event.organizerId?.organizerName ||
      `${event.organizerId?.firstname || ""} ${
        event.organizerId?.lastname || ""
      }`.trim() ||
      event.club?.clubName ||
      "";

    const getStatusColor = (status) => {
      switch (status) {
        case "active":
          return "success";
        case "completed":
          return "primary";
        case "cancelled":
        case "rejected":
          return "danger";
        default:
          return "default";
      }
    };

    return (
      <div key={ticket._id || ticket.ticketId} className="ticket-record">
        <div className="record-left">
          <div className="event-info">
            <h4 className="event-name">
              {event.eventName || "Unknown Event"}
            </h4>
            <p className="event-meta">
              <span className="event-type-label">
                {event.eventType || "—"}
              </span>
              {organizerName && (
                <span className="organizer-label">• {organizerName}</span>
              )}
            </p>
            {event.eventStartDate && (
              <p className="event-schedule">
                {new Date(event.eventStartDate).toLocaleDateString()}{" "}
                {event.eventEndDate &&
                  event.eventEndDate !== event.eventStartDate &&
                  `– ${new Date(
                    event.eventEndDate,
                  ).toLocaleDateString()}`}
              </p>
            )}
            {ticket.purchaseDetails && (
              <p className="purchase-info">
                Item:{" "}
                <span>
                  {ticket.purchaseDetails.name ||
                    ticket.purchaseDetails.itemName}
                </span>
              </p>
            )}
          </div>
        </div>
        <div className="record-right">
          <Badge variant={getStatusColor(ticket.status)}>
            {ticket.status}
          </Badge>
          <div className="record-actions">
            <button
              className="ticket-id-link"
              onClick={handleViewTicket}
              title="View my tickets"
            >
              Ticket ID: {ticket.ticketId}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (dataLoading || loading) {
    return <Loading text="Loading your dashboard..." />;
  }

  const activeTickets = getActiveTabTickets();

  return (
    <PageContainer
      title={`Welcome back, ${user?.firstname}!`}
      subtitle="Here's your activity overview"
      actions={
        <Button variant="primary" onClick={() => navigate("/events")}>
          Browse Events
        </Button>
      }
    >
      <div className="dashboard-stats">
        <DashboardCard
          title="Total Events"
          value={stats.totalEvents}
          icon="📅"
          variant="primary"
        />
        <DashboardCard
          title="Upcoming Events"
          value={stats.upcomingEvents}
          icon="⏰"
          variant="warning"
        />
        <DashboardCard
          title="Completed Events"
          value={stats.completedEvents}
          icon="✔"
          variant="success"
        />
      </div>

      <section className="dashboard-section">
        <div className="section-header">
          <h2>My Participation History</h2>
        </div>

        <div className="participation-tabs">
          {[
            {
              key: "upcoming",
              label: `Upcoming (${dashboardData.upcoming.length})`,
            },
            {
              key: "normal",
              label: `Normal (${dashboardData.normalHistory.length})`,
            },
            {
              key: "merchandise",
              label: `Merchandise (${dashboardData.merchandiseHistory.length})`,
            },
            {
              key: "completed",
              label: `Completed (${dashboardData.completed.length})`,
            },
            {
              key: "cancelled",
              label: `Cancelled/Rejected (${dashboardData.cancelledRejected.length})`,
            },
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`tab-button ${activeTab === key ? "active" : ""}`}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTickets.length > 0 ? (
          <div className="ticket-records">
            {activeTickets.map((ticket) => renderTicketRecord(ticket))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No {activeTab} events yet.</p>
            <Button variant="primary" onClick={() => navigate("/events")}>
              Browse Events
            </Button>
          </div>
        )}
      </section>

      {recommendedEvents.length > 0 && (
        <section className="dashboard-section">
          <div className="section-header">
            <h2>Recommended for You</h2>
            <Button
              variant="outline"
              size="small"
              onClick={() => navigate("/events")}
            >
              View All Events
            </Button>
          </div>
          <div className="events-grid">
            {recommendedEvents.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                userRole="participant"
                currentUserId={user?._id}
              />
            ))}
          </div>
        </section>
      )}
    </PageContainer>
  );
};

export default Dashboard;
