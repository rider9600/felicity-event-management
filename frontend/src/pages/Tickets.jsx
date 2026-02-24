import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import PageContainer from "../components/layout/PageContainer";
import Loading from "../components/common/Loading";
import Modal from "../components/common/Modal";
import "./Tickets.css";

const Tickets = () => {
  const { user } = useAuth();
  const { apiCall } = useApi();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "", eventType: "" });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Payment proof upload state
  const [proofFile, setProofFile] = useState(null);
  const [proofUploading, setProofUploading] = useState(false);
  const [proofMsg, setProofMsg] = useState(null);
  const proofInputRef = useRef();

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [tickets, filters]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const result = await apiCall("/point/tickets/my");
      if (Array.isArray(result)) {
        setTickets(result);
      } else if (result?.success && Array.isArray(result.data)) {
        setTickets(result.data);
      } else {
        setTickets([]);
      }
    } catch (err) {
      console.error("Failed to load tickets:", err);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const filterTickets = () => {
    let filtered = tickets;
    if (filters.status) {
      filtered = filtered.filter((t) => t.status === filters.status);
    }
    if (filters.eventType) {
      filtered = filtered.filter(
        (t) => t.eventId?.eventType === filters.eventType,
      );
    }
    setFilteredTickets(filtered);
  };

  const handleFilterChange = (filterName) => (e) => {
    setFilters((prev) => ({ ...prev, [filterName]: e.target.value }));
  };

  const clearFilters = () => setFilters({ status: "", eventType: "" });

  const getTicketStats = () => {
    const active = tickets.filter((t) => t.status === "active").length;
    const completed = tickets.filter((t) => t.status === "completed").length;
    const attended = tickets.filter((t) => t.attendance).length;
    return { active, completed, attended, total: tickets.length };
  };

  const formatDate = (isoString) => {
    if (!isoString) return "N/A";
    const d = new Date(isoString);
    if (isNaN(d)) return "N/A";
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Upload payment proof for a merchandise ticket
  const handleProofUpload = async () => {
    if (!proofFile || !selectedTicket) return;
    setProofUploading(true);
    setProofMsg(null);
    try {
      const formData = new FormData();
      const apiBase =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
      formData.append("proof", proofFile);
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${apiBase}/point/merchandise/${selectedTicket.ticketId}/proof`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );
      const data = await res.json();
      if (data.success) {
        setProofMsg({ type: "success", text: "Payment proof uploaded! Awaiting organizer review." });
        setProofFile(null);
        // Refresh tickets
        await loadTickets();
        // Update selectedTicket inline
        setSelectedTicket((prev) => ({ ...prev, paymentStatus: "pending_approval" }));
      } else {
        setProofMsg({ type: "error", text: data.error || "Upload failed." });
      }
    } catch (err) {
      setProofMsg({ type: "error", text: "Upload failed: " + err.message });
    } finally {
      setProofUploading(false);
    }
  };

  // Build calendar links for a ticket's event
  const buildCalendarUrls = (ticket) => {
    const event = ticket?.eventId;
    if (!event) return null;
    const title = encodeURIComponent(event.eventName || "Event");
    const details = encodeURIComponent(event.eventDescription || "");
    const location = encodeURIComponent(event.venue || "");
    const toGCal = (d) => new Date(d).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const start = event.eventStartDate ? toGCal(event.eventStartDate) : "";
    const end = event.eventEndDate ? toGCal(event.eventEndDate) : start;
    const startISO = event.eventStartDate ? new Date(event.eventStartDate).toISOString() : "";
    const endISO = event.eventEndDate ? new Date(event.eventEndDate).toISOString() : startISO;
    const eventId = event._id;
    const apiBase =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
    return {
      ics: `${apiBase}/point/events/${eventId}/calendar.ics`,
      google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`,
      outlook: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${encodeURIComponent(startISO)}&enddt=${encodeURIComponent(endISO)}&body=${details}&location=${location}`,
    };
  };

  const stats = getTicketStats();

  const paymentStatusColor = (status) => {
    switch (status) {
      case "paid": return "#22c55e";
      case "pending_approval": return "#f59e0b";
      case "rejected": return "#ef4444";
      default: return "#6b7280";
    }
  };

  const paymentStatusLabel = (status) => {
    switch (status) {
      case "paid": return "✅ Paid";
      case "pending_approval": return "⏳ Pending Approval";
      case "rejected": return "❌ Rejected";
      case "pending": return "⏳ Pending Payment";
      default: return status;
    }
  };

  return (
    <PageContainer
      title="My Tickets"
      subtitle={`You have ${stats.total} ticket${stats.total !== 1 ? "s" : ""}`}
    >
      {/* Stats Summary */}
      <div className="tickets-stats">
        <div className="stat-item">
          <span className="stat-value">{stats.active}</span>
          <span className="stat-label">Active</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.completed}</span>
          <span className="stat-label">Completed</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.attended}</span>
          <span className="stat-label">Attended</span>
        </div>
      </div>

      {/* Filters */}
      <div className="tickets-controls">
        <Input
          type="select"
          value={filters.status}
          onChange={handleFilterChange("status")}
          options={[
            { value: "", label: "All Statuses" },
            { value: "active", label: "Active" },
            { value: "completed", label: "Completed" },
            { value: "cancelled", label: "Cancelled" },
          ]}
          className="filter-select"
        />
        <Input
          type="select"
          value={filters.eventType}
          onChange={handleFilterChange("eventType")}
          options={[
            { value: "", label: "All Types" },
            { value: "normal", label: "Events" },
            { value: "merchandise", label: "Merchandise" },
          ]}
          className="filter-select"
        />
        <Button variant="outline" size="small" onClick={clearFilters}>
          Clear Filters
        </Button>
      </div>

      {/* Tickets Grid */}
      {loading ? (
        <Loading text="Loading your tickets..." />
      ) : filteredTickets.length > 0 ? (
        <div className="tickets-grid">
          {filteredTickets.map((ticket) => {
            const event = ticket.eventId; // populated by backend
            return (
              <div key={ticket._id || ticket.ticketId} className="ticket-card-wrapper">
                <div
                  style={{
                    background: "var(--card-bg, #1a1a2e)",
                    border: "1px solid var(--border-color, #2a2a4a)",
                    borderRadius: "12px",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h3 style={{ margin: "0 0 4px", fontSize: "1rem" }}>
                        {event?.eventName || "Unknown Event"}
                      </h3>
                      <p style={{ margin: 0, color: "#888", fontSize: "0.8rem" }}>
                        ID: {ticket.ticketId}
                      </p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-end" }}>
                      <Badge
                        variant={
                          ticket.status === "active" ? "success" :
                          ticket.status === "completed" ? "secondary" :
                          ticket.status === "cancelled" ? "danger" : "default"
                        }
                        size="small"
                      >
                        {ticket.status}
                      </Badge>
                      {event?.eventType && (
                        <Badge variant="primary" size="small">
                          {event.eventType === "merchandise" ? "🛍️ Merch" : "🎟️ Event"}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Event Info */}
                  {event && (
                    <div style={{ fontSize: "0.85rem", color: "#aaa", display: "flex", flexDirection: "column", gap: "4px" }}>
                      {event.eventStartDate && (
                        <span>📅 {formatDate(event.eventStartDate)}</span>
                      )}
                      {event.venue && <span>📍 {event.venue}</span>}
                    </div>
                  )}

                  {/* Merchandise details */}
                  {ticket.purchaseDetails && (
                    <div style={{ fontSize: "0.85rem", color: "#c084fc" }}>
                      🛍️ {ticket.purchaseDetails.name}
                      {ticket.purchaseDetails.size && ` — Size: ${ticket.purchaseDetails.size}`}
                      {ticket.purchaseDetails.color && ` — Color: ${ticket.purchaseDetails.color}`}
                    </div>
                  )}

                  {/* Payment status for merchandise */}
                  {ticket.paymentStatus && ticket.paymentStatus !== "pending" && (
                    <div style={{ fontSize: "0.82rem", color: paymentStatusColor(ticket.paymentStatus) }}>
                      {paymentStatusLabel(ticket.paymentStatus)}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                    <Button
                      variant="primary"
                      size="small"
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setProofFile(null);
                        setProofMsg(null);
                        setShowDetailsModal(true);
                      }}
                    >
                      View Ticket & QR
                    </Button>
                    {event?._id && (
                      <Button
                        variant="outline"
                        size="small"
                        onClick={() => navigate(`/events/${event._id}`)}
                      >
                        Event Details
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <h3>No tickets found</h3>
          <p>
            {tickets.length > 0
              ? "No tickets match your current filters."
              : "You haven't registered for any events yet."}
          </p>
          <Button variant="primary" onClick={() => navigate("/events")}>
            Browse Events
          </Button>
        </div>
      )}

      {/* Ticket Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => { setShowDetailsModal(false); setSelectedTicket(null); setProofMsg(null); }}
        title="Ticket Details"
        size="medium"
      >
        {selectedTicket && (() => {
          const event = selectedTicket.eventId;
          const calUrls = buildCalendarUrls(selectedTicket);
          return (
            <div className="ticket-details">
              {/* Event Info */}
              <div className="detail-section">
                <h4>Event Information</h4>
                <p><strong>Event:</strong> {event?.eventName || "N/A"}</p>
                <p><strong>Type:</strong> {event?.eventType || "N/A"}</p>
                {event?.eventStartDate && (
                  <p><strong>Date:</strong> {formatDate(event.eventStartDate)}</p>
                )}
                {event?.venue && (
                  <p><strong>Venue:</strong> {event.venue}</p>
                )}
                {event?.eventDescription && (
                  <p><strong>Description:</strong> {event.eventDescription}</p>
                )}
              </div>

              {/* Ticket Info */}
              <div className="detail-section">
                <h4>Ticket Information</h4>
                <p><strong>Ticket ID:</strong> <code style={{ background: "rgba(99,102,241,0.1)", padding: "2px 6px", borderRadius: "4px" }}>{selectedTicket.ticketId}</code></p>
                <p>
                  <strong>Status:</strong>{" "}
                  <Badge variant={selectedTicket.status === "active" ? "success" : "info"} size="small">
                    {selectedTicket.status}
                  </Badge>
                </p>
                <p>
                  <strong>Payment:</strong>{" "}
                  <span style={{ color: paymentStatusColor(selectedTicket.paymentStatus) }}>
                    {paymentStatusLabel(selectedTicket.paymentStatus)}
                  </span>
                </p>
                <p><strong>Registered:</strong> {formatDate(selectedTicket.createdAt)}</p>
                <p><strong>Attended:</strong> {selectedTicket.attendance ? `✅ Yes${selectedTicket.attendedAt ? ` (${formatDate(selectedTicket.attendedAt)})` : ""}` : "❌ Not yet"}</p>
              </div>

              {/* Merchandise details */}
              {selectedTicket.purchaseDetails && (
                <div className="detail-section">
                  <h4>Purchase Details</h4>
                  <p><strong>Item:</strong> {selectedTicket.purchaseDetails.name}</p>
                  {selectedTicket.purchaseDetails.size && (
                    <p><strong>Size:</strong> {selectedTicket.purchaseDetails.size}</p>
                  )}
                  {selectedTicket.purchaseDetails.color && (
                    <p><strong>Color:</strong> {selectedTicket.purchaseDetails.color}</p>
                  )}
                  {selectedTicket.purchaseDetails.price > 0 && (
                    <p><strong>Price:</strong> ₹{selectedTicket.purchaseDetails.price}</p>
                  )}
                </div>
              )}

              {/* Payment Proof Upload — merchandise tickets pending payment proof */}
              {event?.eventType === "merchandise" && selectedTicket.paymentStatus === "pending" && (
                <div className="detail-section" style={{ border: "1px solid rgba(245,158,11,0.4)", borderRadius: "8px", padding: "14px", background: "rgba(245,158,11,0.05)" }}>
                  <h4>📤 Upload Payment Proof</h4>
                  <p style={{ color: "#aaa", fontSize: "0.85rem", marginBottom: "12px" }}>
                    Please upload a screenshot or photo of your payment receipt. Accepted formats: JPG, PNG, WEBP (max 5MB).
                  </p>
                  <input
                    ref={proofInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: "none" }}
                    onChange={(e) => setProofFile(e.target.files[0] || null)}
                  />
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <button
                      onClick={() => proofInputRef.current?.click()}
                      style={{
                        padding: "8px 14px", borderRadius: "7px",
                        border: "1px solid #f59e0b", background: "rgba(245,158,11,0.1)",
                        color: "#fbbf24", cursor: "pointer", fontSize: "0.85rem",
                      }}
                    >
                      {proofFile ? `📎 ${proofFile.name}` : "📎 Choose File"}
                    </button>
                    {proofFile && (
                      <button
                        onClick={handleProofUpload}
                        disabled={proofUploading}
                        style={{
                          padding: "8px 16px", borderRadius: "7px",
                          border: "none", background: "#f59e0b",
                          color: "#000", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem",
                        }}
                      >
                        {proofUploading ? "Uploading..." : "Upload Proof"}
                      </button>
                    )}
                  </div>
                  {proofMsg && (
                    <p style={{ marginTop: "8px", color: proofMsg.type === "success" ? "#22c55e" : "#ef4444", fontSize: "0.85rem" }}>
                      {proofMsg.text}
                    </p>
                  )}
                </div>
              )}

              {/* Status message for pending_approval */}
              {event?.eventType === "merchandise" && selectedTicket.paymentStatus === "pending_approval" && (
                <div className="detail-section" style={{ border: "1px solid rgba(245,158,11,0.4)", borderRadius: "8px", padding: "14px", background: "rgba(245,158,11,0.05)" }}>
                  <p style={{ color: "#fbbf24", margin: 0 }}>
                    ⏳ Your payment proof has been submitted and is awaiting organizer approval. You will receive an email once it is reviewed.
                  </p>
                </div>
              )}

              {/* Status message for rejected */}
              {event?.eventType === "merchandise" && selectedTicket.paymentStatus === "rejected" && (
                <div className="detail-section" style={{ border: "1px solid rgba(239,68,68,0.4)", borderRadius: "8px", padding: "14px", background: "rgba(239,68,68,0.05)" }}>
                  <p style={{ color: "#fca5a5", margin: 0 }}>
                    ❌ Your payment was rejected. {selectedTicket.paymentRejectedReason ? `Reason: ${selectedTicket.paymentRejectedReason}` : "Please contact the organizer."}
                  </p>
                </div>
              )}

              {/* QR Code */}
              <div className="detail-section">
                <h4>🔲 QR Code</h4>
                {selectedTicket.qrCode ? (
                  <div style={{ textAlign: "center" }}>
                    <img
                      src={selectedTicket.qrCode}
                      alt={`QR Code for ticket ${selectedTicket.ticketId}`}
                      style={{ width: "180px", height: "180px", borderRadius: "8px", background: "#fff", padding: "8px" }}
                    />
                    <p style={{ color: "#888", fontSize: "0.85rem", marginTop: "8px" }}>
                      Scan this QR code at the event venue
                    </p>
                  </div>
                ) : (
                  <p style={{ color: "#888" }}>
                    {event?.eventType === "merchandise" && selectedTicket.paymentStatus !== "paid"
                      ? "QR code will be generated after payment approval."
                      : "QR code not available for this ticket."}
                  </p>
                )}
              </div>

              {/* Add to Calendar */}
              {calUrls && event?.eventType !== "merchandise" && (
                <div className="detail-section">
                  <h4>📅 Add to Calendar</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "6px" }}>
                    <a href={calUrls.ics} download style={{ padding: "7px 12px", borderRadius: "7px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc", textDecoration: "none", fontSize: "0.82rem" }}>📁 .ics File</a>
                    <a href={calUrls.google} target="_blank" rel="noopener noreferrer" style={{ padding: "7px 12px", borderRadius: "7px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#86efac", textDecoration: "none", fontSize: "0.82rem" }}>🟢 Google</a>
                    <a href={calUrls.outlook} target="_blank" rel="noopener noreferrer" style={{ padding: "7px 12px", borderRadius: "7px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", color: "#93c5fd", textDecoration: "none", fontSize: "0.82rem" }}>🔵 Outlook</a>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>
    </PageContainer>
  );
};

export default Tickets;
