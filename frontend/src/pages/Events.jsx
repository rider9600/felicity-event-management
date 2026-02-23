import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import EventCard from "../components/cards/EventCard";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import PageContainer from "../components/layout/PageContainer";
import Loading from "../components/common/Loading";
import "./Events.css";

const Events = () => {
  const { user } = useAuth();
  const { apiCall } = useApi();
  const [events, setEvents] = useState([]);
  const [trendingEvents, setTrendingEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    eventType: "",
    eligibility: "",
    startDate: "",
    endDate: "",
    followedClubs: false,
  });

  // Load all published events and trending events on mount
  useEffect(() => {
    loadEvents();
    loadTrendingEvents();
  }, []);

  // Re-filter when search or filters change (debounced)
  useEffect(() => {
    const handler = setTimeout(() => {
      if (showFilters) {
        fetchFilteredEvents();
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm, filters, showFilters]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const result = await apiCall("/point/events");
      const eventsArr = result?.events || result?.data || (Array.isArray(result) ? result : []);
      setEvents(eventsArr.filter((e) => e.status === "published" || e.status === "ongoing"));
    } catch (error) {
      console.error("Failed to load events:", error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTrendingEvents = async () => {
    try {
      const result = await apiCall("/point/events/trending");
      const arr = result?.events || result?.data || (Array.isArray(result) ? result : []);
      setTrendingEvents(arr);
    } catch (error) {
      console.error("Failed to load trending events:", error);
    }
  };

  // Call backend search endpoint with all active filters
  const fetchFilteredEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm.trim()) params.query = searchTerm.trim();
      if (filters.eventType) params.eventType = filters.eventType;
      if (filters.eligibility) params.eligibility = filters.eligibility;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      // followedClubs: if user has followedClubs, pass them as a comma-separated list
      if (filters.followedClubs && user?.followedClubs?.length) {
        params.followedClubs = user.followedClubs.join(",");
      }

      const queryString = new URLSearchParams(params).toString();
      const result = await apiCall(`/point/events/search?${queryString}`);
      const arr = result?.events || result?.data || (Array.isArray(result) ? result : []);
      setFilteredEvents(arr);
    } catch (error) {
      console.error("Search failed:", error);
      setFilteredEvents([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters, user]);

  const clearFilters = () => {
    setSearchTerm("");
    setFilters({ eventType: "", eligibility: "", startDate: "", endDate: "", followedClubs: false });
  };

  const getEventsBySection = () => {
    const now = new Date();
    const upcoming = events.filter((e) => new Date(e.eventStartDate) > now);
    const ongoing = events.filter(
      (e) => new Date(e.eventStartDate) <= now && new Date(e.eventEndDate) >= now
    );
    return { upcoming, ongoing };
  };

  const renderSection = (title, sectionEvents, emptyMsg) => (
    <div className="event-section">
      <h3 className="section-title">
        {title}{" "}
        {sectionEvents.length > 0 && <span className="event-count">({sectionEvents.length})</span>}
      </h3>
      {sectionEvents.length === 0 ? (
        <p className="empty-message">{emptyMsg}</p>
      ) : (
        <div className="events-grid">
          {sectionEvents.map((event) => (
            <EventCard
              key={event._id}
              event={event}
              userRole={user?.role || "participant"}
              currentUserId={user?._id}
            />
          ))}
        </div>
      )}
    </div>
  );

  const { upcoming, ongoing } = getEventsBySection();

  return (
    <PageContainer title="Events" subtitle="Browse all events — register now!">
      {/* Toggle Bar */}
      <div className="events-controls">
        <div className="toggle-section">
          <Button
            variant={!showFilters ? "primary" : "outline"}
            size="small"
            onClick={() => setShowFilters(false)}
          >
            Browse by Category
          </Button>
          <Button
            variant={showFilters ? "primary" : "outline"}
            size="small"
            onClick={() => { setShowFilters(true); fetchFilteredEvents(); }}
          >
            Search & Filter
          </Button>
        </div>
      </div>

      {showFilters ? (
        <>
          {/* Search + Filters */}
          <div className="events-controls" style={{ flexDirection: "column", gap: "12px" }}>
            <Input
              type="text"
              placeholder="Search events or organizers (fuzzy match)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <div className="filters-section">
              <select
                value={filters.eventType}
                onChange={(e) => setFilters((p) => ({ ...p, eventType: e.target.value }))}
                className="filter-select"
              >
                <option value="">All Types</option>
                <option value="normal">Normal Events</option>
                <option value="merchandise">Merchandise</option>
              </select>

              <select
                value={filters.eligibility}
                onChange={(e) => setFilters((p) => ({ ...p, eligibility: e.target.value }))}
                className="filter-select"
              >
                <option value="">All Eligibility</option>
                <option value="iiit">IIIT Only</option>
                <option value="non-iiit">Non-IIIT</option>
                <option value="open">Open to All</option>
              </select>

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <label style={{ fontSize: "13px", color: "#888" }}>From:</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters((p) => ({ ...p, startDate: e.target.value }))}
                  className="filter-select"
                />
                <label style={{ fontSize: "13px", color: "#888" }}>To:</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters((p) => ({ ...p, endDate: e.target.value }))}
                  className="filter-select"
                />
              </div>

              {user?.followedClubs?.length > 0 && (
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                  <input
                    type="checkbox"
                    checked={filters.followedClubs}
                    onChange={(e) => setFilters((p) => ({ ...p, followedClubs: e.target.checked }))}
                  />
                  Followed Clubs Only
                </label>
              )}

              <Button variant="outline" size="small" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Results */}
          <div className="events-summary">
            <p>Showing {filteredEvents.length} results</p>
          </div>
          {loading ? (
            <Loading text="Searching events..." />
          ) : filteredEvents.length > 0 ? (
            <div className="events-grid">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event._id}
                  event={event}
                  userRole={user?.role || "participant"}
                  currentUserId={user?._id}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No events found</h3>
              <p>Try adjusting your search or filters</p>
              <Button onClick={clearFilters}>Clear Filters</Button>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Trending Events Section */}
          {trendingEvents.length > 0 && (
            <div className="event-section trending-section">
              <h3 className="section-title">🔥 Trending (Top 5 / 24h)</h3>
              <div className="events-grid">
                {trendingEvents.map((event) => (
                  <EventCard
                    key={event._id}
                    event={event}
                    userRole={user?.role || "participant"}
                    currentUserId={user?._id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Categorized Sections */}
          {loading ? (
            <Loading text="Loading events..." />
          ) : (
            <div className="events-sections">
              {renderSection("🚀 Upcoming Events", upcoming, "No upcoming events scheduled")}
              {renderSection("⏰ Ongoing Events", ongoing, "No events currently ongoing")}
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
};

export default Events;
