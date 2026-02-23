import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import PageContainer from "../components/layout/PageContainer";
import DashboardLayout from "../components/layout/DashboardLayout";
import Card from "../components/Card";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Badge from "../components/common/Badge";
import Modal from "../components/common/Modal";
import Loading from "../components/common/Loading";
import "./Profile.css";

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { apiCall, loading } = useApi();
  const [profileData, setProfileData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    contactNumber: "",
    college: "",
    interests: [],
    followedClubs: [],
  });

  const [preferences, setPreferences] = useState({
    interests: [],
    followedClubs: [],
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [activeTab, setActiveTab] = useState("profile");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        firstname: user.firstname || "",
        lastname: user.lastname || "",
        email: user.email || "",
        contactNumber: user.contactNumber || "",
        college: user.college || "",
        interests: user.interests || [],
        followedClubs: user.followedClubs || [],
      });
    }
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    try {
      const result = await apiCall("/point/preferences/get");
      if (result.success) {
        setPreferences(result.data);
      }
    } catch (error) {
      console.error("Failed to load preferences:", error);
    }
  };

  const handleProfileUpdate = async (e) => 
  {
    e.preventDefault();
    setUpdateLoading(true);
    try {
      const result = await apiCall("/point/participant/profile", 
      {
        method: "PUT",
        body: JSON.stringify(profileData),
      });
      if (result.success) 
      {
        updateUser(result.data.participant);
        alert("Profile updated successfully!");
      } else {
        alert(result.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to update profile");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    setUpdateLoading(true);

    try {
      const result = await apiCall("/point/preferences/set", {
        method: "POST",
        body: JSON.stringify(preferences),
      });

      if (result.success) {
        alert("Preferences updated successfully!");
      } else {
        alert(result.error || "Failed to update preferences");
      }
    } catch (error) {
      console.error("Failed to update preferences:", error);
      alert("Failed to update preferences");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setUpdateLoading(true);

    try {
      const result = await apiCall("/point/password/change", {
        method: "POST",
        body: JSON.stringify({
          oldPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (result.success || result.msg === "Password changed successfully") {
        setShowPasswordModal(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        alert("Password changed successfully!");
      } else {
        alert(result.error || result.msg || "Failed to change password");
      }
    } catch (error) {
      console.error("Failed to change password:", error);
      alert("Failed to change password");
    } finally {
      setUpdateLoading(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile Information", icon: "👤" },
    { id: "preferences", label: "Preferences", icon: "⚙️" },
    { id: "security", label: "Security", icon: "🔒" },
  ];

  if (loading) {
    return (
      <PageContainer>
        <Loading size="large" />
      </PageContainer>
    );
  }

  const renderProfileForm = () => (
    <Card className="profile-form-card">
      <h3 className="section-title">Personal Information</h3>

      <form onSubmit={handleProfileUpdate} className="profile-form">
        <div className="form-row">
          <Input
            label="First Name"
            type="text"
            value={profileData.firstname}
            onChange={(e) =>
              setProfileData((prev) => ({
                ...prev,
                firstname: e.target.value,
              }))
            }
            required
          />

          <Input
            label="Last Name"
            type="text"
            value={profileData.lastname}
            onChange={(e) =>
              setProfileData((prev) => ({
                ...prev,
                lastname: e.target.value,
              }))
            }
            required
          />
        </div>

        <div className="form-row">
          <Input
            label="Email"
            type="email"
            value={profileData.email}
            onChange={(e) =>
              setProfileData((prev) => ({
                ...prev,
                email: e.target.value,
              }))
            }
            required
            disabled // Usually email can't be changed
          />

          <Input
            label="Contact Number"
            type="tel"
            value={profileData.contactNumber}
            onChange={(e) =>
              setProfileData((prev) => ({
                ...prev,
                contactNumber: e.target.value,
              }))
            }
          />
        </div>

        <div className="form-row">
          <Input
            label="College Name"
            type="text"
            value={user?.participantType === "iiit" ? "IIITH" : profileData.college}
            onChange={(e) =>
              setProfileData((prev) => ({
                ...prev,
                college: e.target.value,
              }))
            }
            disabled={user?.participantType === "iiit"}
          />
        </div>

        <div className="form-row">
          <div className="input-group">
            <label>Participant Type</label>
            <input
              type="text"
              value={user?.participantType === "iiit" ? "IIIT Student" : user?.participantType === "non-iiit" ? "Non-IIIT Participant" : (user?.participantType || "-")}
              disabled
              className="form-input"
              style={{ cursor: "not-allowed", opacity: 0.7 }}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="input-group">
            <label>Interests (comma-separated)</label>
            <input
              type="text"
              value={profileData.interests.join(", ")}
              onChange={(e) =>
                setProfileData((prev) => ({
                  ...prev,
                  interests: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter((s) => s),
                }))
              }
              placeholder="e.g., music, coding, sports"
              className="form-input"
            />
          </div>
        </div>

        <div className="form-actions">
          <Button type="submit" variant="primary" disabled={updateLoading}>
            {updateLoading ? "Updating..." : "Update Profile"}
          </Button>
        </div>
      </form>
    </Card>
  );

  const renderPreferences = () => (
    <Card className="preferences-card">
      <h3 className="section-title">Preferences & Interests</h3>

      <div className="preferences-form">
        <div className="preference-section">
          <h4>Interests</h4>
          <p>Manage your interests to get better event recommendations</p>

          <div className="input-group">
            <label>Your Interests (comma-separated)</label>
            <input
              type="text"
              value={preferences.interests?.join(", ") || ""}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  interests: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter((s) => s),
                }))
              }
              placeholder="e.g., music, technology, sports, art"
              className="form-input"
            />
          </div>
        </div>

        <div className="form-actions">
          <Button
            variant="primary"
            onClick={handlePreferencesUpdate}
            disabled={updateLoading}
          >
            {updateLoading ? "Updating..." : "Save Preferences"}
          </Button>
        </div>
      </div>
    </Card>
  );

  const renderSecurity = () => (
    <Card className="security-card">
      <h3 className="section-title">Security Settings</h3>

      <div className="security-section">
        <div className="security-item">
          <div className="security-info">
            <h4>Password</h4>
            <p>Last changed: Never</p>
          </div>
          <Button variant="outline" onClick={() => setShowPasswordModal(true)}>
            Change Password
          </Button>
        </div>

        <div className="security-item">
          <div className="security-info">
            <h4>Account Status</h4>
            <div className="status-badges">
              <Badge variant="success">Verified</Badge>
              <Badge variant="primary">{user?.role}</Badge>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return renderProfileForm();
      case "preferences":
        return renderPreferences();
      case "security":
        return renderSecurity();
      default:
        return renderProfileForm();
    }
  };

  return (
    <DashboardLayout>
      <div className="profile-page">
        <div className="profile-header">
          <h1>Profile Settings</h1>
          <p>Manage your account information and preferences</p>
        </div>

        <div className="profile-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="profile-content">{renderTabContent()}</div>

        {/* Password Change Modal */}
        <Modal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          title="Change Password"
          size="medium"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setShowPasswordModal(false)}
                disabled={updateLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handlePasswordChange}
                disabled={
                  updateLoading ||
                  !passwordData.currentPassword ||
                  !passwordData.newPassword ||
                  passwordData.newPassword !== passwordData.confirmPassword
                }
              >
                {updateLoading ? "Changing..." : "Change Password"}
              </Button>
            </>
          }
        >
          <div className="password-form">
            <Input
              label="Current Password"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData((prev) => ({
                  ...prev,
                  currentPassword: e.target.value,
                }))
              }
              required
            />

            <Input
              label="New Password"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData((prev) => ({
                  ...prev,
                  newPassword: e.target.value,
                }))
              }
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData((prev) => ({
                  ...prev,
                  confirmPassword: e.target.value,
                }))
              }
              required
              error={
                passwordData.confirmPassword &&
                passwordData.newPassword !== passwordData.confirmPassword
                  ? "Passwords do not match"
                  : ""
              }
            />
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
