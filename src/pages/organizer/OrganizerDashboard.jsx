import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { organizerAPI } from "../../services/api";
import { formatDate, formatCurrency } from "../../utils/helpers";
import { EVENT_STATUS } from "../../utils/constants";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";
import "./OrganizerDashboard.css";

const OrganizerDashboard = () => {
  const [events, setEvents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const eventsResponse = await organizerAPI.getMyEvents();
      setEvents(eventsResponse.data);

      // Calculate overall analytics from completed events
      const completedEvents = eventsResponse.data.filter(
        (e) => e.status === EVENT_STATUS.COMPLETED,
      );
      const totalRegistrations = completedEvents.reduce(
        (sum, e) => sum + (e.registeredCount || 0),
        0,
      );
      const totalRevenue = completedEvents.reduce(
        (sum, e) => sum + (e.totalRevenue || 0),
        0,
      );
      const totalAttendance = completedEvents.reduce(
        (sum, e) => sum + (e.attendanceCount || 0),
        0,
      );

      setAnalytics({
        totalEvents: completedEvents.length,
        totalRegistrations,
        totalRevenue,
        totalAttendance,
      });
    } catch (err) {
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;
  if (error)
    return <ErrorMessage message={error} onRetry={fetchDashboardData} />;

  return (
    <div className="organizer-dashboard-container">
      <div className="dashboard-header">
        <h1>Organizer Dashboard</h1>
        <Link to="/organizer/events/create" className="btn-primary">
          Create New Event
        </Link>
      </div>

      {/* Analytics Section */}
      {analytics && analytics.totalEvents > 0 && (
        <div className="analytics-grid">
          <div className="analytics-card">
            <h3>Total Events</h3>
            <p className="analytics-value">{analytics.totalEvents}</p>
          </div>
          <div className="analytics-card">
            <h3>Total Registrations</h3>
            <p className="analytics-value">{analytics.totalRegistrations}</p>
          </div>
          <div className="analytics-card">
            <h3>Total Revenue</h3>
            <p className="analytics-value">
              {formatCurrency(analytics.totalRevenue)}
            </p>
          </div>
          <div className="analytics-card">
            <h3>Total Attendance</h3>
            <p className="analytics-value">{analytics.totalAttendance}</p>
          </div>
        </div>
      )}

      {/* Events Carousel */}
      <div className="events-section">
        <h2>Your Events</h2>

        {events.length === 0 ? (
          <div className="empty-state">
            <p>You haven't created any events yet</p>
            <Link to="/organizer/events/create" className="btn-primary">
              Create Your First Event
            </Link>
          </div>
        ) : (
          <div className="events-carousel">
            {events.map((event) => (
              <div key={event._id} className="event-card">
                <div className="event-card-header">
                  <h3>{event.name}</h3>
                  <span className={`status-badge status-${event.status}`}>
                    {event.status}
                  </span>
                </div>

                <div className="event-card-body">
                  <p className="event-type">
                    <strong>Type:</strong> {event.type}
                  </p>
                  <p className="event-date">
                    <strong>Date:</strong> {formatDate(event.startDate)}
                  </p>
                  <p className="event-registrations">
                    <strong>Registrations:</strong> {event.registeredCount || 0}
                    {event.registrationLimit && ` / ${event.registrationLimit}`}
                  </p>
                  {event.registrationFee > 0 && (
                    <p className="event-revenue">
                      <strong>Revenue:</strong>{" "}
                      {formatCurrency(event.totalRevenue || 0)}
                    </p>
                  )}
                </div>

                <div className="event-card-actions">
                  <Link
                    to={`/organizer/events/${event._id}`}
                    className="btn-secondary btn-sm"
                  >
                    View Details
                  </Link>
                  {(event.status === EVENT_STATUS.DRAFT ||
                    event.status === EVENT_STATUS.PUBLISHED) && (
                    <Link
                      to={`/organizer/events/${event._id}/edit`}
                      className="btn-primary btn-sm"
                    >
                      Edit
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizerDashboard;
