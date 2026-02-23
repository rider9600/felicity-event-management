import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";
import PageContainer from "../components/layout/PageContainer";
import EventCard from "../components/cards/EventCard";
import Badge from "../components/common/Badge";
import Loading from "../components/common/Loading";
import Button from "../components/common/Button";

const OrganizerDetail = () => {
  const { organizerId } = useParams();
  const { apiCall } = useApi();
  const { user } = useAuth();
  const [organizer, setOrganizer] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");

  useEffect(() => {
    loadOrganizerData();
  }, [organizerId]);

  const loadOrganizerData = async () => {
    setLoading(true);
    try {
      const [orgRes, eventsRes] = await Promise.all([
        apiCall(`/point/organizer/detail/${organizerId}`),
        apiCall(`/point/events/organizer/${organizerId}`),
      ]);

      // orgRes is the organizer object directly (not wrapped)
      if (orgRes && orgRes._id) {
        setOrganizer(orgRes);
      } else if (orgRes?.data && orgRes.data._id) {
        setOrganizer(orgRes.data);
      }

      // Events by organizer
      const eventsArr = eventsRes?.events || eventsRes?.data || (Array.isArray(eventsRes) ? eventsRes : []);
      setEvents(eventsArr);
    } catch (error) {
      console.error("Failed to load organizer:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading text="Loading organizer..." />;
  if (!organizer) {
    return (
      <PageContainer title="Organizer Not Found">
        <p>The organizer you're looking for doesn't exist.</p>
        <Link to="/clubs"><Button variant="primary">Back to Clubs</Button></Link>
      </PageContainer>
    );
  }

  const now = new Date();
  const upcomingEvents = events.filter((e) => new Date(e.eventStartDate) > now && e.status === "published");
  const pastEvents = events.filter((e) => new Date(e.eventEndDate) < now || e.status === "completed");

  return (
    <PageContainer
      title={organizer.organizerName || `${organizer.firstname || ""} ${organizer.lastname || ""}`.trim()}
      subtitle={organizer.category}
    >
      {/* Organizer Info Card */}
      <div style={{
        background: "var(--card-bg, #1a1a2e)",
        border: "1px solid var(--border-color, #2a2a4a)",
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "32px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2 style={{ margin: "0 0 8px 0" }}>
              {organizer.organizerName || `${organizer.firstname || ""} ${organizer.lastname || ""}`.trim()}
            </h2>
            {organizer.category && <Badge variant="primary">{organizer.category}</Badge>}
          </div>
        </div>
        {organizer.description && (
          <p style={{ marginTop: "16px", color: "#b0b0c8", lineHeight: 1.6 }}>{organizer.description}</p>
        )}
        <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
          {(organizer.contactEmail || organizer.email) && (
            <p style={{ margin: 0, color: "#888" }}>
              📧 <a href={`mailto:${organizer.contactEmail || organizer.email}`} style={{ color: "#a78bfa" }}>
                {organizer.contactEmail || organizer.email}
              </a>
            </p>
          )}
          <p style={{ margin: 0, color: "#888" }}>📅 {events.length} total events</p>
        </div>
      </div>

      {/* Events Tabs */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
        <button
          className={`tab-button ${activeTab === "upcoming" ? "active" : ""}`}
          onClick={() => setActiveTab("upcoming")}
          style={{
            padding: "8px 20px",
            borderRadius: "8px",
            border: "1px solid var(--border-color, #2a2a4a)",
            background: activeTab === "upcoming" ? "#6366f1" : "transparent",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Upcoming ({upcomingEvents.length})
        </button>
        <button
          className={`tab-button ${activeTab === "past" ? "active" : ""}`}
          onClick={() => setActiveTab("past")}
          style={{
            padding: "8px 20px",
            borderRadius: "8px",
            border: "1px solid var(--border-color, #2a2a4a)",
            background: activeTab === "past" ? "#6366f1" : "transparent",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Past ({pastEvents.length})
        </button>
      </div>

      {/* Events Grid */}
      {(activeTab === "upcoming" ? upcomingEvents : pastEvents).length > 0 ? (
        <div className="events-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
          {(activeTab === "upcoming" ? upcomingEvents : pastEvents).map((event) => (
            <EventCard
              key={event._id}
              event={event}
              userRole={user?.role || "participant"}
              currentUserId={user?._id}
            />
          ))}
        </div>
      ) : (
        <p style={{ color: "#888", textAlign: "center", padding: "40px" }}>
          No {activeTab} events for this organizer.
        </p>
      )}

      <div style={{ marginTop: "32px" }}>
        <Link to="/clubs"><Button variant="outline">← Back to Clubs & Organizers</Button></Link>
      </div>
    </PageContainer>
  );
};

export default OrganizerDetail;
