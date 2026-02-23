import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import DashboardLayout from "../components/layout/DashboardLayout";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Badge from "../components/common/Badge";
import Modal from "../components/common/Modal";
import Loading from "../components/common/Loading";
import "./ManageUsers.css";

const ManageUsers = () => {
  const { user } = useAuth();
  const { apiCall, loading } = useApi();

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [newUser, setNewUser] = useState({
    firstname: "",
    lastname: "",
    email: "",
    organizerName: "",
    category: "",
    description: "",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);
  const loadUsers = async () => {
    try {
      const result = await apiCall("/point/admin/users");
      console.log("API RESULT 👉", result);

      // 🔥 NOW result.data IS DIRECTLY THE ARRAY
      if (result?.success && Array.isArray(result.data)) {
        setUsers(result.data);
      } else {
        console.error("Unexpected API format:", result);
        setUsers([]);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
      setUsers([]);
    }
  };

  const filterUsers = () => {
    let filtered = users || [];

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          (user?.firstname || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (user?.lastname || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (user?.email || "").toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user?.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    try {
      const result = await apiCall("/point/admin/create-organizer", {
        method: "POST",
        body: JSON.stringify(newUser),
      });
      if (result.success) {
        // Backend auto-generates a password — show it to admin
        const autoPassword = result.data?.loginPassword;
        setUsers((prev) => [...prev, result.data.organizer]);
        setNewUser({
          firstname: "",
          lastname: "",
          email: "",
          organizerName: "",
          category: "",
          description: "",
        });
        setShowCreateModal(false);
        alert(`Organizer created!\nAuto-generated password: ${autoPassword}\n\nShare this with the organizer and ask them to change it.`);
      } else {
        alert(result.error || "Failed to create organizer");
      }
    } catch (error) {
      console.error("Failed to create organizer:", error);
      alert("Failed to create organizer");
    }
  };

  const handleUserAction = async (action, userId) => {
    try {
      const result = await apiCall(`/point/admin/users/${userId}/${action}`, {
        method: "PUT",
      });

      if (result.success) {
        // Refresh users list
        loadUsers();
      } else {
        alert(result.error || `Failed to ${action} user`);
      }
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
      alert(`Failed to ${action} user`);
    }
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case "admin":
        return "danger";
      case "organizer":
        return "primary";
      case "participant":
        return "success";
      default:
        return "secondary";
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "active":
        return "success";
      case "suspended":
        return "warning";
      case "inactive":
        return "secondary";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Loading size="large" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="manage-users">
        <div className="page-header">
          <div className="header-content">
            <h1>Manage Organizers</h1>
            <p>Manage platform organizers and create new organizer accounts</p>
          </div>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            Create New Organizer
          </Button>
        </div>

        <div className="filters-section">
          <div className="search-filter">
            <Input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="role-filter">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admins</option>
              <option value="organizer">Organizers</option>
              <option value="participant">Participants</option>
            </select>
          </div>
        </div>

        <div className="users-table">
          <div className="table-header">
            <div className="table-row">
              <div className="table-cell">User</div>
              <div className="table-cell">Email</div>
              <div className="table-cell">Role</div>
              <div className="table-cell">Type</div>
              <div className="table-cell">Status</div>
              <div className="table-cell">Joined</div>
              <div className="table-cell">Actions</div>
            </div>
          </div>

          <div className="table-body">
            {filteredUsers && filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div key={user._id} className="table-row">
                  <div className="table-cell">
                    <div className="user-info">
                      <div className="user-avatar">
                        {(user?.firstname || "U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="user-name">
                          {user?.firstname || ""} {user?.lastname || ""}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="table-cell">
                    <Badge variant="info">{user?.email || "N/A"}</Badge>
                  </div>

                  <div className="table-cell">
                    <Badge
                      variant={getRoleBadgeVariant(user?.role || "participant")}
                    >
                      {user?.role || "participant"}
                    </Badge>
                  </div>

                  <div className="table-cell">
                    <Badge
                      variant={
                        (user?.participantType || "non-iiit") === "iiit"
                          ? "info"
                          : "secondary"
                      }
                    >
                      {user?.participantType || "non-iiit"}
                    </Badge>
                  </div>

                  <div className="table-cell">
                    <Badge
                      variant={getStatusBadgeVariant(user?.status || "active")}
                    >
                      {user?.status || "active"}
                    </Badge>
                  </div>

                  <div className="table-cell">
                    <Badge variant="secondary">
                      {user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "N/A"}
                    </Badge>
                  </div>

                  <div className="table-cell">
                    <div className="action-buttons">
                      <Button
                        variant="outline"
                        size="small"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowDetailsModal(true);
                        }}
                      >
                        View
                      </Button>

                      {user?.role !== "admin" &&
                        (user?.status || "active") === "active" && (
                          <Button
                            variant="warning"
                            size="small"
                            onClick={() =>
                              handleUserAction("suspend", user._id)
                            }
                          >
                            Suspend
                          </Button>
                        )}

                      {(user?.status || "active") === "suspended" && (
                        <Button
                          variant="success"
                          size="small"
                          onClick={() => handleUserAction("activate", user._id)}
                        >
                          Activate
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div
                className="empty-state"
                style={{
                  gridColumn: "1 / -1",
                  textAlign: "center",
                  padding: "2rem",
                }}
              >
                <p>No users found.</p>
              </div>
            )}
          </div>
        </div>

        {filteredUsers && filteredUsers.length === 0 && users.length > 0 && (
          <div className="empty-state">
            <p>No users found matching your criteria.</p>
          </div>
        )}

        {/* Create User Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Organizer"
          size="medium"
        >
          <form onSubmit={handleCreateUser} className="create-user-form">
            <div className="form-row">
              <Input
                label="First Name"
                type="text"
                value={newUser.firstname}
                onChange={(e) =>
                  setNewUser((prev) => ({ ...prev, firstname: e.target.value }))
                }
                required
              />

              <Input
                label="Last Name"
                type="text"
                value={newUser.lastname}
                onChange={(e) =>
                  setNewUser((prev) => ({ ...prev, lastname: e.target.value }))
                }
                required
              />
            </div>

            <Input
              label="Email"
              type="email"
              value={newUser.email}
              onChange={(e) =>
                setNewUser((prev) => ({ ...prev, email: e.target.value }))
              }
              required
            />


            <div className="form-row">
              <Input
                label="Organizer Name"
                type="text"
                value={newUser.organizerName}
                onChange={(e) =>
                  setNewUser((prev) => ({
                    ...prev,
                    organizerName: e.target.value,
                  }))
                }
                placeholder="e.g., Tech Club, Music Society"
                required
              />

              <Input
                label="Category"
                type="text"
                value={newUser.category}
                onChange={(e) =>
                  setNewUser((prev) => ({ ...prev, category: e.target.value }))
                }
                placeholder="e.g., Technical, Cultural, Sports"
                required
              />
            </div>

            <Input
              label="Description"
              type="textarea"
              value={newUser.description}
              onChange={(e) =>
                setNewUser((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Brief description of the organizer..."
              rows={3}
            />

            <div className="modal-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Create Organizer
              </Button>
            </div>
          </form>
        </Modal>

        {/* User Details Modal */}
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title="User Details"
          size="medium"
        >
          {selectedUser && (
            <div className="user-details">
              <div className="detail-section">
                <h3>Basic Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Name:</label>
                    <span>
                      {selectedUser?.firstname || ""}{" "}
                      {selectedUser?.lastname || ""}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Email:</label>
                    <span>{selectedUser?.email || "N/A"}</span>
                  </div>
                  <div className="detail-item">
                    <label>Role:</label>
                    <Badge
                      variant={getRoleBadgeVariant(
                        selectedUser?.role || "participant",
                      )}
                    >
                      {selectedUser?.role || "participant"}
                    </Badge>
                  </div>
                  <div className="detail-item">
                    <label>Type:</label>
                    <Badge
                      variant={
                        (selectedUser?.participantType || "non-iiit") === "iiit"
                          ? "info"
                          : "secondary"
                      }
                    >
                      {selectedUser?.participantType || "non-iiit"}
                    </Badge>
                  </div>
                  <div className="detail-item">
                    <label>Status:</label>
                    <Badge
                      variant={getStatusBadgeVariant(
                        selectedUser?.status || "active",
                      )}
                    >
                      {selectedUser?.status || "active"}
                    </Badge>
                  </div>
                  <div className="detail-item">
                    <label>Joined:</label>
                    <span>
                      {selectedUser?.createdAt
                        ? new Date(selectedUser.createdAt).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default ManageUsers;
