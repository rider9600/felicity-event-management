import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { participantAPI, organizerAPI } from "../../services/api";
import { AREAS_OF_INTEREST } from "../../utils/constants";
import "./Onboarding.css";

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [followedOrganizers, setFollowedOrganizers] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Load organizers when moving to step 2
  const loadOrganizers = async () => {
    try {
      const response = await organizerAPI.getAll();
      setOrganizers(response.data);
    } catch (error) {
      console.error("Error loading organizers:", error);
    }
  };

  const handleInterestToggle = (interest) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest],
    );
  };

  const handleOrganizerToggle = (organizerId) => {
    setFollowedOrganizers((prev) =>
      prev.includes(organizerId)
        ? prev.filter((id) => id !== organizerId)
        : [...prev, organizerId],
    );
  };

  const handleNext = async () => {
    if (step === 1) {
      await loadOrganizers();
      setStep(2);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    navigate("/dashboard");
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await participantAPI.updatePreferences({
        interests: selectedInterests,
        followedOrganizers: followedOrganizers,
      });
      navigate("/dashboard");
    } catch (error) {
      console.error("Error saving preferences:", error);
      // Still navigate even if preferences fail
      navigate("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <h1>Welcome to Felicity!</h1>
          <p>Let's personalize your experience</p>
          <div className="progress-bar">
            <div className={`progress-step ${step >= 1 ? "active" : ""}`}>
              1
            </div>
            <div className={`progress-line ${step >= 2 ? "active" : ""}`}></div>
            <div className={`progress-step ${step >= 2 ? "active" : ""}`}>
              2
            </div>
          </div>
        </div>

        {step === 1 && (
          <div className="onboarding-step">
            <h2>Select Your Interests</h2>
            <p className="step-description">
              Choose areas you're interested in to get personalized event
              recommendations
            </p>
            <div className="interests-grid">
              {AREAS_OF_INTEREST.map((interest) => (
                <button
                  key={interest}
                  className={`interest-chip ${
                    selectedInterests.includes(interest) ? "selected" : ""
                  }`}
                  onClick={() => handleInterestToggle(interest)}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-step">
            <h2>Follow Clubs & Organizers</h2>
            <p className="step-description">
              Follow organizers to stay updated about their events
            </p>
            <div className="organizers-list">
              {organizers.map((org) => (
                <div key={org._id} className="organizer-card">
                  <div className="organizer-info">
                    <h3>{org.name}</h3>
                    <p>{org.category}</p>
                    <small>{org.description}</small>
                  </div>
                  <button
                    className={`follow-btn ${
                      followedOrganizers.includes(org._id) ? "following" : ""
                    }`}
                    onClick={() => handleOrganizerToggle(org._id)}
                  >
                    {followedOrganizers.includes(org._id)
                      ? "Following"
                      : "Follow"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="onboarding-actions">
          <button onClick={handleSkip} className="btn-secondary">
            Skip for now
          </button>
          <button
            onClick={handleNext}
            className="btn-primary"
            disabled={loading}
          >
            {loading ? "Saving..." : step === 2 ? "Complete" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
