import React, { useState, useEffect } from "react";
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
  const [newClub, setNewClub] = useState({ name: "", description: "", category: "" });
  const [newOrg, setNewOrg] = useState({ firstname: "", lastname: "", email: "", organizerName: "", category: "", description: "" });
  const [createdPassword, setCreatedPassword] = useState(null);

  useEffect(() => {
    loadData();
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
      setCreatedPassword(result.data?.loginPassword);
      await loadData();
      setShowCreateOrg(false);
      setNewOrg({ firstname: "", lastname: "", email: "", organizerName: "", category: "", description: "" });
    } else {
      alert(result?.error || "Failed to create organizer");
    }
  };

  const handleRemoveOrganizer = async (id, name) => {
    if (!window.confirm(`Archive organizer "${name}"? They will no longer be able to log in.`)) return;
    const result = await apiCall(`/point/admin/organizer/${id}/remove`, { method: "PUT" });
    if (result?.success) {
      loadData();
    } else {
      alert(result?.error || "Failed to archive organizer");
    }
  };

  const handleDeleteOrganizer = async (id, name) => {
    if (!window.confirm(`Permanently DELETE organizer "${name}"? This cannot be undone!`)) return;
    const result = await apiCall(`/point/admin/organizer/${id}`, { method: "DELETE" });
    if (result?.success) {
      loadData();
    } else {
      alert(result?.error || "Failed to delete organizer");
    }
  };

  if (loading && clubs.length === 0 && organizers.length === 0) {
    return <DashboardLayout><Loading size="large" /></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ margin: "0 0 4px 0" }}>Manage Clubs & Organizers</h1>
            <p style={{ color: "#888", margin: 0 }}>Create and manage club and organizer accounts</p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <Button variant="outline" onClick={() => setShowCreateClub(true)}>+ New Club</Button>
            <Button variant="primary" onClick={() => setShowCreateOrg(true)}>+ New Organizer</Button>
          </div>
        </div>

        {/* Show generated password after creation */}
        {createdPassword && (
          <div style={{
            background: "#1a2e1a", border: "1px solid #2a4a2a", borderRadius: "8px",
            padding: "16px 20px", marginBottom: "20px", color: "#6af16a",
          }}>
            ✅ Organizer created! Generated Password: <strong style={{ userSelect: "all", color: "#ffffff" }}>{createdPassword}</strong>
            <span style={{ color: "#888", fontSize: "12px", marginLeft: "12px" }}>Share this with the organizer and ask them to change it.</span>
            <button onClick={() => setCreatedPassword(null)} style={{ marginLeft: "16px", background: "none", border: "none", color: "#888", cursor: "pointer" }}>✕</button>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
          {["clubs", "organizers"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "8px 20px", borderRadius: "8px", cursor: "pointer",
              background: activeTab === tab ? "#6366f1" : "transparent",
              border: "1px solid var(--border-color, #2a2a4a)", color: "#fff",
              textTransform: "capitalize",
            }}>
              {tab} ({tab === "clubs" ? clubs.length : organizers.length})
            </button>
          ))}
        </div>

        {/* Clubs Tab */}
        {activeTab === "clubs" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {clubs.length === 0 ? (
              <p style={{ color: "#888", textAlign: "center", padding: "40px" }}>No clubs yet. Create one!</p>
            ) : clubs.map((club) => (
              <div key={club._id} style={{
                background: "var(--card-bg, #1a1a2e)", border: "1px solid var(--border-color, #2a2a4a)",
                borderRadius: "12px", padding: "16px 20px",
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap",
              }}>
                <div>
                  <h4 style={{ margin: "0 0 4px 0" }}>{club.name}</h4>
                  <p style={{ margin: "0 0 4px 0", color: "#888", fontSize: "13px" }}>{club.category}</p>
                  <p style={{ margin: 0, color: "#b0b0c8", fontSize: "13px" }}>{club.description}</p>
                  <p style={{ margin: "4px 0 0 0", color: "#666", fontSize: "12px" }}>
                    📅 {club.events?.length || 0} events · 👥 {club.organizers?.length || 0} organizers
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Organizers Tab */}
        {activeTab === "organizers" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {organizers.length === 0 ? (
              <p style={{ color: "#888", textAlign: "center", padding: "40px" }}>No organizers yet.</p>
            ) : organizers.map((org) => (
              <div key={org._id} style={{
                background: "var(--card-bg, #1a1a2e)", border: "1px solid var(--border-color, #2a2a4a)",
                borderRadius: "12px", padding: "16px 20px",
                display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px",
              }}>
                <div>
                  <h4 style={{ margin: "0 0 4px 0" }}>{org.organizerName || `${org.firstname || ""} ${org.lastname || ""}`.trim()}</h4>
                  <p style={{ margin: "0 0 4px 0", color: "#888", fontSize: "13px" }}>📧 {org.email}</p>
                  <p style={{ margin: "0 0 4px 0", color: "#b0b0c8", fontSize: "13px" }}>{org.category}</p>
                  {org.isArchived && <Badge variant="danger">Archived</Badge>}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <Button
                    variant="warning"
                    size="small"
                    onClick={() => handleRemoveOrganizer(org._id, org.organizerName || org.email)}
                  >
                    Archive
                  </Button>
                  <Button
                    variant="danger"
                    size="small"
                    onClick={() => handleDeleteOrganizer(org._id, org.organizerName || org.email)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Club Modal */}
        <Modal isOpen={showCreateClub} onClose={() => setShowCreateClub(false)} title="Create New Club" size="medium"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowCreateClub(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCreateClub}>Create Club</Button>
            </>
          }
        >
          <form onSubmit={handleCreateClub}>
            <Input label="Club Name *" type="text" value={newClub.name} onChange={(e) => setNewClub((p) => ({ ...p, name: e.target.value }))} required />
            <Input label="Category" type="text" value={newClub.category} onChange={(e) => setNewClub((p) => ({ ...p, category: e.target.value }))} placeholder="e.g., Technical, Cultural, Sports" />
            <Input label="Description" type="textarea" value={newClub.description} onChange={(e) => setNewClub((p) => ({ ...p, description: e.target.value }))} />
          </form>
        </Modal>

        {/* Create Organizer Modal */}
        <Modal isOpen={showCreateOrg} onClose={() => setShowCreateOrg(false)} title="Create New Organizer" size="medium"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowCreateOrg(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCreateOrganizer}>Create Organizer</Button>
            </>
          }
        >
          <p style={{ color: "#888", fontSize: "13px", marginBottom: "16px" }}>
            A random password will be auto-generated and shown to you after creation.
          </p>
          <form onSubmit={handleCreateOrganizer}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <Input label="First Name *" type="text" value={newOrg.firstname} onChange={(e) => setNewOrg((p) => ({ ...p, firstname: e.target.value }))} required />
              <Input label="Last Name *" type="text" value={newOrg.lastname} onChange={(e) => setNewOrg((p) => ({ ...p, lastname: e.target.value }))} required />
            </div>
            <Input label="Login Email *" type="email" value={newOrg.email} onChange={(e) => setNewOrg((p) => ({ ...p, email: e.target.value }))} required />
            <Input label="Organizer / Club Name" type="text" value={newOrg.organizerName} onChange={(e) => setNewOrg((p) => ({ ...p, organizerName: e.target.value }))} placeholder="e.g., Tech Club" />
            <Input label="Category" type="text" value={newOrg.category} onChange={(e) => setNewOrg((p) => ({ ...p, category: e.target.value }))} placeholder="e.g., Technical, Cultural" />
            <Input label="Description" type="textarea" value={newOrg.description} onChange={(e) => setNewOrg((p) => ({ ...p, description: e.target.value }))} />
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default ManageClubs;
