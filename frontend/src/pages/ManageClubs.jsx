import React, { useEffect, useState } from "react";
import { useApi } from "../hooks/useApi";
import DashboardLayout from "../components/layout/DashboardLayout";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import Modal from "../components/common/Modal";
import Input from "../components/common/Input";
import Loading from "../components/common/Loading";

const ManageClubs = () => {
  const { apiCall, loading } = useApi();

  const [clubs, setClubs] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [activeTab, setActiveTab] = useState("clubs");
  const [showCreateClub, setShowCreateClub] = useState(false);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);

  const [newClub, setNewClub] = useState({
    name: "",
    description: "",
    category: "",
  });

  const [newOrg, setNewOrg] = useState({
    firstname: "",
    lastname: "",
    organizerName: "",
    category: "",
    description: "",
  });

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    const [clubsRes, orgsRes] = await Promise.all([
      apiCall("/point/clubs"),
      apiCall("/point/admin-dashboard/organizers"),
    ]);

    const clubsArr = clubsRes?.data || (Array.isArray(clubsRes) ? clubsRes : []);
    const orgsArr = orgsRes?.data || (Array.isArray(orgsRes) ? orgsRes : []);

    setClubs(clubsArr);
    setOrganizers(orgsArr);
  };

  const handleCreateClub = async (e) => {
    e.preventDefault();

    const result = await apiCall("/point/clubs", {
      method: "POST",
      body: JSON.stringify(newClub),
    });

    if (result?.success || result?._id) {
      await loadData();
      setShowCreateClub(false);
      setNewClub({ name: "", description: "", category: "" });
    } else {
      // eslint-disable-next-line no-alert
      alert(result?.error || "Failed to create club");
    }
  };

  const handleCreateOrganizer = async (e) => {
    e.preventDefault();

    const result = await apiCall("/point/admin/create-organizer", {
      method: "POST",
      body: JSON.stringify(newOrg),
    });

    if (result?.success) {
      setCreatedCredentials({
        email: result.data?.loginEmail || result.data?.organizer?.email,
        password: result.data?.loginPassword,
      });

      await loadData();
      setShowCreateOrg(false);
      setNewOrg({
        firstname: "",
        lastname: "",
        organizerName: "",
        category: "",
        description: "",
      });
    } else {
      // eslint-disable-next-line no-alert
      alert(result?.error || "Failed to create organizer");
    }
  };

  const handleRemoveOrganizer = async (id, name) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Archive organizer "${name}"? They will no longer be able to log in.`)) return;

    const result = await apiCall(`/point/admin/organizer/${id}/remove`, {
      method: "PUT",
    });

    if (result?.success) {
      loadData();
    } else {
      // eslint-disable-next-line no-alert
      alert(result?.error || "Failed to archive organizer");
    }
  };

  const handleDeleteOrganizer = async (id, name) => {
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm(
      `Permanently DELETE organizer "${name}"?\n\nThis will also delete ALL events created by this organizer. This cannot be undone!`,
    );
    if (!confirmed) return;

    const result = await apiCall(`/point/admin/organizer/${id}`, {
      method: "DELETE",
    });

    if (result?.success) {
      loadData();
    } else {
      // eslint-disable-next-line no-alert
      alert(result?.error || "Failed to delete organizer");
    }
  };

  const handleActivateOrganizer = async (id, name) => {
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm(
      `Activate organizer "${name}"?\n\nThey will be able to log in again.`,
    );
    if (!confirmed) return;

    const result = await apiCall(`/point/admin/users/${id}/activate`, {
      method: "PUT",
    });

    if (result?.success) {
      loadData();
    } else {
      // eslint-disable-next-line no-alert
      alert(result?.error || "Failed to activate organizer");
    }
  };

  if (loading && clubs.length === 0 && organizers.length === 0) {
    return (
      <DashboardLayout>
        <Loading size="large" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ padding: "24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <h1 style={{ margin: "0 0 4px 0" }}>Manage Clubs &amp; Organizers</h1>
            <p style={{ color: "#888", margin: 0 }}>
              Create and manage club and organizer accounts
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <Button variant="outline" onClick={() => setShowCreateClub(true)}>
              + New Club
            </Button>
            <Button variant="primary" onClick={() => setShowCreateOrg(true)}>
              + New Organizer
            </Button>
          </div>
        </div>

        {createdCredentials && (
          <div
            style={{
              background: "var(--success-banner-bg, #052e16)",
              border: "1px solid var(--success-banner-border, #16a34a)",
              borderRadius: "8px",
              padding: "16px 20px",
              marginBottom: "20px",
              color: "var(--success-banner-text, #bbf7d0)",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>✅ Organizer created!</span>
            <span>
              Login Email:{" "}
              <strong style={{ userSelect: "all", color: "#ffffff" }}>
                {createdCredentials.email}
              </strong>
            </span>
            <span>
              Password:{" "}
              <strong style={{ userSelect: "all", color: "#ffffff" }}>
                {createdCredentials.password}
              </strong>
            </span>
            <span style={{ fontSize: "12px", color: "#9ca3af" }}>
              Share these credentials with the organizer and ask them to change
              the password after first login.
            </span>
            <button
              type="button"
              onClick={() => setCreatedCredentials(null)}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                color: "#9ca3af",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
          {["clubs", "organizers"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 20px",
                borderRadius: "8px",
                cursor: "pointer",
                background:
                  activeTab === tab
                    ? "var(--prime-primary, #236af2)"
                    : "transparent",
                border: "1px solid var(--border-color, #2a2a4a)",
                color: "#ffffff",
                textTransform: "capitalize",
              }}
            >
              {tab} ({tab === "clubs" ? clubs.length : organizers.length})
            </button>
          ))}
        </div>

        {/* Clubs Tab */}
        {activeTab === "clubs" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {clubs.length === 0 ? (
              <p
                style={{
                  color: "#888",
                  textAlign: "center",
                  padding: "40px",
                }}
              >
                No clubs yet. Create one!
              </p>
            ) : (
              clubs.map((club) => (
                <div
                  key={club._id}
                  style={{
                    background: "var(--card-bg, #111827)",
                    border: "1px solid var(--border-color, #1f2937)",
                    borderRadius: "12px",
                    padding: "16px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <h4 style={{ margin: "0 0 4px 0" }}>{club.name}</h4>
                    <p
                      style={{
                        margin: "0 0 4px 0",
                        color: "#9ca3af",
                        fontSize: "13px",
                      }}
                    >
                      {club.category}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        color: "#d1d5db",
                        fontSize: "13px",
                      }}
                    >
                      {club.description}
                    </p>
                    <p
                      style={{
                        margin: "4px 0 0 0",
                        color: "#6b7280",
                        fontSize: "12px",
                      }}
                    >
                      📅 {club.events?.length || 0} events · 👥{" "}
                      {club.organizers?.length || 0} organizers
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Organizers Tab */}
        {activeTab === "organizers" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {organizers.length === 0 ? (
              <p
                style={{
                  color: "#888",
                  textAlign: "center",
                  padding: "40px",
                }}
              >
                No organizers yet.
              </p>
            ) : (
              organizers.map((org) => (
                <div
                  key={org._id}
                  style={{
                    background: "var(--card-bg, #111827)",
                    border: "1px solid var(--border-color, #1f2937)",
                    borderRadius: "12px",
                    padding: "16px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div>
                    <h4 style={{ margin: "0 0 4px 0" }}>
                      {org.organizerName ||
                        `${org.firstname || ""} ${org.lastname || ""}`.trim()}
                    </h4>
                    <p
                      style={{
                        margin: "0 0 4px 0",
                        color: "#9ca3af",
                        fontSize: "13px",
                      }}
                    >
                      📧 {org.email}
                    </p>
                    <p
                      style={{
                        margin: "0 0 4px 0",
                        color: "#d1d5db",
                        fontSize: "13px",
                      }}
                    >
                      {org.category}
                    </p>
                    {org.isArchived && <Badge variant="danger">Archived</Badge>}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {org.isArchived ? (
                      <Button
                        variant="success"
                        size="small"
                        onClick={() =>
                          handleActivateOrganizer(
                            org._id,
                            org.organizerName || org.email,
                          )
                        }
                      >
                        Activate
                      </Button>
                    ) : (
                      <Button
                        variant="warning"
                        size="small"
                        onClick={() =>
                          handleRemoveOrganizer(
                            org._id,
                            org.organizerName || org.email,
                          )
                        }
                      >
                        Archive
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="small"
                      onClick={() =>
                        handleDeleteOrganizer(
                          org._id,
                          org.organizerName || org.email,
                        )
                      }
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Create Club Modal */}
        <Modal
          isOpen={showCreateClub}
          onClose={() => setShowCreateClub(false)}
          title="Create New Club"
          size="medium"
          footer={(
            <>
              <Button
                variant="secondary"
                onClick={() => setShowCreateClub(false)}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCreateClub}>
                Create Club
              </Button>
            </>
          )}
        >
          <form onSubmit={handleCreateClub}>
            <Input
              label="Club Name *"
              type="text"
              value={newClub.name}
              onChange={(e) =>
                setNewClub((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
            <Input
              label="Category"
              type="text"
              value={newClub.category}
              onChange={(e) =>
                setNewClub((prev) => ({ ...prev, category: e.target.value }))}
              placeholder="e.g., Technical, Cultural, Sports"
            />
            <Input
              label="Description"
              type="textarea"
              value={newClub.description}
              onChange={(e) =>
                setNewClub((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))}
            />
          </form>
        </Modal>

        {/* Create Organizer Modal */}
        <Modal
          isOpen={showCreateOrg}
          onClose={() => setShowCreateOrg(false)}
          title="Create New Organizer"
          size="medium"
          footer={(
            <>
              <Button
                variant="secondary"
                onClick={() => setShowCreateOrg(false)}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCreateOrganizer}>
                Create Organizer
              </Button>
            </>
          )}
        >
          <p
            style={{
              color: "#888",
              fontSize: "13px",
              marginBottom: "16px",
            }}
          >
            Login email and a random password will be auto-generated and shown
            to you after creation. Share these credentials with the organizer.
          </p>
          <form onSubmit={handleCreateOrganizer}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <Input
                label="First Name *"
                type="text"
                value={newOrg.firstname}
                onChange={(e) =>
                  setNewOrg((prev) => ({
                    ...prev,
                    firstname: e.target.value,
                  }))}
                required
              />
              <Input
                label="Last Name *"
                type="text"
                value={newOrg.lastname}
                onChange={(e) =>
                  setNewOrg((prev) => ({
                    ...prev,
                    lastname: e.target.value,
                  }))}
                required
              />
            </div>
            <Input
              label="Organizer / Club Name"
              type="text"
              value={newOrg.organizerName}
              onChange={(e) =>
                setNewOrg((prev) => ({
                  ...prev,
                  organizerName: e.target.value,
                }))}
              placeholder="e.g., Tech Club"
            />
            <Input
              label="Category"
              type="text"
              value={newOrg.category}
              onChange={(e) =>
                setNewOrg((prev) => ({
                  ...prev,
                  category: e.target.value,
                }))}
              placeholder="e.g., Technical, Cultural"
            />
            <Input
              label="Description"
              type="textarea"
              value={newOrg.description}
              onChange={(e) =>
                setNewOrg((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))}
            />
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default ManageClubs;
