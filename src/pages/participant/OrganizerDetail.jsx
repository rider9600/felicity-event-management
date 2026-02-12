import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { participantAPI } from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";

const OrganizerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [organizer, setOrganizer] = useState(null);
  const [events, setEvents] = useState({
    upcoming: [],
    past: [],
  });
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    fetchOrganizerDetails();
  }, [id]);

  const fetchOrganizerDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await participantAPI.getOrganizerDetail(id);
      setOrganizer(response.data.organizer);
      setEvents(response.data.events);
      setIsFollowing(response.data.isFollowing || false);
    } catch (err) {
      console.error("Error fetching organizer:", err);
      setError(
        err.response?.data?.message || "Failed to load organizer details",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      await participantAPI.followOrganizer(id);
      setIsFollowing(true);
    } catch (err) {
      console.error("Error following organizer:", err);
      alert(err.response?.data?.message || "Failed to follow organizer");
    }
  };

  const handleUnfollow = async () => {
    try {
      await participantAPI.unfollowOrganizer(id);
      setIsFollowing(false);
    } catch (err) {
      console.error("Error unfollowing organizer:", err);
      alert(err.response?.data?.message || "Failed to unfollow organizer");
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!organizer) return <ErrorMessage message="Organizer not found" />;

  return (
    <div
      className="container"
      style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}
    >
      {/* Organizer Header */}
      <div
        className="organizer-header"
        style={{
          background: "white",
          padding: "2rem",
          borderRadius: "10px",
          marginBottom: "2rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: 1 }}>
            <h1 style={{ marginBottom: "0.5rem", color: "#333" }}>
              {organizer.organizerName}
            </h1>
            <div
              style={{
                display: "inline-block",
                padding: "0.25rem 0.75rem",
                background: "#e3f2fd",
                color: "#1976d2",
                borderRadius: "20px",
                fontSize: "0.9rem",
                fontWeight: "500",
                marginBottom: "1rem",
              }}
            >
              {organizer.category}
            </div>
            <p style={{ color: "#666", lineHeight: "1.6", marginTop: "1rem" }}>
              {organizer.description}
            </p>
            <div style={{ marginTop: "1rem", color: "#555" }}>
              <p>
                <strong>Contact Email:</strong> {organizer.contactEmail}
              </p>
            </div>
          </div>

          <button
            onClick={isFollowing ? handleUnfollow : handleFollow}
            style={{
              padding: "0.75rem 1.5rem",
              background: isFollowing ? "#fff" : "#4a90e2",
              color: isFollowing ? "#4a90e2" : "#fff",
              border: isFollowing ? "2px solid #4a90e2" : "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "500",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              if (isFollowing) {
                e.target.style.background = "#f44336";
                e.target.style.color = "#fff";
                e.target.style.borderColor = "#f44336";
                e.target.textContent = "Unfollow";
              } else {
                e.target.style.background = "#357abd";
              }
            }}
            onMouseLeave={(e) => {
              if (isFollowing) {
                e.target.style.background = "#fff";
                e.target.style.color = "#4a90e2";
                e.target.style.borderColor = "#4a90e2";
                e.target.textContent = "Following";
              } else {
                e.target.style.background = "#4a90e2";
              }
            }}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        </div>
      </div>

      {/* Upcoming Events Section */}
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ marginBottom: "1rem", color: "#333" }}>Upcoming Events</h2>
        {events.upcoming.length === 0 ? (
          <p
            style={{
              color: "#999",
              padding: "2rem",
              textAlign: "center",
              background: "#f9f9f9",
              borderRadius: "8px",
            }}
          >
            No upcoming events scheduled
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {events.upcoming.map((event) => (
              <div
                key={event._id}
                style={{
                  background: "white",
                  padding: "1.5rem",
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  cursor: "pointer",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
                onClick={() => navigate(`/events/${event._id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "0.75rem",
                  }}
                >
                  <h3 style={{ margin: 0, color: "#333", fontSize: "1.1rem" }}>
                    {event.name}
                  </h3>
                  <span
                    style={{
                      padding: "0.25rem 0.5rem",
                      background:
                        event.type === "normal" ? "#e8f5e9" : "#fff3e0",
                      color: event.type === "normal" ? "#2e7d32" : "#e65100",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontWeight: "500",
                      textTransform: "capitalize",
                    }}
                  >
                    {event.type}
                  </span>
                </div>

                <p
                  style={{
                    color: "#666",
                    fontSize: "0.9rem",
                    marginBottom: "1rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {event.description}
                </p>

                <div style={{ fontSize: "0.85rem", color: "#555" }}>
                  <p style={{ margin: "0.25rem 0" }}>
                    🗓️{" "}
                    {new Date(event.startDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p style={{ margin: "0.25rem 0" }}>
                    💰 ₹{event.registrationFee || 0}
                  </p>
                  {event.registrationLimit && (
                    <p style={{ margin: "0.25rem 0" }}>
                      👥 {event.statistics?.registeredCount || 0} /{" "}
                      {event.registrationLimit}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Events Section */}
      <div>
        <h2 style={{ marginBottom: "1rem", color: "#333" }}>Past Events</h2>
        {events.past.length === 0 ? (
          <p
            style={{
              color: "#999",
              padding: "2rem",
              textAlign: "center",
              background: "#f9f9f9",
              borderRadius: "8px",
            }}
          >
            No past events
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {events.past.map((event) => (
              <div
                key={event._id}
                style={{
                  background: "white",
                  padding: "1.5rem",
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  cursor: "pointer",
                  opacity: 0.85,
                  transition: "opacity 0.2s ease",
                }}
                onClick={() => navigate(`/events/${event._id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = 1;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = 0.85;
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "0.75rem",
                  }}
                >
                  <h3 style={{ margin: 0, color: "#333", fontSize: "1.1rem" }}>
                    {event.name}
                  </h3>
                  <span
                    style={{
                      padding: "0.25rem 0.5rem",
                      background: "#e0e0e0",
                      color: "#616161",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontWeight: "500",
                      textTransform: "capitalize",
                    }}
                  >
                    Completed
                  </span>
                </div>

                <p
                  style={{
                    color: "#666",
                    fontSize: "0.9rem",
                    marginBottom: "1rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {event.description}
                </p>

                <div style={{ fontSize: "0.85rem", color: "#555" }}>
                  <p style={{ margin: "0.25rem 0" }}>
                    🗓️{" "}
                    {new Date(event.startDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  {event.statistics?.registeredCount > 0 && (
                    <p style={{ margin: "0.25rem 0" }}>
                      👥 {event.statistics.registeredCount} participants
                    </p>
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

export default OrganizerDetail;
