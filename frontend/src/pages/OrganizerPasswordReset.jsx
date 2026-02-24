import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import DashboardLayout from "../components/layout/DashboardLayout";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Loading from "../components/common/Loading";
import Modal from "../components/common/Modal";
import Input from "../components/common/Input";

const OrganizerPasswordReset = () => {
  const { user } = useAuth();
  const { apiCall, loading } = useApi();
  const [history, setHistory] = useState([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reason, setReason] = useState("");
  const [pendingRequests, setPendingRequests] = useState(0);
  const [resultMsg, setResultMsg] = useState(null);
  const [activeTab, setActiveTab] = useState("history");

  useEffect(() => {
    loadPasswordResetHistory();
  }, []);

  const loadPasswordResetHistory = async () => {
    const result = await apiCall("/point/organizer/password-reset/history");
    if (result?.success && Array.isArray(result.history)) {
      setHistory(result.history);
      const pending = result.history.filter(
        (h) => h.status === "pending",
      ).length;
      setPendingRequests(pending);
    }
  };

  const handleSubmitRequest = async () => {
    if (!reason.trim()) {
      setResultMsg({
        type: "error",
        text: "❌ Please provide a reason for password reset request.",
      });
      return;
    }

    const result = await apiCall("/point/organizer/password-reset/request", {
      method: "POST",
      body: JSON.stringify({ reason }),
    });

    if (result?.success) {
      setResultMsg({
        type: "success",
        text: "✅ Password reset request submitted successfully. An admin will review and respond to your request.",
      });
      setReason("");
      setShowRequestModal(false);
      loadPasswordResetHistory();
    } else {
      setResultMsg({
        type: "error",
        text: `❌ Error: ${result?.error || "Failed to submit request"}`,
      });
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "pending":
        return "warning";
      case "approved":
        return "success";
      case "rejected":
        return "danger";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return "⏳";
      case "approved":
        return "✅";
      case "rejected":
        return "❌";
      default:
        return "📋";
    }
  };

  if (loading && history.length === 0) {
    return (
      <DashboardLayout>
        <Loading size="large" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ padding: "24px" }}>
        <h1 style={{ marginBottom: "8px" }}>Password Reset Management</h1>
        <p style={{ color: "#888", marginBottom: "24px" }}>
          Request a password reset from the admin. Only admins can reset
          organizer passwords.
        </p>

        {resultMsg && (
          <div
            style={{
              background: resultMsg.type === "success" ? "#1a2e1a" : "#2e1a1a",
              border: `1px solid ${resultMsg.type === "success" ? "#2a4a2a" : "#4a2a2a"}`,
              borderRadius: "8px",
              padding: "14px 20px",
              marginBottom: "20px",
              color: resultMsg.type === "success" ? "#6af16a" : "#ff6b6b",
            }}
          >
            {resultMsg.text}
            <button
              onClick={() => setResultMsg(null)}
              style={{
                marginLeft: "16px",
                background: "none",
                border: "none",
                color: "#888",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Status Card */}
        <div
          style={{
            background: "var(--card-bg, #1a1a2e)",
            border: "1px solid var(--border-color, #2a2a4a)",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <p
                style={{ margin: "0 0 8px 0", color: "#888", fontSize: "13px" }}
              >
                Pending Requests
              </p>
              <h2 style={{ margin: 0, fontSize: "32px" }}>
                {pendingRequests === 0 ? "✅ None" : pendingRequests}
              </h2>
              <p
                style={{ margin: "8px 0 0 0", color: "#666", fontSize: "12px" }}
              >
                {pendingRequests === 0
                  ? "No pending password reset requests"
                  : `${pendingRequests} request${pendingRequests !== 1 ? "s" : ""} awaiting admin review`}
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowRequestModal(true)}
              size="large"
            >
              Request Password Reset
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "20px",
            borderBottom: "1px solid var(--border-color, #2a2a4a)",
            paddingBottom: "12px",
          }}
        >
          <button
            onClick={() => setActiveTab("history")}
            style={{
              padding: "8px 16px",
              background:
                activeTab === "history"
                  ? "var(--primary, #7c3aed)"
                  : "transparent",
              border: "1px solid var(--border-color, #2a2a4a)",
              borderRadius: "6px",
              color: activeTab === "history" ? "#fff" : "#888",
              cursor: "pointer",
            }}
          >
            📋 All Requests ({history.length})
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            style={{
              padding: "8px 16px",
              background:
                activeTab === "pending"
                  ? "var(--primary, #7c3aed)"
                  : "transparent",
              border: "1px solid var(--border-color, #2a2a4a)",
              borderRadius: "6px",
              color: activeTab === "pending" ? "#fff" : "#888",
              cursor: "pointer",
            }}
          >
            ⏳ Pending ({history.filter((h) => h.status === "pending").length})
          </button>
        </div>

        {/* History List */}
        {history.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#888" }}>
            <p style={{ fontSize: "40px" }}>📭</p>
            <p>No password reset requests yet.</p>
            <Button
              variant="primary"
              onClick={() => setShowRequestModal(true)}
              style={{ marginTop: "16px" }}
            >
              Submit Your First Request
            </Button>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {history
              .filter(
                (req) =>
                  activeTab === "history" ||
                  (activeTab === "pending" && req.status === "pending"),
              )
              .map((req) => (
                <div
                  key={req._id}
                  style={{
                    background: "var(--card-bg, #1a1a2e)",
                    border: "1px solid var(--border-color, #2a2a4a)",
                    borderRadius: "12px",
                    padding: "20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "12px",
                    }}
                  >
                    <div>
                      <h4 style={{ margin: "0 0 6px 0" }}>
                        {getStatusIcon(req.status)}{" "}
                        {req.clubName || "Password Reset Request"}
                      </h4>
                      <p style={{ margin: 0, color: "#888", fontSize: "12px" }}>
                        Submitted: {new Date(req.requestedAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={getStatusVariant(req.status)}>
                      {req.status}
                    </Badge>
                  </div>

                  <div
                    style={{
                      marginTop: "12px",
                      paddingTop: "12px",
                      borderTop: "1px solid var(--border-color, #2a2a4a)",
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 8px 0",
                        color: "#b0b0c8",
                        fontSize: "13px",
                      }}
                    >
                      <strong>Reason:</strong> {req.reason}
                    </p>

                    {req.status !== "pending" && req.completedAt && (
                      <>
                        <p
                          style={{
                            margin: "8px 0",
                            color: "#666",
                            fontSize: "12px",
                          }}
                        >
                          <strong>Processed:</strong>{" "}
                          {new Date(req.completedAt).toLocaleString()}
                        </p>
                        {req.completedBy && (
                          <p
                            style={{
                              margin: "8px 0",
                              color: "#666",
                              fontSize: "12px",
                            }}
                          >
                            <strong>By Admin:</strong>{" "}
                            {req.completedBy.firstname}{" "}
                            {req.completedBy.lastname}
                          </p>
                        )}
                      </>
                    )}

                    {req.status === "approved" && (
                      <div
                        style={{
                          background: "#1a2e1a",
                          border: "1px solid #2a4a2a",
                          borderRadius: "8px",
                          padding: "12px",
                          marginTop: "12px",
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            color: "#6af16a",
                            fontSize: "12px",
                          }}
                        >
                          ✅ Your password reset request has been{" "}
                          <strong>approved</strong>. Contact the admin to
                          receive your new password.
                        </p>
                      </div>
                    )}

                    {req.status === "rejected" && (
                      <div
                        style={{
                          background: "#2e1a1a",
                          border: "1px solid #4a2a2a",
                          borderRadius: "8px",
                          padding: "12px",
                          marginTop: "12px",
                        }}
                      >
                        <p
                          style={{
                            margin: "0 0 6px 0",
                            color: "#ff6b6b",
                            fontSize: "12px",
                          }}
                        >
                          ❌ Your request was <strong>rejected</strong>
                        </p>
                        {req.rejectionReason && (
                          <p
                            style={{
                              margin: 0,
                              color: "#ff8787",
                              fontSize: "12px",
                            }}
                          >
                            Reason: {req.rejectionReason}
                          </p>
                        )}
                      </div>
                    )}

                    {req.adminNotes && (
                      <p
                        style={{
                          margin: "12px 0 0 0",
                          color: "#a78bfa",
                          fontSize: "12px",
                        }}
                      >
                        <strong>Admin Notes:</strong> {req.adminNotes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Request Modal */}
        <Modal
          isOpen={showRequestModal}
          onClose={() => {
            setShowRequestModal(false);
            setReason("");
          }}
          title="Request Password Reset"
          size="small"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowRequestModal(false);
                  setReason("");
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmitRequest}>
                Submit Request
              </Button>
            </>
          }
        >
          <p style={{ color: "#b0b0c8", marginBottom: "16px" }}>
            Please provide a reason for your password reset request. An admin
            will review and process your request.
          </p>
          <Input
            label="Reason for Password Reset"
            type="textarea"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., I forgot my password, Security concern, etc."
            required
          />
          <p style={{ color: "#666", fontSize: "12px", marginTop: "12px" }}>
            💡 Once approved, the admin will generate a new secure password and
            share it with you through official communication channels.
          </p>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default OrganizerPasswordReset;
