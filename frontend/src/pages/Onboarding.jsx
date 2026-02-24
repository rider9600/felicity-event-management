import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import "../pages/Onboarding.css";

const INTERESTS = [
  "Mastery",
  "Creation",
  "Empathy",
  "Progress",
  "Connection",
  "Growth",
  "Challenge",
  "Validation",
  "Impact",
  "Exploration",
  "Evolution",
  "Learning",
  "Playfulness",
  "Improvement",
];

export default function Onboarding() {
  const [selected, setSelected] = useState([]);
  const [selectedClubs, setSelectedClubs] = useState([]);
  const [clubs, setClubs] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { apiCall } = useApi();

  const toggleInterest = (tag) => {
    if (selected.includes(tag)) {
      setSelected(selected.filter((i) => i !== tag));
    } else {
      setSelected([...selected, tag]);
    }
  };

  const toggleClub = (id) => {
    if (selectedClubs.includes(id)) {
      setSelectedClubs(selectedClubs.filter((c) => c !== id));
    } else {
      setSelectedClubs([...selectedClubs, id]);
    }
  };

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [prefsRes, clubsRes] = await Promise.all([
          apiCall("/point/preferences/get"),
          apiCall("/point/clubs"),
        ]);

        if (prefsRes?.success) {
          if (Array.isArray(prefsRes.data?.interests)) {
            setSelected(prefsRes.data.interests);
          }
          if (Array.isArray(prefsRes.data?.followedClubs)) {
            setSelectedClubs(prefsRes.data.followedClubs.map(String));
          }
        }

        if (clubsRes?.success && Array.isArray(clubsRes.data)) {
          setClubs(clubsRes.data);
        } else if (Array.isArray(clubsRes)) {
          setClubs(clubsRes);
        }
      } catch (error) {
        console.error("Failed to load onboarding data:", error);
      }
    };

    loadInitial();
  }, [apiCall]);

  const handleSubmit = async () => {
    try {
      const result = await apiCall("/point/user/onboarding", {
        method: "PUT",
        body: JSON.stringify({
          interests: selected,
          followedClubs: selectedClubs,
        }),
      });

      if (result.success) {
        // Redirect based on user role
        if (user?.role === "admin") {
          navigate("/admin/dashboard", { replace: true });
        } else if (user?.role === "organizer") {
          navigate("/organizer/dashboard", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      } else {
        console.error("Failed to save onboarding:", result?.error);
        alert("Failed to save preferences. Please try again.");
      }
    } catch (error) {
      console.error("Error during onboarding:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleSkip = () => {
    // Redirect to dashboard without saving interests
    if (user?.role === "admin") {
      navigate("/admin/dashboard", { replace: true });
    } else if (user?.role === "organizer") {
      navigate("/organizer/dashboard", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <h1>Tell Us What You Like</h1>
        <p className="onboarding-subtitle">
          Choose your interests and clubs so we can personalize events for you.
        </p>

        <div className="onboarding-grid">
          <section>
            <h2 className="onboarding-section-title">Interests</h2>
            <p className="onboarding-section-desc">
              Pick a few that best describe what you enjoy.
            </p>
            <div className="interest-container">
              {INTERESTS.map((tag) => (
                <button
                  key={tag}
                  className={`interest-chip ${
                    selected.includes(tag) ? "active" : ""
                  }`}
                  onClick={() => toggleInterest(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="onboarding-section-title">Clubs You’re Interested In</h2>
            <p className="onboarding-section-desc">
              Follow clubs to see more of their events.
            </p>
            <div className="clubs-container">
              {clubs.length === 0 ? (
                <p className="onboarding-empty">No clubs available yet.</p>
              ) : (
                clubs.map((club) => {
                  const id = club._id?.toString();
                  const active = id && selectedClubs.includes(id);
                  return (
                    <button
                      key={club._id}
                      className={`club-chip ${active ? "active" : ""}`}
                      onClick={() => id && toggleClub(id)}
                    >
                      {club.name}
                    </button>
                  );
                })
              )}
            </div>
          </section>
        </div>

        <div className="selected-section">
          <span className="selected-label">Selected interests:</span>
          {selected.length === 0 && (
            <span className="selected-empty">None yet</span>
          )}
          {selected.map((s) => (
            <span key={s} className="selected-pill">
              {s}
            </span>
          ))}
        </div>

        <div className="onboarding-buttons">
          <button className="primary-btn" onClick={handleSubmit}>
            Continue
          </button>

          <button className="skip-btn" onClick={handleSkip}>
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
