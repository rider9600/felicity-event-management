import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { organizerAPI, participantAPI } from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";
import "./OrganizersList.css";

const OrganizersList = () => {
  const [organizers, setOrganizers] = useState([]);
  const [followedOrganizers, setFollowedOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);

        const [organizersRes, followedRes] = await Promise.all([
          organizerAPI.getAll(),
          participantAPI.getFollowedOrganizers().catch((err) => {
            console.error("Failed to load followed organizers:", err);
            return { data: [] };
          }),
        ]);

        if (!isMounted) return;

        const organizersData = Array.isArray(organizersRes.data)
          ? organizersRes.data
          : organizersRes.data?.organizers || [];

        const followedData = Array.isArray(followedRes.data)
          ? followedRes.data
          : followedRes.data?.organizers || [];

        setOrganizers(organizersData);
        setFollowedOrganizers(followedData.map((org) => org._id));
      } catch (err) {
        if (!isMounted) return;
        setError("Failed to load organizers");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleFollow = async (organizerId) => {
    try {
      setUpdatingId(organizerId);

      const wasFollowing = followedOrganizers.includes(organizerId);

      if (followedOrganizers.includes(organizerId)) {
        await participantAPI.unfollowOrganizer(organizerId);
        setFollowedOrganizers((prev) =>
          prev.filter((id) => id !== organizerId),
        );
      } else {
        await participantAPI.followOrganizer(organizerId);
        setFollowedOrganizers((prev) => [...prev, organizerId]);
      }
    } catch (err) {
      console.error("Failed to update follow status", err);
      // Optional: rollback optimistic change if you add it later
      alert("Could not update follow status. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <LoadingSpinner message="Loading organizers..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchOrganizers} />;

  return (
    <div className="organizers-container">
      <div className="organizers-header">
        <h1>Clubs & Organizers</h1>
        <p>Discover and follow clubs to stay updated about their events</p>
      </div>

      <div className="organizers-grid">
        {organizers.map((organizer) => (
          <div key={organizer._id} className="organizer-card">
            <div className="organizer-avatar">
              {(organizer.organizerName || organizer.name)
                ?.charAt(0)
                .toUpperCase()}
            </div>

            <div className="organizer-content">
              <Link
                to={`/organizers/${organizer._id}`}
                className="organizer-name"
              >
                {organizer.organizerName || organizer.name}
              </Link>
              <p className="organizer-category">{organizer.category}</p>
              <p className="organizer-description">{organizer.description}</p>
            </div>

            <button
              className={`follow-btn ${
                followedOrganizers.includes(organizer._id) ? "following" : ""
              }`}
              disabled={updatingId === organizer._id}
              onClick={() => handleToggleFollow(organizer._id)}
            >
              {followedOrganizers.includes(organizer._id)
                ? "Following"
                : "Follow"}
            </button>
          </div>
        ))}
      </div>

      {organizers.length === 0 && (
        <div className="empty-state">
          <p>No organizers found</p>
        </div>
      )}
    </div>
  );
};

export default OrganizersList;
