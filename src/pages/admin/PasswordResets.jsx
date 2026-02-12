import { useState, useEffect } from "react";
import { adminAPI } from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";
import "./PasswordResets.css";

const PasswordResets = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getStats();
      // Get all users for password reset
      const usersResponse = await adminAPI.getOrganizers();
      setUsers(usersResponse.data);
    } catch (err) {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (userId) => {
    if (!newPassword || newPassword.length < 6) {
      setMessage({
        type: "error",
        text: "Password must be at least 6 characters",
      });
      return;
    }

    try {
      await adminAPI.resetPassword(userId, { newPassword });
      setMessage({
        type: "success",
        text: "Password reset successfully",
      });
      setSelectedUser(null);
      setNewPassword("");
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to reset password",
      });
    }
  };

  if (loading) return <LoadingSpinner message="Loading users..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchUsers} />;

  return (
    <div className="password-resets-container">
      <div className="page-header">
        <h1>Password Reset Management</h1>
        <p>Reset passwords for organizers and participants</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      <div className="users-table-card">
        <h2>All Organizers</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Category</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>
                  {user.organizerName || `${user.firstName} ${user.lastName}`}
                </td>
                <td>{user.email}</td>
                <td>{user.category || user.role}</td>
                <td>
                  {selectedUser === user._id ? (
                    <div className="password-reset-form">
                      <input
                        type="password"
                        placeholder="New password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="password-input"
                      />
                      <button
                        onClick={() => handleResetPassword(user._id)}
                        className="btn-primary btn-sm"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(null);
                          setNewPassword("");
                        }}
                        className="btn-secondary btn-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedUser(user._id)}
                      className="btn-warning btn-sm"
                    >
                      Reset Password
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="empty-state">
            <p>No users found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PasswordResets;
