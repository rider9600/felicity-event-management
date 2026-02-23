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
  const [approveModal, setApproveModal] = useState({ open: false, requestId: null });
  const [rejectModal, setRejectModal] = useState({ open: false, requestId: null });
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [resultMsg, setResultMsg] = useState(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    const result = await apiCall("/point/password/requests");
    if (result?.success && Array.isArray(result.requests)) {
      setRequests(result.requests);
    }
  };

  const handleApprove = async () => {
    const result = await apiCall(`/point/password/approve/${approveModal.requestId}`, {
      method: "POST",
      body: JSON.stringify({ adminNotes }),
    });
    if (result?.success) {
      setResultMsg(`✅ Password reset approved. New password: ${result.newPassword}`);
      loadRequests();
    }
    setApproveModal({ open: false, requestId: null });
    setAdminNotes("");
  };

  const handleReject = async () => {
    const result = await apiCall(`/point/password/reject/${rejectModal.requestId}`, {
      method: "POST",
      body: JSON.stringify({ reason: rejectReason }),
    });
    if (result?.success) {
      setResultMsg("❌ Password reset request rejected.");
      loadRequests();
    }
    setRejectModal({ open: false, requestId: null });
    setRejectReason("");
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "pending":  return "warning";
      case "approved": return "success";
      case "rejected": return "danger";
      default:         return "default";
    }
  };

  if (loading && requests.length === 0) {
    return <DashboardLayout><Loading size="large" /></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div style={{ padding: "24px" }}>
        <h1 style={{ marginBottom: "8px" }}>Password Reset Requests</h1>
        <p style={{ color: "#888", marginBottom: "24px" }}>
          Review and process organizer password reset requests.
        </p>

        {resultMsg && (
          <div style={{
            background: "#1a2e1a",
            border: "1px solid #2a4a2a",
            borderRadius: "8px",
            padding: "14px 20px",
            marginBottom: "20px",
            color: "#6af16a",
          }}>
            {resultMsg}
            <button onClick={() => setResultMsg(null)} style={{ marginLeft: "16px", background: "none", border: "none", color: "#888", cursor: "pointer" }}>✕</button>
          </div>
        )}

        {requests.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#888" }}>
            <p style={{ fontSize: "40px" }}>📭</p>
            <p>No password reset requests at this time.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {requests.map((req) => (
              <div key={req._id} style={{
                background: "var(--card-bg, #1a1a2e)",
                border: "1px solid var(--border-color, #2a2a4a)",
                borderRadius: "12px",
                padding: "20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
              }}>
                <div>
                  <h4 style={{ margin: "0 0 6px 0" }}>
                    {req.organizerName || req.userId?.firstname}
                  </h4>
                  <p style={{ margin: "0 0 4px 0", color: "#888", fontSize: "13px" }}>
                    📧 {req.contactEmail || req.userId?.email}
                  </p>
                  <p style={{ margin: "0 0 4px 0", color: "#b0b0c8", fontSize: "13px" }}>
                    Reason: {req.reason}
                  </p>
                  <p style={{ margin: 0, color: "#666", fontSize: "12px" }}>
                    Requested: {new Date(req.requestedAt || req.createdAt).toLocaleString()}
                  </p>
                  {req.adminNotes && (
                    <p style={{ margin: "6px 0 0 0", color: "#a78bfa", fontSize: "12px" }}>
                      Admin notes: {req.adminNotes}
                    </p>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Badge variant={getStatusVariant(req.status)}>{req.status}</Badge>
                  {req.status === "pending" && (
                    <>
                      <Button
                        variant="success"
                        size="small"
                        onClick={() => setApproveModal({ open: true, requestId: req._id })}
                      >
                        Approve & Reset
                      </Button>
                      <Button
                        variant="danger"
                        size="small"
                        onClick={() => setRejectModal({ open: true, requestId: req._id })}
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
          onClose={() => setApproveModal({ open: false, requestId: null })}
          title="Approve Password Reset"
          size="small"
          footer={
            <>
              <Button variant="secondary" onClick={() => setApproveModal({ open: false, requestId: null })}>Cancel</Button>
              <Button variant="success" onClick={handleApprove}>Approve & Reset</Button>
            </>
          }
        >
          <p>A new random password will be generated and shown to you. Share it with the organizer.</p>
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
          onClose={() => setRejectModal({ open: false, requestId: null })}
          title="Reject Password Reset Request"
          size="small"
          footer={
            <>
              <Button variant="secondary" onClick={() => setRejectModal({ open: false, requestId: null })}>Cancel</Button>
              <Button variant="danger" onClick={handleReject}>Reject</Button>
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
