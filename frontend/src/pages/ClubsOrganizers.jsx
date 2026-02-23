import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import PageContainer from "../components/layout/PageContainer";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import Loading from "../components/common/Loading";
import Card from "../components/Card";
import "./ClubsOrganizers.css";

const ClubsOrganizers = () => {
  const { user, updateUser } = useAuth();
  const { apiCall } = useApi();
  const [clubs, setClubs] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("clubs");
  const [followedClubs, setFollowedClubs] = useState([]);

  useEffect(() => {
    if (user?.followedClubs) {
      setFollowedClubs(user.followedClubs.map((id) => id.toString()));
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [clubsResult, orgsResult] = await Promise.all([
        apiCall("/point/clubs"),
        apiCall("/point/organizer/list"),
      ]);

      if (clubsResult?.success && Array.isArray(clubsResult.data)) {
        setClubs(clubsResult.data);
      } else if (Array.isArray(clubsResult)) {
        setClubs(clubsResult);
      }

      if (orgsResult?.success && Array.isArray(orgsResult.data)) {
        setOrganizers(orgsResult.data);
      } else if (Array.isArray(orgsResult)) {
        setOrganizers(orgsResult);
      }
    } catch (error) {
      console.error("Failed to load clubs and organizers:", error);
    } finally {
      setLoading(false);
    }
  };

  
  const handleFollowToggle = async (id) => {
    const isFollowing = followedClubs.includes(id.toString());
    const updatedFollowed = isFollowing
      ? followedClubs.filter((cid) => cid !== id.toString())
      : [...followedClubs, id.toString()];

    // Optimistic update
    setFollowedClubs(updatedFollowed);

    if (user) {
      try {
        const result = await apiCall("/point/participant/profile", {
          method: "PUT",
          body: JSON.stringify({ followedClubs: updatedFollowed }),
        });
        if (result?.data?.participant) {
          updateUser({ followedClubs: updatedFollowed });
        }
      } catch (err) {
        // Revert on failure
        setFollowedClubs(isFollowing ? updatedFollowed.concat(id.toString()) : updatedFollowed.filter((c) => c !== id.toString()));
        console.error("Follow toggle failed:", err);
      }
    }
  };

  const filterBySearch = (items, nameKey = "name") => {
    if (!searchTerm.trim()) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        (item[nameKey] || "").toLowerCase().includes(term) ||
        (item.description || "").toLowerCase().includes(term) ||
        (item.category || "").toLowerCase().includes(term)
    );
  };

  const filteredClubs = filterBySearch(clubs);
  const filteredOrganizers = filterBySearch(
    organizers.map((o) => ({ ...o, name: o.organizerName || `${o.firstname || ""} ${o.lastname || ""}`.trim() }))
  );

  if (loading) {
    return <Loading text="Loading clubs and organizers..." />;
  }

  return (
    <PageContainer
      title="Discover Clubs & Organizers"
      subtitle="Follow clubs to get event updates and personalized recommendations"
    >
      {/* Search */}
      <div className="clubs-search">
        <Input
          type="text"
          placeholder="Search clubs or organizers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon="🔍"
        />
      </div>

      {/* Tabs */}
      <div className="clubs-tabs">
        <button
          className={`tabs-button ${activeTab === "clubs" ? "active" : ""}`}
          onClick={() => setActiveTab("clubs")}
        >
          Clubs {filteredClubs.length > 0 && `(${filteredClubs.length})`}
        </button>
        <button
          className={`tabs-button ${activeTab === "organizers" ? "active" : ""}`}
          onClick={() => setActiveTab("organizers")}
        >
          Organizers {filteredOrganizers.length > 0 && `(${filteredOrganizers.length})`}
        </button>
      </div>

      {/* Clubs List */}
      {activeTab === "clubs" && (
        <div className="clubs-grid">
          {filteredClubs.length > 0 ? (
            filteredClubs.map((club) => {
              const isFollowing = followedClubs.includes(club._id?.toString());
              return (
                <Card key={club._id} className="club-card">
                  <div className="club-header">
                    <h3>{club.name}</h3>
                    <Badge variant={isFollowing ? "primary" : "default"}>
                      {isFollowing ? "Following" : "Not Following"}
                    </Badge>
                  </div>
                  {club.category && <p className="club-category">{club.category}</p>}
                  <p className="club-description">{club.description || "No description available."}</p>
                  <div className="club-stats">
                    <span>📅 {club.events?.length || 0} events</span>
                    <span>👥 {club.organizers?.length || 0} organizers</span>
                  </div>
                  {user && (
                    <Button
                      variant={isFollowing ? "outline" : "primary"}
                      size="small"
                      onClick={() => handleFollowToggle(club._id)}
                    >
                      {isFollowing ? "Unfollow" : "Follow Club"}
                    </Button>
                  )}
                </Card>
              );
            })
          ) : (
            <p className="empty-state">No clubs found matching your search.</p>
          )}
        </div>
      )}

      {/* Organizers List */}
      {activeTab === "organizers" && (
        <div className="clubs-grid">
          {filteredOrganizers.length > 0 ? (
            filteredOrganizers.map((organizer) => {
              const isFollowing = followedClubs.includes(organizer._id?.toString());
              return (
                <Card key={organizer._id} className="club-card">
                  <div className="club-header">
                    <h3>{organizer.name}</h3>
                    <Badge variant={isFollowing ? "primary" : "default"}>
                      {isFollowing ? "Following" : "Not Following"}
                    </Badge>
                  </div>
                  {organizer.category && <p className="club-category">{organizer.category}</p>}
                  <p className="club-description">{organizer.description || "No description available."}</p>
                  <div className="club-stats">
                    <span>📧 {organizer.contactEmail || organizer.email}</span>
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                    <Link to={`/organizers/${organizer._id}`}>
                      <Button variant="outline" size="small">View Details</Button>
                    </Link>
                    {user && (
                      <Button
                        variant={isFollowing ? "outline" : "primary"}
                        size="small"
                        onClick={() => handleFollowToggle(organizer._id)}
                      >
                        {isFollowing ? "Unfollow" : "Follow"}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })
          ) : (
            <p className="empty-state">No organizers found matching your search.</p>
          )}
        </div>
      )}
    </PageContainer>
  );
};

export default ClubsOrganizers;
