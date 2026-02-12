import { useState, useEffect } from "react";
import { adminAPI } from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [organizers, setOrganizers] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [newCredentials, setNewCredentials] = useState(null);
  const [credentialsMode, setCredentialsMode] = useState("create"); // 'create' | 'reset'
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  const generateTempPassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };
  useEffect(() => {
    fetchOrganizers();
  }, []);

  const fetchOrganizers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getOrganizers();
      setOrganizers(response.data);
    } catch (err) {
      setError("Failed to load organizers");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      const response = await adminAPI.createOrganizer(formData);

      // Show credentials modal
      setCredentialsMode("create");
      setNewCredentials({
        name: response.data.organizerName,
        email: response.data.email,
        password: response.data.tempPassword,
      });
      setShowCredentialsModal(true);

      setFormData({
        name: "",
        category: "",
        description: "",
        email: "",
        password: "",
      });
      setShowCreateForm(false);
      fetchOrganizers();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to create organizer",
      });
    }
  };

  const handleResetPassword = async (id, name, email) => {
    if (
      !window.confirm(
        `Are you sure you want to reset the password for ${name}?`,
      )
    )
      return;

    const tempPassword = generateTempPassword();

    try {
      await adminAPI.resetPassword(id, { newPassword: tempPassword });

      setCredentialsMode("reset");
      setNewCredentials({
        name,
        email,
        password: tempPassword,
      });
      setShowCredentialsModal(true);

      setMessage({
        type: "success",
        text: `Password reset successfully for ${name}`,
      });
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err.response?.data?.message || "Failed to reset organizer password",
      });
    }
  };
  const handleDisable = async (id, name) => {
    if (
      !window.confirm(
        `Are you sure you want to disable ${name}? They will not be able to log in.`,
      )
    )
      return;

    try {
      await adminAPI.disableOrganizer(id);
      setMessage({
        type: "success",
        text: `${name} has been disabled. They cannot log in anymore.`,
      });
      fetchOrganizers();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to disable organizer" });
    }
  };

  const handleEnable = async (id, name) => {
    if (
      !window.confirm(
        `Are you sure you want to enable ${name}? They will be able to log in again.`,
      )
    )
      return;

    try {
      await adminAPI.enableOrganizer(id);
      setMessage({
        type: "success",
        text: `${name} has been enabled. They can now log in.`,
      });
      fetchOrganizers();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to enable organizer" });
    }
  };

  const handleDelete = async (id, name) => {
    if (
      !window.confirm(
        `⚠️ PERMANENT DELETE: Are you sure you want to permanently delete ${name}? This will also delete all their events and cannot be undone!`,
      )
    )
      return;

    try {
      await adminAPI.deleteOrganizer(id);
      setMessage({
        type: "success",
        text: `${name} has been permanently deleted`,
      });
      fetchOrganizers();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to delete organizer" });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: "success", text: "Copied to clipboard!" });
    setTimeout(() => setMessage({ type: "", text: "" }), 2000);
  };

  if (loading) return <LoadingSpinner message="Loading..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchOrganizers} />;

  return (
    <div className="admin-dashboard-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-primary"
        >
          {showCreateForm ? "Cancel" : "+ Add Organizer"}
        </button>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      {/* Credentials Modal */}
      {showCredentialsModal && newCredentials && (
        <div
          className="modal-overlay"
          onClick={() => setShowCredentialsModal(false)}
        >
          <div
            className="modal-content credentials-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>
              {credentialsMode === "create"
                ? "✅ Organizer Created Successfully!"
                : "✅ Password Reset Successfully!"}
            </h2>
            <p style={{ marginBottom: "1rem", color: "#666" }}>
              {credentialsMode === "create" ? (
                <>
                  Share these credentials with{" "}
                  <strong>{newCredentials.name}</strong>. They can log in
                  immediately.
                </>
              ) : (
                <>
                  Share this new temporary password with{" "}
                  <strong>{newCredentials.name}</strong>. Their previous
                  password will no longer work.
                </>
              )}
            </p>

            <div className="credentials-box">
              <div className="credential-item">
                <label>Login Email:</label>
                <div className="credential-value">
                  <code>{newCredentials.email}</code>
                  <button
                    onClick={() => copyToClipboard(newCredentials.email)}
                    className="btn-copy"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>

              <div className="credential-item">
                <label>Temporary Password:</label>
                <div className="credential-value">
                  <code>{newCredentials.password}</code>
                  <button
                    onClick={() => copyToClipboard(newCredentials.password)}
                    className="btn-copy"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
            </div>

            <p
              style={{
                marginTop: "1rem",
                fontSize: "0.9rem",
                color: "#e67e22",
              }}
            >
              ⚠️ <strong>Important:</strong> Save these credentials now. You
              won't be able to see the password again.
            </p>

            <button
              onClick={() => setShowCredentialsModal(false)}
              className="btn-primary"
              style={{ marginTop: "1rem", width: "100%" }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showCreateForm && (
        <div className="create-form-card">
          <h2>Create New Organizer</h2>
          <form onSubmit={handleCreate} className="organizer-form">
            <div className="form-group">
              <label>Organizer Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder="e.g., E-Cell, Programming Club"
              />
            </div>

            <div className="form-group">
              <label>Category *</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                required
                placeholder="e.g., Technical, Cultural, Sports"
              />
            </div>

            <div className="form-group">
              <label>Organizer Login Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                placeholder="Login email for the organizer"
              />
            </div>

            <div className="form-group">
              <label>Temporary Password *</label>
              <input
                type="text"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                placeholder="Set a temporary password"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                placeholder="Brief description of the organizer"
              />
            </div>

            <button type="submit" className="btn-primary">
              Create Organizer
            </button>
          </form>
        </div>
      )}

      <div className="organizers-table">
        <h2>Manage Organizers ({organizers.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Email</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {organizers.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  style={{
                    textAlign: "center",
                    padding: "2rem",
                    color: "#999",
                  }}
                >
                  No organizers found. Create one to get started.
                </td>
              </tr>
            ) : (
              organizers.map((org) => (
                <tr key={org._id}>
                  <td>
                    {org.organizerName || org.firstName + " " + org.lastName}
                  </td>
                  <td>{org.category}</td>
                  <td>{org.email}</td>
                  <td>
                    <span
                      className={`status-badge ${org.isActive === false ? "disabled" : "active"}`}
                    >
                      {org.isActive === false ? "🔴 Disabled" : "🟢 Active"}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {org.isActive === false ? (
                        <button
                          onClick={() =>
                            handleEnable(
                              org._id,
                              org.organizerName || org.firstName,
                            )
                          }
                          className="btn-success btn-sm"
                          title="Enable this organizer"
                        >
                          Enable
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            handleDisable(
                              org._id,
                              org.organizerName || org.firstName,
                            )
                          }
                          className="btn-warning btn-sm"
                          title="Disable this organizer (they cannot log in)"
                        >
                          Disable
                        </button>
                      )}
                      <button
                        onClick={() =>
                          handleResetPassword(
                            org._id,
                            org.organizerName || org.firstName,
                            org.email,
                          )
                        }
                        className="btn-primary btn-sm"
                        title="Reset password and get a new temporary password"
                      >
                        Reset Password
                      </button>
                      <button
                        onClick={() =>
                          handleDelete(
                            org._id,
                            org.organizerName || org.firstName,
                          )
                        }
                        className="btn-danger btn-sm"
                        title="Permanently delete this organizer"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div
          className="table-legend"
          style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#666" }}
        >
          <p>
            <strong>Actions:</strong>
          </p>
          <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
            <li>
              <strong>Disable:</strong> Temporarily block login (account
              remains, data preserved)
            </li>
            <li>
              <strong>Enable:</strong> Restore login access for disabled
              accounts
            </li>
            <li>
              <strong>Reset Password:</strong> Generate a new temporary password
              and invalidate the old one
            </li>
            <li>
              <strong>Delete:</strong> Permanently remove account and all events
              (cannot be undone)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
