import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import DashboardLayout from "../components/layout/DashboardLayout";
import DashboardCard from "../components/cards/DashboardCard";
import EventCard from "../components/cards/EventCard";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import Loading from "../components/common/Loading";
import Modal from "../components/common/Modal";
import "./OrganizerDashboard.css";

const OrganizerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { apiCall, loading } = useApi();

  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalRegistrations: 0,
    totalRevenue: 0,
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  useEffect(() => {
    loadOrganizerData();
  }, []);

  const loadOrganizerData = async () => {
    try {
      const result = await apiCall("/point/events/my-events");

      let eventList = [];
      if (result && result.success && Array.isArray(result.data)) {
        eventList = result.data;
      } else if (Array.isArray(result)) {
        eventList = result;
      }

      setEvents(eventList);
      calculateStats(eventList);
    } catch (error) {
      console.error("Failed to load organizer data:", error);
    }
  };

  const calculateStats = (eventData) => {
    const totalEvents = eventData.length;
    const activeEvents = eventData.filter(
      (event) => event.status === "published" || event.status === "ongoing",
    ).length;
    const totalRegistrations = eventData.reduce(
      (sum, event) => sum + (event.registrationCount || 0),
      0,
    );
    const totalRevenue = eventData.reduce(
      (sum, event) =>
        sum + (event.registrationCount || 0) * (event.registrationFee || 0),
      0,
    );

    setStats({
      totalEvents,
      activeEvents,
      totalRegistrations,
      totalRevenue,
    });
  };

  const handleEditEvent = (event) => {
    navigate(`/organizer/events/edit/${event._id}`);
  };

  const handleDeleteEvent = (event) => {
    setEventToDelete(event);
    setShowDeleteModal(true);
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;

    try {
      const result = await apiCall(`/point/events/${eventToDelete._id}`, {
        method: "DELETE",
      });
      if (result.success || result.message) {
        await loadOrganizerData();
        setShowDeleteModal(false);
        setEventToDelete(null);
      } else {
        // eslint-disable-next-line no-alert
        alert(result.error || "Failed to delete event");
      }
    } catch (error) {
      console.error("Failed to delete event:", error);
      // eslint-disable-next-line no-alert
      alert("Failed to delete event");
    }
  };

  const dashboardCards = [
    {
      title: "Total Events",
      value: stats.totalEvents,
      subtitle: "Events created",
      variant: "primary",
      icon: "📅",
    },
    {
      title: "Active Events",
      value: stats.activeEvents,
      subtitle: "Currently running",
      variant: "success",
      icon: "🎯",
    },
    {
      title: "Total Registrations",
      value: stats.totalRegistrations,
      subtitle: "Across all events",
      variant: "info",
      icon: "👥",
    },
    {
      title: "Total Revenue",
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      subtitle: "Registration fees",
      variant: "warning",
      icon: "💰",
    },
  ];

  const recentEvents = events.slice(0, 5);

  if (loading) {
    return (
      <DashboardLayout>
        <Loading size="large" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="organizer-dashboard">
        <div className="dashboard-header">
          <div className="header-content">
            <h1>Organizer Dashboard</h1>
            <p>
              Welcome back, {user?.firstname}! Here's an overview of your
              events.
            </p>
          </div>

          <div className="header-actions">
            <Button
              variant="primary"
              onClick={() => navigate("/organizer/events/create")}
            >
              Create New Event
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate("/organizer/events")}
            >
              Manage Events
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          {dashboardCards.map((card, index) => (
            <DashboardCard
              key={index}
              title={card.title}
              value={card.value}
              subtitle={card.subtitle}
              variant={card.variant}
              icon={card.icon}
            />
          ))}
        </div>

        {/* Recent Events Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent Events</h2>
            <Button
              variant="ghost"
              onClick={() => navigate("/organizer/events")}
            >
              View All Events →
            </Button>
          </div>

          {recentEvents.length > 0 ? (
            <div className="events-grid">
              {recentEvents.map((event) => (
                <EventCard
                  key={event._id}
                  event={event}
                  userRole="organizer"
                  onEdit={handleEditEvent}
                  onDelete={handleDeleteEvent}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h3>No Events Yet</h3>
              <p>Create your first event to get started with the platform.</p>
              <Button
                variant="primary"
                onClick={() => navigate("/organizer/events/create")}
              >
                Create Your First Event
              </Button>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="actions-grid">
            <div
              className="action-card"
              onClick={() => navigate("/organizer/events/create")}
            >
              <div className="action-icon">➕</div>
              <div className="action-content">
                <h4>Create Event</h4>
                <p>Set up a new event</p>
              </div>
            </div>

            <div
              className="action-card"
              onClick={() => navigate("/organizer/analytics")}
            >
              <div className="action-icon">📊</div>
              <div className="action-content">
                <h4>View Analytics</h4>
                <p>Check detailed statistics</p>
              </div>
            </div>

            <div className="action-card" onClick={() => navigate("/profile")}>
              <div className="action-icon">👤</div>
              <div className="action-content">
                <h4>Update Profile</h4>
                <p>Manage your information</p>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Event Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Event"
          size="medium"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={confirmDeleteEvent}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete Event"}
              </Button>
            </>
          }
        >
          <p>
            Are you sure you want to delete "
            <strong>{eventToDelete?.eventName}</strong>"? This action cannot be
            undone and all registrations will be lost.
          </p>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default OrganizerDashboard;
