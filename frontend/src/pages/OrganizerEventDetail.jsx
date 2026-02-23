import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import DashboardLayout from "../components/layout/DashboardLayout";
import Button from "../components/common/Button";
import Loading from "../components/common/Loading";
import Modal from "../components/common/Modal";
import "./OrganizerEventDetail.css";

const OrganizerEventDetail = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { apiCall, loading } = useApi();

  const [event, setEvent] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [showExportModal, setShowExportModal] = useState(false);

  // Attendance state
  const [ticketInput, setTicketInput] = useState("");
  const [attendanceMsg, setAttendanceMsg] = useState(null); // {type:'success'|'error', text}
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Accept/Reject state
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    loadEventData();
  }, [eventId]);

  const loadEventData = async () => {
    try {
      const eventResult = await apiCall(`/point/events/${eventId}`);
      if (eventResult.success) {
        const payload = eventResult.data || eventResult;
        setEvent(payload.event || payload);
      }

      const analyticsResult = await apiCall(`/point/events/${eventId}/analytics`);
      if (analyticsResult.success) {
        setAnalytics(analyticsResult.data);
      }

      const participantsResult = await apiCall(`/point/events/${eventId}/participants`);
      if (participantsResult.success) {
        setParticipants(participantsResult.data || []);
      }
    } catch (error) {
      console.error("Failed to load event data:", error);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/point/events/${eventId}/participants/export`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `participants-${eventId}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Failed to download CSV:", error);
    }
    setShowExportModal(false);
  };

  const handleAccept = async (ticketId) => {
    setActionLoading((prev) => ({ ...prev, [ticketId]: "accepting" }));
    try {
      const result = await apiCall(
        `/point/events/${eventId}/registrations/${ticketId}/accept`,
        { method: "POST" }
      );
      if (result.success) {
        setParticipants((prev) =>
          prev.map((p) =>
            p.ticketId === ticketId ? { ...p, registrationStatus: "accepted" } : p
          )
        );
        alert("Registration accepted! Ticket email sent to participant.");
      } else {
        alert(result.error || "Failed to accept registration");
      }
    } catch (err) {
      alert("Failed to accept: " + err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [ticketId]: null }));
    }
  };

  const handleReject = async (ticketId) => {
    if (!confirm("Reject this registration?")) return;
    setActionLoading((prev) => ({ ...prev, [ticketId]: "rejecting" }));
    try {
      const result = await apiCall(
        `/point/events/${eventId}/registrations/${ticketId}/reject`,
        { method: "POST" }
      );
      if (result.success) {
        setParticipants((prev) =>
          prev.map((p) =>
            p.ticketId === ticketId ? { ...p, registrationStatus: "rejected" } : p
          )
        );
      } else {
        alert(result.error || "Failed to reject registration");
      }
    } catch (err) {
      alert("Failed to reject: " + err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [ticketId]: null }));
    }
  };

  const handleMarkAttendance = async () => {
    const trimmed = ticketInput.trim();
    if (!trimmed) {
      setAttendanceMsg({ type: "error", text: "Please enter a ticket number." });
      return;
    }
    setAttendanceLoading(true);
    setAttendanceMsg(null);
    try {
      const result = await apiCall(`/point/events/${eventId}/attendance`, {
        method: "POST",
        body: JSON.stringify({ ticketNumber: trimmed }),
      });
      if (result.success) {
        setAttendanceMsg({ type: "success", text: result.message });
        setTicketInput("");
        // Refresh participant list to show updated attendance
        const res = await apiCall(`/point/events/${eventId}/participants`);
        if (res.success) setParticipants(res.data || []);
      } else {
        setAttendanceMsg({ type: "error", text: result.error || "Failed to mark attendance." });
      }
    } catch (err) {
      setAttendanceMsg({ type: "error", text: "Error: " + err.message });
    } finally {
      setAttendanceLoading(false);
    }
  };

  const pendingParticipants = participants.filter(
    (p) => !p.registrationStatus || p.registrationStatus === "pending"
  );
  const acceptedParticipants = participants.filter(
    (p) => p.registrationStatus === "accepted"
  );
  const rejectedParticipants = participants.filter(
    (p) => p.registrationStatus === "rejected"
  );

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "analytics", label: "Analytics" },
    { id: "participants", label: `Participants (${participants.length})` },
    { id: "attendance", label: "Attendance" },
  ];

  if (loading || !event || !analytics) {
    return (
      <DashboardLayout>
        <Loading size="large" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="organizer-event-detail">
        <Button variant="ghost" onClick={() => navigate("/organizer/events")}>
          ← Back to Events
        </Button>

        <div className="event-header">
          <h1>{event.eventName}</h1>
          <p className="event-type">{event.eventType}</p>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`tab ${activeTab === t.id ? "active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="tab-content">
            <div className="overview-grid">
              <div className="overview-item"><label>Name:</label><p>{event.eventName}</p></div>
              <div className="overview-item"><label>Type:</label><p>{event.eventType}</p></div>
              <div className="overview-item"><label>Status:</label><p>{event.status}</p></div>
              <div className="overview-item"><label>Start Date:</label><p>{new Date(event.eventStartDate).toLocaleDateString()}</p></div>
              <div className="overview-item"><label>End Date:</label><p>{new Date(event.eventEndDate).toLocaleDateString()}</p></div>
              <div className="overview-item"><label>Registration Deadline:</label><p>{new Date(event.registrationDeadline).toLocaleDateString()}</p></div>
              <div className="overview-item"><label>Description:</label><p>{event.eventDescription}</p></div>
              <div className="overview-item"><label>Venue:</label><p>{event.venue || "N/A"}</p></div>
              <div className="overview-item"><label>Fee:</label><p>₹{event.registrationFee}</p></div>
              {event.eligibility && (
                <div className="overview-item"><label>Eligibility:</label><p>{event.eligibility}</p></div>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="tab-content">
            <div className="analytics-grid">
              <div className="analytics-card">
                <div className="analytics-label">Registrations</div>
                <div className="analytics-value">{analytics?.registrations || 0}</div>
              </div>
              <div className="analytics-card">
                <div className="analytics-label">Pending</div>
                <div className="analytics-value">{pendingParticipants.length}</div>
              </div>
              <div className="analytics-card">
                <div className="analytics-label">Accepted</div>
                <div className="analytics-value">{acceptedParticipants.length}</div>
              </div>
              <div className="analytics-card">
                <div className="analytics-label">Attendance</div>
                <div className="analytics-value">{analytics?.attendance || 0}</div>
              </div>
              <div className="analytics-card">
                <div className="analytics-label">Revenue</div>
                <div className="analytics-value">₹{analytics?.revenue || 0}</div>
              </div>
            </div>
            {analytics?.teamStats && analytics.teamStats.length > 0 && (
              <div className="team-stats">
                <h3>Team Completion</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Team ID</th><th>Members</th><th>Attended</th><th>Complete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.teamStats.map((team) => (
                      <tr key={team.teamId}>
                        <td>{team.teamId}</td>
                        <td>{team.members}</td>
                        <td>{team.attended}</td>
                        <td>{team.completed ? "✓" : "✗"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Participants Tab */}
        {activeTab === "participants" && (
          <div className="tab-content">
            <div className="participants-header">
              <h3>Participants ({participants.length})</h3>
              <Button variant="primary" onClick={() => setShowExportModal(true)}>
                Export CSV
              </Button>
            </div>

            {/* ── PENDING REGISTRATIONS ── */}
            <div className="reg-section">
              <h4 className="reg-section-title pending-title">
                ⏳ Pending Approval ({pendingParticipants.length})
              </h4>
              {pendingParticipants.length > 0 ? (
                <table className="participants-table">
                  <thead>
                    <tr>
                      <th>Name</th><th>Email</th><th>Ticket ID</th>
                      <th>Registered At</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingParticipants.map((p) => (
                      <tr key={p.ticketId}>
                        <td>{p.name}</td>
                        <td>{p.email}</td>
                        <td><code className="ticket-code">{p.ticketId}</code></td>
                        <td>{new Date(p.registeredAt).toLocaleDateString()}</td>
                        <td>
                          <button
                            className="action-btn accept-btn"
                            onClick={() => handleAccept(p.ticketId)}
                            disabled={!!actionLoading[p.ticketId]}
                          >
                            {actionLoading[p.ticketId] === "accepting" ? "..." : "✓ Accept"}
                          </button>
                          <button
                            className="action-btn reject-btn"
                            onClick={() => handleReject(p.ticketId)}
                            disabled={!!actionLoading[p.ticketId]}
                          >
                            {actionLoading[p.ticketId] === "rejecting" ? "..." : "✗ Reject"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-data">No pending registrations.</p>
              )}
            </div>

            {/* ── ACCEPTED REGISTRATIONS ── */}
            <div className="reg-section">
              <h4 className="reg-section-title accepted-title">
                ✅ Accepted ({acceptedParticipants.length})
              </h4>
              {acceptedParticipants.length > 0 ? (
                <table className="participants-table">
                  <thead>
                    <tr>
                      <th>Name</th><th>Email</th><th>Ticket ID</th>
                      <th>Payment</th><th>Attended</th>
                    </tr>
                  </thead>
                  <tbody>
                    {acceptedParticipants.map((p) => (
                      <tr key={p.ticketId}>
                        <td>{p.name}</td>
                        <td>{p.email}</td>
                        <td><code className="ticket-code">{p.ticketId}</code></td>
                        <td>
                          <span className={`status ${p.paymentStatus}`}>
                            {p.paymentStatus}
                          </span>
                        </td>
                        <td>{p.attendance ? "✅" : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-data">No accepted participants yet.</p>
              )}
            </div>

            {/* ── REJECTED ── */}
            {rejectedParticipants.length > 0 && (
              <div className="reg-section">
                <h4 className="reg-section-title rejected-title">
                  ❌ Rejected ({rejectedParticipants.length})
                </h4>
                <table className="participants-table">
                  <thead>
                    <tr><th>Name</th><th>Email</th><th>Ticket ID</th></tr>
                  </thead>
                  <tbody>
                    {rejectedParticipants.map((p) => (
                      <tr key={p.ticketId}>
                        <td>{p.name}</td>
                        <td>{p.email}</td>
                        <td><code className="ticket-code">{p.ticketId}</code></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === "attendance" && (
          <div className="tab-content">
            <div className="attendance-section">
              <h3 className="attendance-heading">Mark Attendance</h3>
              <p className="attendance-desc">
                Enter the participant's ticket number to mark them as attended. The ticket must
                have been accepted first.
              </p>

              <div className="attendance-input-row">
                <input
                  type="text"
                  className="ticket-number-input"
                  placeholder="Enter ticket number (e.g. a1b2c3d4e5f6g7h8)"
                  value={ticketInput}
                  onChange={(e) => setTicketInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleMarkAttendance()}
                />
                <button
                  className="mark-btn"
                  onClick={handleMarkAttendance}
                  disabled={attendanceLoading}
                >
                  {attendanceLoading ? "Marking..." : "Mark Attended ✓"}
                </button>
              </div>

              {attendanceMsg && (
                <div className={`attendance-feedback ${attendanceMsg.type}`}>
                  {attendanceMsg.type === "success" ? "✅" : "❌"} {attendanceMsg.text}
                </div>
              )}

              {/* Quick reference list of accepted tickets */}
              {acceptedParticipants.length > 0 && (
                <div className="attendance-list">
                  <h4>Accepted Participants</h4>
                  <table className="participants-table">
                    <thead>
                      <tr>
                        <th>Name</th><th>Email</th><th>Ticket Number</th><th>Attended</th>
                      </tr>
                    </thead>
                    <tbody>
                      {acceptedParticipants.map((p) => (
                        <tr
                          key={p.ticketId}
                          className={p.attendance ? "attended-row" : ""}
                        >
                          <td>{p.name}</td>
                          <td>{p.email}</td>
                          <td>
                            <code
                              className="ticket-code clickable"
                              title="Click to fill in the box above"
                              onClick={() => setTicketInput(p.ticketId)}
                            >
                              {p.ticketId}
                            </code>
                          </td>
                          <td>{p.attendance ? "✅ Yes" : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Export Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Participants"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowExportModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleExportCSV}>
              Download CSV
            </Button>
          </>
        }
      >
        <p>Export all participants data to CSV format?</p>
      </Modal>
    </DashboardLayout>
  );
};

export default OrganizerEventDetail;
