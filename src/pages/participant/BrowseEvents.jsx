import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { eventAPI, participantAPI } from "../../services/api";
import { formatDate, formatCurrency } from "../../utils/helpers";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";
import "./BrowseEvents.css";

const BrowseEvents = () => {
  const [events, setEvents] = useState([]);
  const [trendingEvents, setTrendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    type: "",
    eligibility: "",
    startDate: "",
    endDate: "",
    followedOnly: false,
  });
  const [followedOrganizers, setFollowedOrganizers] = useState([]);

  useEffect(() => {
    fetchEvents();
    fetchTrendingEvents();
    fetchFollowedOrganizers();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await eventAPI.getAll({
        ...filters,
        search: searchTerm,
      });
      setEvents(response.data);
    } catch (err) {
      setError("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingEvents = async () => {
    try {
      const response = await eventAPI.getTrending();
      setTrendingEvents(response.data);
    } catch (err) {
      console.error("Failed to load trending events:", err);
    }
  };

  const fetchFollowedOrganizers = async () => {
    try {
      const response = await participantAPI.getFollowedOrganizers();
      setFollowedOrganizers(response.data.map((org) => org._id));
    } catch (err) {
      console.error("Failed to load followed organizers:", err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const filterEvents = () => {
    let filtered = events;

    if (filters.followedOnly) {
      filtered = filtered.filter((event) =>
        followedOrganizers.includes(event.organizer._id),
      );
    }

    return filtered;
  };

  if (loading && events.length === 0) {
    return <LoadingSpinner message="Loading events..." />;
  }

  const displayEvents = filterEvents();

  return (
    <div className="browse-container">
      <div className="browse-header">
        <h1>Browse Events</h1>
      </div>

      {/* Trending Section */}
      {trendingEvents.length > 0 && (
        <div className="trending-section">
          <h2>🔥 Trending Events (Last 24h)</h2>
          <div className="trending-grid">
            {trendingEvents.map((event) => (
              <Link
                key={event._id}
                to={`/events/${event._id}`}
                className="trending-card"
              >
                <h3>{event.name}</h3>
                <p className="event-organizer">{event.organizer?.name}</p>
                <p className="event-date">{formatDate(event.startDate)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="search-filter-section">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search events or organizers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn-primary">
            Search
          </button>
        </form>

        <div className="filters">
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange("type", e.target.value)}
            className="filter-select"
          >
            <option value="">All Event Types</option>
            <option value="normal">Normal Events</option>
            <option value="merchandise">Merchandise</option>
          </select>

          <select
            value={filters.eligibility}
            onChange={(e) => handleFilterChange("eligibility", e.target.value)}
            className="filter-select"
          >
            <option value="">All Eligibility</option>
            <option value="iiit">IIIT Only</option>
            <option value="all">Open to All</option>
          </select>

          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange("startDate", e.target.value)}
            className="filter-input"
            placeholder="Start Date"
          />

          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange("endDate", e.target.value)}
            className="filter-input"
            placeholder="End Date"
          />

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={filters.followedOnly}
              onChange={(e) =>
                handleFilterChange("followedOnly", e.target.checked)
              }
            />
            <span>Followed Clubs Only</span>
          </label>
        </div>
      </div>

      {/* Events Grid */}
      {error && <ErrorMessage message={error} onRetry={fetchEvents} />}

      <div className="events-grid">
        {displayEvents.length === 0 ? (
          <div className="empty-state">
            <p>No events found matching your criteria</p>
          </div>
        ) : (
          displayEvents.map((event) => (
            <div key={event._id} className="event-card">
              <div className="event-card-header">
                <h3>{event.name}</h3>
                <span className={`badge badge-${event.type}`}>
                  {event.type}
                </span>
              </div>

              <p className="event-description">
                {event.description?.substring(0, 120)}
                {event.description?.length > 120 && "..."}
              </p>

              <div className="event-meta">
                <p>
                  <strong>Organizer:</strong> {event.organizer?.name}
                </p>
                <p>
                  <strong>Date:</strong> {formatDate(event.startDate)}
                </p>
                <p>
                  <strong>Fee:</strong>{" "}
                  {event.registrationFee > 0
                    ? formatCurrency(event.registrationFee)
                    : "Free"}
                </p>
                <p>
                  <strong>Deadline:</strong>{" "}
                  {formatDate(event.registrationDeadline)}
                </p>
              </div>

              <Link
                to={`/events/${event._id}`}
                className="btn-primary btn-block"
              >
                View Details
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BrowseEvents;
