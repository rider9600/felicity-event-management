import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { participantAPI } from "../../services/api";
import { formatDate, formatCurrency } from "../../utils/helpers";
import { REGISTRATION_STATUS, EVENT_TYPES } from "../../utils/constants";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";
import "./ParticipantDashboard.css";

const ParticipantDashboard = () => {
  const [registrations, setRegistrations] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("upcoming");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [regsRes, eventsRes] = await Promise.all([
        participantAPI.getRegistrations(),
        // fetch published events for category tabs
        (await import("../../services/api")).eventAPI.getAll(),
      ]);

      setRegistrations(regsRes.data);
      setEvents(eventsRes.data || []);
    } catch (err) {
      setError("Failed to load your events");
    } finally {
      setLoading(false);
    }
  };

  const filterRegistrations = () => {
    const now = new Date();

    switch (activeTab) {
      case "upcoming":
        // show upcoming published events (not only registered)
        return events.filter(
          (e) => new Date(e.startDate) > now && e.status === "published",
        );
      case "normal":
        return events.filter(
          (e) => e.type === EVENT_TYPES.NORMAL && e.status === "published",
        );
      case "merchandise":
        return events.filter(
          (e) => e.type === EVENT_TYPES.MERCHANDISE && e.status === "published",
        );
      case "completed":
        return registrations.filter(
          (reg) => reg.status === REGISTRATION_STATUS.COMPLETED,
        );
      case "cancelled":
        return registrations.filter(
          (reg) =>
            reg.status === REGISTRATION_STATUS.CANCELLED ||
            reg.status === REGISTRATION_STATUS.REJECTED,
        );
      default:
        return registrations;
    }
  };

  if (loading) return <LoadingSpinner message="Loading your events..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;

  const filteredRegistrations = filterRegistrations();

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>My Events Dashboard</h1>
        <Link to="/events" className="btn-primary">
          Browse Events
        </Link>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === "upcoming" ? "active" : ""}`}
          onClick={() => setActiveTab("upcoming")}
        >
          Upcoming Events
        </button>
        <button
          className={`tab ${activeTab === "normal" ? "active" : ""}`}
          onClick={() => setActiveTab("normal")}
        >
          Normal Events
        </button>
        <button
          className={`tab ${activeTab === "merchandise" ? "active" : ""}`}
          onClick={() => setActiveTab("merchandise")}
        >
          Merchandise
        </button>
        <button
          className={`tab ${activeTab === "completed" ? "active" : ""}`}
          onClick={() => setActiveTab("completed")}
        >
          Completed
        </button>
        <button
          className={`tab ${activeTab === "cancelled" ? "active" : ""}`}
          onClick={() => setActiveTab("cancelled")}
        >
          Cancelled/Rejected
        </button>
      </div>

      <div className="registrations-list">
        {filteredRegistrations.length === 0 ? (
          <div className="empty-state">
            <p>No events found in this category</p>
            <Link to="/events" className="btn-secondary">
              Explore Events
            </Link>
          </div>
        ) : (
          filteredRegistrations.map((item) => {
            const isRegistration = !!item.event;
            const evt = isRegistration ? item.event : item;
            return (
              <div
                key={isRegistration ? item._id : evt._id}
                className="registration-card"
              >
                <div className="registration-header">
                  <h3>{evt.name}</h3>
                  <span className={`badge badge-${evt.type}`}>{evt.type}</span>
                </div>

                <div className="registration-details">
                  <p>
                    <strong>Organizer:</strong>{" "}
                    {evt.organizer?.name ||
                      evt.organizer?.organizerName ||
                      "Unknown"}
                  </p>
                  <p>
                    <strong>Date:</strong> {formatDate(evt.startDate)}
                  </p>
                  {isRegistration ? (
                    <p>
                      <strong>Status:</strong>{" "}
                      <span className={`status-${item.status}`}>
                        {item.status}
                      </span>
                    </p>
                  ) : null}
                </div>

                <div className="registration-actions">
                  <Link
                    to={`/events/${evt._id}`}
                    className="btn-secondary btn-sm"
                  >
                    View Event
                  </Link>
                  {isRegistration && item.ticketId && (
                    <Link
                      to={`/tickets/${item.ticketId}`}
                      className="btn-primary btn-sm"
                    >
                      View Ticket
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ParticipantDashboard;
