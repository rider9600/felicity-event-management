import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import DashboardLayout from "../components/layout/DashboardLayout";
import Card from "../components/Card";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Loading from "../components/common/Loading";
import "./Profile.css";

const OrganizerProfile = () => {
  const { user, updateUser } = useAuth();
  const { apiCall, loading } = useApi();

  const [organizerData, setOrganizerData] = useState({
    organizerName: "",
    category: "",
    description: "",
    contactEmail: "",
    contactNumber: "",
    discordWebhook: "",
    loginEmail: "",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadOrganizerProfile();
  }, []);

  const loadOrganizerProfile = async () => {
    try {
      const result = await apiCall("/point/organizer/profile");
      if (!result) return;

      const data = result.data || result;
      setOrganizerData({
        organizerName:
          data.organizerName ||
          data.firstname ||
          `${data.firstname || ""} ${data.lastname || ""}`.trim(),
        category: data.category || "",
        description: data.description || "",
        contactEmail: data.contactEmail || data.email || "",
        contactNumber: data.contactNumber || "",
        discordWebhook: data.discordWebhook || "",
        loginEmail: data.email || "",
      });
    } catch (error) {
      console.error("Failed to load organizer profile:", error);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        organizerName: organizerData.organizerName,
        category: organizerData.category,
        description: organizerData.description,
        contactEmail: organizerData.contactEmail,
        contactNumber: organizerData.contactNumber,
        discordWebhook: organizerData.discordWebhook,
      };

      const result = await apiCall("/point/organizer/profile", {
        method: "PUT",
        body: JSON.stringify(body),
      });

      if (result?.organizer || result?.data?.organizer) {
        const updated = result.organizer || result.data.organizer;
        updateUser(updated);
      }

      alert("Organizer profile updated successfully!");
    } catch (error) {
      console.error("Failed to update organizer profile:", error);
      alert("Failed to update organizer profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !user) {
    return (
      <DashboardLayout>
        <Loading size="large" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="profile-page">
        <div className="profile-header">
          <h1>Organizer Profile</h1>
          <p>Manage how your club / organizing team appears on Felicity.</p>
        </div>

        <Card className="profile-form-card">
          <h3 className="section-title">Organizer Information</h3>

          <form className="profile-form" onSubmit={handleSave}>
            <div className="form-row">
              <Input
                label="Organizer / Club Name"
                type="text"
                value={organizerData.organizerName}
                onChange={(e) =>
                  setOrganizerData((prev) => ({
                    ...prev,
                    organizerName: e.target.value,
                  }))
                }
                required
              />

              <Input
                label="Category"
                type="text"
                value={organizerData.category}
                onChange={(e) =>
                  setOrganizerData((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
                placeholder="e.g., Technical Club, Cultural Team"
              />
            </div>

            <div className="form-row">
              <div className="input-group">
                <label>Description</label>
                <textarea
                  className="form-input"
                  rows={4}
                  value={organizerData.description}
                  onChange={(e) =>
                    setOrganizerData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Tell participants about your club or organizing team."
                />
              </div>
            </div>

            <div className="form-row">
              <Input
                label="Login Email"
                type="email"
                value={organizerData.loginEmail}
                disabled
              />

              <Input
                label="Public Contact Email"
                type="email"
                value={organizerData.contactEmail}
                onChange={(e) =>
                  setOrganizerData((prev) => ({
                    ...prev,
                    contactEmail: e.target.value,
                  }))
                }
                placeholder="Email shown to participants"
              />
            </div>

            <div className="form-row">
              <Input
                label="Contact Number"
                type="tel"
                value={organizerData.contactNumber}
                onChange={(e) =>
                  setOrganizerData((prev) => ({
                    ...prev,
                    contactNumber: e.target.value,
                  }))
                }
                placeholder="Phone number shown to participants"
              />

              <Input
                label="Discord Webhook URL"
                type="text"
                value={organizerData.discordWebhook}
                onChange={(e) =>
                  setOrganizerData((prev) => ({
                    ...prev,
                    discordWebhook: e.target.value,
                  }))
                }
                placeholder="https://discord.com/api/webhooks/..."
              />
            </div>

            <div className="form-actions">
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? "Saving..." : "Save Organizer Profile"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default OrganizerProfile;

