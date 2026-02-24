import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import DashboardLayout from "../components/layout/DashboardLayout";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Loading from "../components/common/Loading";
import Modal from "../components/common/Modal";
import Input from "../components/common/Input";

const PasswordResetRequests = () => {
  const { user } = useAuth();
  const { apiCall, loading } = useApi();
  const [requests, setRequests] = useState([]);
  const [approveModal, setApproveModal] = useState({
    open: false,
    requestId: null,
  });
  const [rejectModal, setRejectModal] = useState({
    open: false,
    requestId: null,
  });
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [resultMsg, setResultMsg] = useState(null);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    loadRequests();
  }, [filterStatus]);

  const loadRequests = async () => {
    const result = await apiCall(
      `/point/admin-dashboard/password-reset/requests?status=${filterStatus}`,
    );
    if (result?.success && Array.isArray(result.requests)) {
      setRequests(result.requests);
      if (result.summary) {
        setSummary(result.summary);
      }
    }
  };

  const handleApprove = async () => {
    const result = await apiCall(
      `/point/admin-dashboard/password-reset/approve/${approveModal.requestId}`,
      {
        method: "POST",
        body: JSON.stringify({ adminNotes }),
      },
    );
    if (result?.success) {
      setResultMsg({
        type: "success",
        text: `✅ Password reset approved for ${result.organizer.name}. New password: ${result.newPassword}`,
      });
      loadRequests();
      setApproveModal({ open: false, requestId: null });
      setAdminNotes("");
    } else {
      setResultMsg({ type: "error", text: `❌ Error: ${result?.error}` });
    }
  };

  const handleReject = async () => {
    const result = await apiCall(
      `/point/admin-dashboard/password-reset/reject/${rejectModal.requestId}`,
      {
        method: "POST",
        body: JSON.stringify({ rejectionReason: rejectReason, adminNotes }),
      },
    );
    if (result?.success) {
      setResultMsg({
        type: "success",
        text: "❌ Password reset request rejected.",
      });
      loadRequests();
      setRejectModal({ open: false, requestId: null });
      setRejectReason("");
      setAdminNotes("");
    } else {
      setResultMsg({ type: "error", text: `❌ Error: ${result?.error}` });
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

  if (loading && requests.length === 0) {
    return (
      <DashboardLayout>
        <Loading size="large" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ padding: "24px" }}>
        <h1 style={{ marginBottom: "8px" }}>Password Reset Requests</h1>
        <p style={{ color: "#888", marginBottom: "24px" }}>
          Review and process organizer password reset requests. Admin approval
          required for organizer password resets.
        </p>

        {/* Summary Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              background: "var(--card-bg, #1a1a2e)",
              border: "1px solid var(--border-color, #2a2a4a)",
              borderRadius: "8px",
              padding: "16px",
            }}
          >
            <p style={{ color: "#888", margin: 0, fontSize: "12px" }}>
              Total Requests
            </p>
            <h3 style={{ margin: "8px 0 0 0", fontSize: "28px" }}>
              {summary.total}
            </h3>
          </div>
          <div
            style={{
              background: "var(--card-bg, #1a1a2e)",
              border: "1px solid var(--border-color, #2a2a4a)",
              borderRadius: "8px",
              padding: "16px",
            }}
          >
            <p style={{ color: "#888", margin: 0, fontSize: "12px" }}>
              Pending
            </p>
            <h3
              style={{
                margin: "8px 0 0 0",
                fontSize: "28px",
                color: "#fbbf24",
              }}
            >
              {summary.pending}
            </h3>
          </div>
          <div
            style={{
              background: "var(--card-bg, #1a1a2e)",
              border: "1px solid var(--border-color, #2a2a4a)",
              borderRadius: "8px",
              padding: "16px",
            }}
          >
            <p style={{ color: "#888", margin: 0, fontSize: "12px" }}>
              Approved
            </p>
            <h3
              style={{
                margin: "8px 0 0 0",
                fontSize: "28px",
                color: "#6af16a",
              }}
            >
              {summary.approved}
            </h3>
          </div>
          <div
            style={{
              background: "var(--card-bg, #1a1a2e)",
              border: "1px solid var(--border-color, #2a2a4a)",
              borderRadius: "8px",
              padding: "16px",
            }}
          >
            <p style={{ color: "#888", margin: 0, fontSize: "12px" }}>
              Rejected
            </p>
            <h3
              style={{
                margin: "8px 0 0 0",
                fontSize: "28px",
                color: "#ff6b6b",
              }}
            >
              {summary.rejected}
            </h3>
          </div>
        </div>

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

        {/* Filter Tabs */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "20px",
            borderBottom: "1px solid var(--border-color, #2a2a4a)",
            paddingBottom: "12px",
          }}
        >
          {["pending", "approved", "rejected", "all"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status === "all" ? "" : status)}
              style={{
                padding: "8px 16px",
                background:
                  filterStatus === (status === "all" ? "" : status)
                    ? "var(--primary, #7c3aed)"
                    : "transparent",
                border: "1px solid var(--border-color, #2a2a4a)",
                borderRadius: "6px",
                color:
                  filterStatus === (status === "all" ? "" : status)
                    ? "#fff"
                    : "#888",
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {status}
            </button>
          ))}
        </div>

        {requests.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#888" }}>
            <p style={{ fontSize: "40px" }}>📭</p>
            <p>No password reset requests found.</p>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {requests.map((req) => (
              <div
                key={req._id}
                style={{
                  background: "var(--card-bg, #1a1a2e)",
                  border: "1px solid var(--border-color, #2a2a4a)",
                  borderRadius: "12px",
                  padding: "20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div style={{ flex: "1", minWidth: "300px" }}>
                  <h4 style={{ margin: "0 0 6px 0" }}>
                    {req.organizerName ||
                      req.userId?.organizerName ||
                      req.userId?.firstname}
                  </h4>
                  {req.clubName && (
                    <p
                      style={{
                        margin: "0 0 4px 0",
                        color: "#a78bfa",
                        fontSize: "13px",
                      }}
                    >
                      🏢 Club: {req.clubName}
                    </p>
                  )}
                  <p
                    style={{
                      margin: "0 0 4px 0",
                      color: "#888",
                      fontSize: "13px",
                    }}
                  >
                    📧 {req.contactEmail || req.userId?.email}
                  </p>
                  <p
                    style={{
                      margin: "0 0 4px 0",
                      color: "#b0b0c8",
                      fontSize: "13px",
                    }}
                  >
                    Reason: {req.reason}
                  </p>
                  <p
                    style={{
                      margin: "0 0 4px 0",
                      color: "#666",
                      fontSize: "12px",
                    }}
                  >
                    📅 Requested: {new Date(req.requestedAt).toLocaleString()}
                  </p>
                  {req.status !== "pending" && req.completedAt && (
                    <p
                      style={{
                        margin: "0 0 4px 0",
                        color: "#666",
                        fontSize: "12px",
                      }}
                    >
                      ✓ Processed: {new Date(req.completedAt).toLocaleString()}{" "}
                      by {req.completedBy?.firstname}
                    </p>
                  )}
                  {req.status === "rejected" && req.rejectionReason && (
                    <p
                      style={{
                        margin: "6px 0 0 0",
                        color: "#ff6b6b",
                        fontSize: "12px",
                      }}
                    >
                      ❌ Rejection: {req.rejectionReason}
                    </p>
                  )}
                  {req.adminNotes && (
                    <p
                      style={{
                        margin: "6px 0 0 0",
                        color: "#a78bfa",
                        fontSize: "12px",
                      }}
                    >
                      💬 Notes: {req.adminNotes}
                    </p>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <Badge variant={getStatusVariant(req.status)}>
                    {req.status}
                  </Badge>
                  {req.status === "pending" && (
                    <>
                      <Button
                        variant="success"
                        size="small"
                        onClick={() =>
                          setApproveModal({ open: true, requestId: req._id })
                        }
                      >
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="small"
                        onClick={() =>
                          setRejectModal({ open: true, requestId: req._id })
                        }
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Approve Modal */}
        <Modal
          isOpen={approveModal.open}
          onClose={() => {
            setApproveModal({ open: false, requestId: null });
            setAdminNotes("");
          }}
          title="Approve Password Reset"
          size="small"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setApproveModal({ open: false, requestId: null });
                  setAdminNotes("");
                }}
              >
                Cancel
              </Button>
              <Button variant="success" onClick={handleApprove}>
                Approve & Reset
              </Button>
            </>
          }
        >
          <p>
            A new secure password will be generated. You will be able to share
            it with the organizer.
          </p>
          <Input
            label="Admin Notes (optional)"
            type="textarea"
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Add any notes for this decision..."
          />
        </Modal>

        {/* Reject Modal */}
        <Modal
          isOpen={rejectModal.open}
          onClose={() => {
            setRejectModal({ open: false, requestId: null });
            setRejectReason("");
          }}
          title="Reject Password Reset Request"
          size="small"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setRejectModal({ open: false, requestId: null });
                  setRejectReason("");
                }}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={handleReject}>
                Reject
              </Button>
            </>
          }
        >
          <Input
            label="Rejection Reason"
            type="textarea"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Explain why this request is being rejected..."
          />
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default PasswordResetRequests;
