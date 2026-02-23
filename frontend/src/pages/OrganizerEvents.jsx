import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import DashboardLayout from "../components/layout/DashboardLayout";
import EventCard from "../components/cards/EventCard";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Badge from "../components/common/Badge";
import Loading from "../components/common/Loading";
import Modal from "../components/common/Modal";
import "./OrganizerEvents.css";

const OrganizerEvents = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { apiCall, loading } = useApi();

  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    type: "all",
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [events, filters]);

  const loadEvents = async () => {
    try {
      console.log("Loading events for user:", user);
      // Use the secure endpoint that gets only current user's events
      const result = await apiCall("/point/events/my-events");
      console.log("Events API result:", result);

      if (result && result.success && Array.isArray(result.data)) {
        setEvents(result.data);
      } else if (result && Array.isArray(result)) {
        // Direct array response (fallback)
        setEvents(result);
      } else {
        console.log("No events found or unexpected response format");
        setEvents([]);
      }
    } catch (error) {
      console.error("Failed to load events:", error);
      setEvents([]);
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(
        (event) =>
          event.eventName
            .toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          event.eventDescription
            .toLowerCase()
            .includes(filters.search.toLowerCase()),
      );
    }

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter((event) => event.status === filters.status);
    }

    // Type filter
    if (filters.type !== "all") {
      filtered = filtered.filter((event) => event.eventType === filters.type);
    }

    setFilteredEvents(filtered);
  };

  const handlePublishEvent = async (event) => {
    try {
      const result = await apiCall(`/point/events/${event._id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "published" }),
      });

      if (result.success) {
        await loadEvents(); // Reload to show updated status
      } else {
        console.error("Failed to publish event:", result.error);
        alert("Failed to publish event");
      }
    } catch (error) {
      console.error("Failed to publish event:", error);
      alert("Failed to publish event");
    }
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
        await loadEvents();
        setShowDeleteModal(false);
        setEventToDelete(null);
      } else {
        console.error("Failed to delete event:", result.error);
        alert("Failed to delete event");
      }
    } catch (error) {
      console.error("Failed to delete event:", error);
      alert("Failed to delete event");
    }
  };

  const getStatusCount = (status) => {
    return events.filter((event) => event.status === status).length;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Loading size="large" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="organizer-events">
        <div className="events-header">
          <div className="header-content">
            <h1>Manage Events</h1>
            <p>Create, edit, and manage all your events in one place.</p>
          </div>

          <Button
            variant="primary"
            onClick={() => {
              console.log("Navigating to create event page");
              navigate("/organizer/events/create");
            }}
          >
            Create New Event
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="events-summary">
          <div className="summary-card">
            <div className="summary-number">{events.length}</div>
            <div className="summary-label">Total Events</div>
          </div>
          <div className="summary-card">
            <div className="summary-number">{getStatusCount("published")}</div>
            <div className="summary-label">Published</div>
          </div>
          <div className="summary-card">
            <div className="summary-number">{getStatusCount("draft")}</div>
            <div className="summary-label">Drafts</div>
          </div>
          <div className="summary-card">
            <div className="summary-number">{getStatusCount("completed")}</div>
            <div className="summary-label">Completed</div>
          </div>
        </div>

        {/* Filters */}
        <div className="events-filters">
          <div className="filter-row">
            <Input
              type="text"
              placeholder="Search events..."
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  search: e.target.value,
                }))
              }
              className="search-input"
            />

            <Input
              type="select"
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  status: e.target.value,
                }))
              }
              options={[
                { value: "all", label: "All Status" },
                { value: "draft", label: "Draft" },
                { value: "published", label: "Published" },
                { value: "ongoing", label: "Ongoing" },
                { value: "completed", label: "Completed" },
                { value: "cancelled", label: "Cancelled" },
              ]}
            />

            <Input
              type="select"
              value={filters.type}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  type: e.target.value,
                }))
              }
              options={[
                { value: "all", label: "All Types" },
                { value: "normal", label: "Regular Event" },
                { value: "merchandise", label: "Merchandise" },
                { value: "workshop", label: "Workshop" },
                { value: "seminar", label: "Seminar" },
                { value: "competition", label: "Competition" },
              ]}
            />
          </div>

          <div className="filter-results">
            Showing {filteredEvents.length} of {events.length} events
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length > 0 ? (
          <div className="events-grid">
            {filteredEvents.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                userRole="organizer"
                currentUserId={user._id}
                onEdit={handleEditEvent}
                onDelete={handleDeleteEvent}
                onPublish={handlePublishEvent}
                showActions={true}
              />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="empty-events">
            <div className="empty-icon">📅</div>
            <h3>No Events Created Yet</h3>
            <p>Create your first event to get started with the platform.</p>
            <Button
              variant="primary"
              onClick={() => {
                console.log("Navigating to create first event");
                navigate("/organizer/events/create");
              }}
            >
              Create Your First Event
            </Button>
          </div>
        ) : (
          <div className="no-results">
            <div className="empty-icon">🔍</div>
            <h3>No Events Match Your Filters</h3>
            <p>Try adjusting your search criteria or filters.</p>
            <Button
              variant="outline"
              onClick={() =>
                setFilters({ search: "", status: "all", type: "all" })
              }
            >
              Clear Filters
            </Button>
          </div>
        )}

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
          <div className="delete-confirmation">
            <p>
              Are you sure you want to delete "
              <strong>{eventToDelete?.eventName}</strong>"?
            </p>
            <div className="warning-box">
              <div className="warning-icon">⚠️</div>
              <div>
                <strong>This action cannot be undone.</strong>
                <br />
                All registrations and data associated with this event will be
                permanently lost.
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default OrganizerEvents;
