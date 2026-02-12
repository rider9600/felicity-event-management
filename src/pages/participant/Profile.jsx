import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { authAPI, participantAPI, organizerAPI } from "../../services/api";
import { AREAS_OF_INTEREST } from "../../utils/constants";
import { isValidPhone } from "../../utils/validators";
import LoadingSpinner from "../../components/LoadingSpinner";
import "./Profile.css";

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    organizerName: "",
    contactNumber: "",
    collegeOrg: "",
    interests: [],
    followedOrganizers: [],
  });
  const [organizers, setOrganizers] = useState([]);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchProfile();
    // Only participants need the organizers list for following
    if (user?.role === "participant") {
      fetchOrganizers();
    }
  }, [user?.role]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getProfile();
      const profile = response.data;
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        organizerName: profile.organizerName || "",
        contactNumber: profile.contactNumber || "",
        collegeOrg: profile.collegeOrg || "",
        interests: profile.interests || [],
        followedOrganizers: profile.followedOrganizers || [],
      });
    } catch (err) {
      setMessage({ type: "error", text: "Failed to load profile" });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizers = async () => {
    try {
      // Guard: only participants should call the participant organizers API
      if (user?.role !== "participant") return;

      const response = await organizerAPI.getAll();
      setOrganizers(response.data);
    } catch (err) {
      console.error("Failed to load organizers:", err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleInterestToggle = (interest) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleOrganizerToggle = (organizerId) => {
    setFormData((prev) => ({
      ...prev,
      followedOrganizers: prev.followedOrganizers.includes(organizerId)
        ? prev.followedOrganizers.filter((id) => id !== organizerId)
        : [...prev.followedOrganizers, organizerId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.contactNumber && !isValidPhone(formData.contactNumber)) {
      setMessage({
        type: "error",
        text: "Please enter a valid 10-digit phone number",
      });
      return;
    }

    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      // Map organizerName -> name for organizer API compatibility
      const payload = { ...formData };
      if (user?.role === "organizer") {
        payload.name = formData.organizerName;
      }

      await authAPI.updateProfile(payload);
      updateUser(payload);
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to update profile",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({
        type: "error",
        text: "New password must be at least 6 characters",
      });
      return;
    }

    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setMessage({ type: "success", text: "Password changed successfully!" });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordForm(false);
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to change password",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading profile..." />;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      <div className="profile-card">
        <section className="profile-section">
          <h2>Personal Information</h2>
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name *</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Last Name *</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {user?.role === "organizer" && (
              <div className="form-group">
                <label htmlFor="organizerName">Organizer / Club Name</label>
                <input
                  type="text"
                  id="organizerName"
                  name="organizerName"
                  value={formData.organizerName}
                  onChange={handleChange}
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={user?.email || ""}
                disabled
                className="input-disabled"
              />
              <small className="form-help">Email cannot be changed</small>
            </div>

            <div className="form-group">
              <label htmlFor="participantType">Participant Type</label>
              <input
                type="text"
                id="participantType"
                value={user?.participantType || ""}
                disabled
                className="input-disabled capitalize"
              />
              <small className="form-help">
                Participant type cannot be changed
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="collegeOrg">College / Organization</label>
              <input
                type="text"
                id="collegeOrg"
                name="collegeOrg"
                value={formData.collegeOrg}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="contactNumber">Contact Number</label>
              <input
                type="tel"
                id="contactNumber"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                placeholder="10-digit mobile number"
              />
            </div>

            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </section>

        <section className="profile-section">
          <h2>Areas of Interest</h2>
          <div className="interests-grid">
            {AREAS_OF_INTEREST.map((interest) => (
              <button
                key={interest}
                type="button"
                className={`interest-chip ${
                  formData.interests.includes(interest) ? "selected" : ""
                }`}
                onClick={() => handleInterestToggle(interest)}
              >
                {interest}
              </button>
            ))}
          </div>
        </section>

        <section className="profile-section">
          {user?.role === "participant" && (
            <>
              <h2>Followed Clubs & Organizers</h2>
              <div className="organizers-list">
                {organizers.map((org) => {
                  const displayName =
                    org.organizerName || org.name || "Unknown Organizer";

                  return (
                    <div key={org._id} className="organizer-item">
                      <div>
                        <h4>{displayName}</h4>
                        <p>{org.category}</p>
                      </div>
                      <button
                        type="button"
                        className={`follow-btn ${
                          formData.followedOrganizers.includes(org._id)
                            ? "following"
                            : ""
                        }`}
                        onClick={() => handleOrganizerToggle(org._id)}
                      >
                        {formData.followedOrganizers.includes(org._id)
                          ? "Following"
                          : "Follow"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>

        <section className="profile-section">
          <h2>Security Settings</h2>
          {!showPasswordForm ? (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="btn-secondary"
            >
              Change Password
            </button>
          ) : (
            <form onSubmit={handlePasswordChange} className="password-form">
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordData({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Changing..." : "Change Password"}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
};

export default Profile;
