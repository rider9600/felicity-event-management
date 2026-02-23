import { useState } from "react";
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

  const handleSubmit = async () => {
    try {
      const result = await apiCall("/point/user/onboarding", {
        method: "PUT",
        body: JSON.stringify({ interests: selected }),
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
        <h1>Choose Your Interests</h1>

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

        <div className="selected-section">
          <span className="selected-label">Selected:</span>
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
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
