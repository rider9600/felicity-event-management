import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEventApi } from "../hooks/useApi";
import { useApi } from "../hooks/useApi";
import PageContainer from "../components/layout/PageContainer";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import Loading from "../components/common/Loading";
import Modal from "../components/common/Modal";
import Input from "../components/common/Input";
import Forum from "../components/forum/Forum";
import "./EventDetails.css";

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { getEventById } = useEventApi();
  const { apiCall } = useApi();

  const [event, setEvent] = useState(null);
  const [blocking, setBlocking] = useState(null);
  const [canRegister, setCanRegister] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [registrationResult, setRegistrationResult] = useState(null); // { success, message }
  const [registrationData, setRegistrationData] = useState({
    formData: {},
    // For merchandise:
    selectedItem: null, // { name, size, color, variant }
    quantity: 1,
  });

  useEffect(() => {
    loadEventDetails();
  }, [eventId]);

  const loadEventDetails = async () => {
    try {
      setLoading(true);
      const result = await getEventById(eventId);
      if (result.success) {
        setEvent(result.event || result.data?.event || null);
        setBlocking(result.blocking || null);
        setCanRegister(result.canRegister || false);
      } else {
        console.error("Failed to load event details:", result.error || result);
      }
    } catch (error) {
      console.error("Failed to load event details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegistration = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    // Validate merchandise selection
    if (event.eventType === "merchandise" && !registrationData.selectedItem) {
      setRegistrationResult({
        success: false,
        message: "Please select an item to purchase.",
      });
      return;
    }

    try {
      setRegistering(true);
      setRegistrationResult(null);

      let result;

      if (event.eventType === "merchandise") {
        const { name, size, color, variant } = registrationData.selectedItem;
        result = await apiCall("/point/registration/purchase", {
          method: "POST",
          body: JSON.stringify({
            eventId,
            itemName: name,
            size: size || "",
            color: color || "",
            variant: variant || "",
            quantity: registrationData.quantity || 1,
          }),
        });
      } else {
        result = await apiCall("/point/registration/register", {
          method: "POST",
          body: JSON.stringify({
            eventId,
            formData: registrationData.formData,
          }),
        });
      }

      if (
        result &&
        !result.error &&
        (result.msg || result.ticket || result.success)
      ) {
        setRegistrationResult({
          success: true,
          message:
            event.eventType === "merchandise"
              ? "Purchase successful! A confirmation email with your ticket and QR code has been sent."
              : "Registration successful! A confirmation email with your ticket and QR code has been sent.",
        });
        // Refresh event data after a short delay
        setTimeout(() => {
          setShowRegistrationModal(false);
          setRegistrationResult(null);
          loadEventDetails();
        }, 2500);
      } else {
        setRegistrationResult({
          success: false,
          message:
            result?.error ||
            result?.msg ||
            "Registration failed. Please try again.",
        });
      }
    } catch (error) {
      setRegistrationResult({
        success: false,
        message: "Registration failed. Please try again.",
      });
    } finally {
      setRegistering(false);
    }
  };

  const getEventStatusVariant = (status) => {
    switch (status) {
      case "upcoming":
        return "primary";
      case "published":
        return "primary";
      case "ongoing":
        return "success";
      case "completed":
        return "secondary";
      case "cancelled":
        return "danger";
      default:
        return "default";
    }
  };

  // Format a full ISO date string to a human-readable date
  const formatDate = (isoString) => {
    if (!isoString) return "TBD";
    const d = new Date(isoString);
    if (isNaN(d)) return "TBD";
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format a full ISO date string to just the time portion
  const formatTime = (isoString) => {
    if (!isoString) return "TBD";
    const d = new Date(isoString);
    if (isNaN(d)) return "TBD";
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <PageContainer>
        <Loading size="large" />
      </PageContainer>
    );
  }

  if (!event) {
    return (
      <PageContainer>
        <div className="event-not-found">
          <h2>Event Not Found</h2>
          <p>The event you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate("/events")}>Back to Events</Button>
        </div>
      </PageContainer>
    );
  }

  const getBlockingMessage = () => {
    if (!blocking) return null;
    if (blocking.deadlinePassed) return "Registration deadline has passed";
    if (blocking.registrationLimitExhausted)
      return "Registration limit has been reached";
    if (blocking.outOfStock) return "All items are out of stock";
    return blocking.reason;
  };

  // Build calendar export links/URL
  const buildCalendarUrls = () => {
    if (!event) return null;
    const title = encodeURIComponent(event.eventName || "Event");
    const details = encodeURIComponent(event.eventDescription || "");
    const location = encodeURIComponent(event.venue || "");
    const toGCal = (d) =>
      new Date(d).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const start = event.eventStartDate ? toGCal(event.eventStartDate) : "";
    const end = event.eventEndDate ? toGCal(event.eventEndDate) : start;
    const startISO = event.eventStartDate
      ? new Date(event.eventStartDate).toISOString()
      : "";
    const endISO = event.eventEndDate
      ? new Date(event.eventEndDate).toISOString()
      : startISO;
    return {
      ics: `http://localhost:5000/point/events/${eventId}/calendar.ics`,
      google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`,
      outlook: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${encodeURIComponent(startISO)}&enddt=${encodeURIComponent(endISO)}&body=${details}&location=${location}`,
    };
  };
  const calendarUrls = buildCalendarUrls();

  const availableItems =
    event.merchandise?.items?.filter((i) => i.stock > 0) || [];

  return (
    <PageContainer>
      <div className="event-details">
        {/* Event Header */}
        <div className="event-details__header">
          <Button
            variant="ghost"
            onClick={() => navigate("/events")}
            className="back-button"
          >
            ← Back to Events
          </Button>

          <div className="event-details__hero">
            <div className="event-details__hero-content">
              <h1 className="event-details__title">{event.eventName}</h1>
              <div className="event-details__meta">
                <Badge
                  variant={getEventStatusVariant(event.status)}
                  size="large"
                >
                  {event.status}
                </Badge>
                {event.eventType && (
                  <Badge variant="secondary" size="large">
                    {event.eventType === "merchandise"
                      ? "🛍️ Merchandise"
                      : "🎟️ Normal Event"}
                  </Badge>
                )}
                <span className="event-details__club">
                  by{" "}
                  {event.organizerId?.organizerName ||
                    `${event.organizerId?.firstname || ""} ${event.organizerId?.lastname || ""}`.trim() ||
                    event.club?.clubName}
                </span>
              </div>
            </div>

            {event.eventImage && (
              <img
                src={event.eventImage}
                alt={event.eventName}
                className="event-details__image"
              />
            )}
          </div>
        </div>

        {/* Event Information */}
        <div className="event-details__content">
          <div className="event-details__main">
            {/* Description */}
            <section className="event-section">
              <h3>About This Event</h3>
              <p className="event-details__description">
                {event.eventDescription}
              </p>
            </section>

            {/* Event Details */}
            <section className="event-section">
              <h3>Event Details</h3>
              <div className="event-details__info-grid">
                <div className="info-item">
                  <div className="info-label">📅 Start Date</div>
                  <div className="info-value">
                    {formatDate(event.eventStartDate)}
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-label">📅 End Date</div>
                  <div className="info-value">
                    {formatDate(event.eventEndDate)}
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-label">⏰ Start Time</div>
                  <div className="info-value">
                    {formatTime(event.eventStartDate)}
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-label">⏰ End Time</div>
                  <div className="info-value">
                    {formatTime(event.eventEndDate)}
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-label">📍 Venue</div>
                  <div className="info-value">{event.venue || "TBD"}</div>
                </div>

                <div className="info-item">
                  <div className="info-label">👥 Capacity</div>
                  <div className="info-value">
                    {event.registrationCount || 0} /{" "}
                    {event.registrationLimit || "Unlimited"} registered
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-label">📋 Registration Deadline</div>
                  <div className="info-value">
                    {formatDate(event.registrationDeadline)}
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-label">💰 Registration Fee</div>
                  <div className="info-value">
                    {event.registrationFee > 0
                      ? `₹${event.registrationFee}`
                      : "Free"}
                  </div>
                </div>

                {event.eligibility && (
                  <div className="info-item">
                    <div className="info-label">🎓 Eligibility</div>
                    <div className="info-value">{event.eligibility}</div>
                  </div>
                )}

                {event.eventTags?.length > 0 && (
                  <div className="info-item" style={{ gridColumn: "1 / -1" }}>
                    <div className="info-label">🏷️ Tags</div>
                    <div
                      className="info-value"
                      style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
                    >
                      {event.eventTags.map((tag) => (
                        <Badge key={tag} variant="default">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Merchandise Items */}
            {event.eventType === "merchandise" &&
              event.merchandise?.items?.length > 0 && (
                <section className="event-section">
                  <h3>🛍️ Merchandise Items</h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(220px, 1fr))",
                      gap: "12px",
                    }}
                  >
                    {event.merchandise.items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: "var(--card-bg, #1a1a2e)",
                          border: "1px solid var(--border-color, #2a2a4a)",
                          borderRadius: "10px",
                          padding: "14px",
                        }}
                      >
                        <p style={{ margin: "0 0 4px", fontWeight: 600 }}>
                          {item.name}
                        </p>
                        {item.size && (
                          <p
                            style={{
                              margin: "0 0 2px",
                              color: "#aaa",
                              fontSize: "0.85rem",
                            }}
                          >
                            Size: {item.size}
                          </p>
                        )}
                        {item.color && (
                          <p
                            style={{
                              margin: "0 0 2px",
                              color: "#aaa",
                              fontSize: "0.85rem",
                            }}
                          >
                            Color: {item.color}
                          </p>
                        )}
                        {item.variant && (
                          <p
                            style={{
                              margin: "0 0 2px",
                              color: "#aaa",
                              fontSize: "0.85rem",
                            }}
                          >
                            Variant: {item.variant}
                          </p>
                        )}
                        <p
                          style={{
                            margin: "4px 0 0",
                            color: item.stock > 0 ? "#22c55e" : "#ef4444",
                            fontSize: "0.85rem",
                          }}
                        >
                          {item.stock > 0
                            ? `${item.stock} in stock`
                            : "Out of stock"}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
          </div>

          {/* Registration Sidebar */}
          <div className="event-details__sidebar">
            <div className="registration-card">
              <h4>Registration Status</h4>

              {!isAuthenticated ? (
                <div className="registration-prompt">
                  <p>Please login to register for this event</p>
                  <Button onClick={() => navigate("/login")}>
                    Login to Register
                  </Button>
                </div>
              ) : event.status === "completed" ? (
                <div className="registration-closed">
                  <p>🎉 This event has ended</p>
                </div>
              ) : event.status === "cancelled" ? (
                <div className="registration-closed">
                  <p>❌ This event has been cancelled</p>
                </div>
              ) : blocking?.deadlinePassed ? (
                <div className="registration-blocked">
                  <p>📅 {getBlockingMessage()}</p>
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => navigate("/events")}
                  >
                    View Other Events
                  </Button>
                </div>
              ) : blocking?.registrationLimitExhausted ? (
                <div className="registration-blocked">
                  <p>👥 {getBlockingMessage()}</p>
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => navigate("/events")}
                  >
                    View Other Events
                  </Button>
                </div>
              ) : blocking?.outOfStock ? (
                <div className="registration-blocked">
                  <p>📦 {getBlockingMessage()}</p>
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => navigate("/events")}
                  >
                    View Other Events
                  </Button>
                </div>
              ) : canRegister ? (
                <div className="registration-available">
                  <div className="price-display">
                    {event.eventType === "merchandise" ? (
                      <span className="price">🛍️ Merchandise Purchase</span>
                    ) : event.registrationFee > 0 ? (
                      <span className="price">₹{event.registrationFee}</span>
                    ) : (
                      <span className="price">Free Event</span>
                    )}
                  </div>

                  {event.registrationLimit > 0 && (
                    <div className="slots-remaining">
                      {event.registrationLimit - (event.registrationCount || 0)}{" "}
                      spots remaining
                    </div>
                  )}

                  <Button
                    variant="primary"
                    size="large"
                    onClick={() => {
                      setRegistrationResult(null);
                      setShowRegistrationModal(true);
                    }}
                    disabled={registering}
                  >
                    {event.eventType === "merchandise"
                      ? "Purchase Now"
                      : "Register Now"}
                  </Button>
                </div>
              ) : (
                <div className="registration-unavailable">
                  <p>Registration not available</p>
                </div>
              )}
            </div>

            {/* Add to Calendar Card */}
            {calendarUrls && (
              <div className="registration-card" style={{ marginTop: "16px" }}>
                <h4>📅 Add to Calendar</h4>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    marginTop: "8px",
                  }}
                >
                  <a
                    href={calendarUrls.ics}
                    download
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: "rgba(99,102,241,0.1)",
                      border: "1px solid rgba(99,102,241,0.3)",
                      color: "#a5b4fc",
                      textDecoration: "none",
                      fontSize: "0.9rem",
                      fontWeight: 500,
                      transition: "background 0.2s",
                    }}
                  >
                    📁 Download .ics File
                  </a>
                  <a
                    href={calendarUrls.google}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: "rgba(34,197,94,0.1)",
                      border: "1px solid rgba(34,197,94,0.3)",
                      color: "#86efac",
                      textDecoration: "none",
                      fontSize: "0.9rem",
                      fontWeight: 500,
                    }}
                  >
                    🟢 Google Calendar
                  </a>
                  <a
                    href={calendarUrls.outlook}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: "rgba(59,130,246,0.1)",
                      border: "1px solid rgba(59,130,246,0.3)",
                      color: "#93c5fd",
                      textDecoration: "none",
                      fontSize: "0.9rem",
                      fontWeight: 500,
                    }}
                  >
                    🔵 Microsoft Outlook
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Registration / Purchase Modal */}
      <Modal
        isOpen={showRegistrationModal}
        onClose={() => {
          setShowRegistrationModal(false);
          setRegistrationResult(null);
        }}
        title={
          event.eventType === "merchandise"
            ? "Complete Your Purchase"
            : "Complete Your Registration"
        }
        size="medium"
        footer={
          registrationResult?.success ? null : (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowRegistrationModal(false);
                  setRegistrationResult(null);
                }}
                disabled={registering}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleRegistration}
                disabled={registering}
              >
                {registering
                  ? "Processing..."
                  : event.eventType === "merchandise"
                    ? "Confirm Purchase"
                    : "Complete Registration"}
              </Button>
            </>
          )
        }
      >
        <div className="registration-form">
          {/* Result message */}
          {registrationResult && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                marginBottom: "16px",
                background: registrationResult.success
                  ? "rgba(34,197,94,0.15)"
                  : "rgba(239,68,68,0.15)",
                border: `1px solid ${registrationResult.success ? "#22c55e" : "#ef4444"}`,
                color: registrationResult.success ? "#22c55e" : "#ef4444",
              }}
            >
              {registrationResult.success ? "✅ " : "❌ "}
              {registrationResult.message}
            </div>
          )}

          {/* Merchandise item selector */}
          {event.eventType === "merchandise" &&
            !registrationResult?.success && (
              <div className="form-group">
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: 500,
                  }}
                >
                  Select Item *
                </label>
                {availableItems.length === 0 ? (
                  <p style={{ color: "#ef4444" }}>No items in stock.</p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    {availableItems.map((item, idx) => {
                      const isSelected =
                        registrationData.selectedItem?.name === item.name &&
                        registrationData.selectedItem?.size === item.size &&
                        registrationData.selectedItem?.color === item.color &&
                        registrationData.selectedItem?.variant === item.variant;
                      const maxQty = Math.min(
                        item.purchaseLimit || item.stock,
                        item.stock,
                      );
                      return (
                        <div
                          key={idx}
                          onClick={() =>
                            setRegistrationData((prev) => ({
                              ...prev,
                              selectedItem: item,
                              quantity: 1,
                            }))
                          }
                          style={{
                            padding: "12px",
                            border: `2px solid ${isSelected ? "#6366f1" : "var(--border-color, #2a2a4a)"}`,
                            borderRadius: "8px",
                            cursor: "pointer",
                            background: isSelected
                              ? "rgba(99,102,241,0.1)"
                              : "transparent",
                            transition: "all 0.2s",
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
                              <strong>{item.name}</strong>
                              {item.size && (
                                <span
                                  style={{ marginLeft: "8px", color: "#aaa" }}
                                >
                                  Size: {item.size}
                                </span>
                              )}
                              {item.color && (
                                <span
                                  style={{ marginLeft: "8px", color: "#aaa" }}
                                >
                                  Color: {item.color}
                                </span>
                              )}
                              {item.variant && (
                                <span
                                  style={{ marginLeft: "8px", color: "#aaa" }}
                                >
                                  {item.variant}
                                </span>
                              )}
                            </div>
                            <span
                              style={{
                                color: "#22c55e",
                                fontSize: "0.85rem",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {item.stock} in stock
                            </span>
                          </div>

                          {/* Quantity controls — only when this item is selected */}
                          {isSelected && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                marginTop: "10px",
                              }}
                              onClick={(e) => e.stopPropagation()} // don't deselect when clicking controls
                            >
                              <span
                                style={{ fontSize: "0.85rem", color: "#aaa" }}
                              >
                                Quantity:
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setRegistrationData((prev) => ({
                                    ...prev,
                                    quantity: Math.max(1, prev.quantity - 1),
                                  }))
                                }
                                disabled={registrationData.quantity <= 1}
                                style={{
                                  width: "28px",
                                  height: "28px",
                                  borderRadius: "6px",
                                  border: "1px solid #6366f1",
                                  background: "transparent",
                                  color: "#6366f1",
                                  cursor: "pointer",
                                  fontSize: "1rem",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  opacity:
                                    registrationData.quantity <= 1 ? 0.4 : 1,
                                }}
                              >
                                −
                              </button>
                              <span
                                style={{
                                  minWidth: "28px",
                                  textAlign: "center",
                                  fontWeight: 700,
                                  fontSize: "1rem",
                                }}
                              >
                                {registrationData.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setRegistrationData((prev) => ({
                                    ...prev,
                                    quantity: Math.min(
                                      maxQty,
                                      prev.quantity + 1,
                                    ),
                                  }))
                                }
                                disabled={registrationData.quantity >= maxQty}
                                style={{
                                  width: "28px",
                                  height: "28px",
                                  borderRadius: "6px",
                                  border: "1px solid #6366f1",
                                  background: "transparent",
                                  color: "#6366f1",
                                  cursor: "pointer",
                                  fontSize: "1rem",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  opacity:
                                    registrationData.quantity >= maxQty
                                      ? 0.4
                                      : 1,
                                }}
                              >
                                +
                              </button>
                              <span
                                style={{ fontSize: "0.8rem", color: "#888" }}
                              >
                                (max {maxQty})
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          {/* Normal event summary */}
          {event.eventType !== "merchandise" &&
            !registrationResult?.success && (
              <div className="registration-summary">
                <h5>Registration Summary</h5>
                <div className="summary-row">
                  <span>Event:</span>
                  <span>{event.eventName}</span>
                </div>
                <div className="summary-row">
                  <span>Date:</span>
                  <span>{formatDate(event.eventStartDate)}</span>
                </div>
                <div className="summary-row">
                  <span>Venue:</span>
                  <span>{event.venue || "TBD"}</span>
                </div>
                <div className="summary-row">
                  <span>Fee:</span>
                  <span>
                    {event.registrationFee > 0
                      ? `₹${event.registrationFee}`
                      : "Free"}
                  </span>
                </div>
              </div>
            )}

          {/* Merchandise summary */}
          {event.eventType === "merchandise" &&
            registrationData.selectedItem &&
            !registrationResult?.success && (
              <div
                className="registration-summary"
                style={{ marginTop: "16px" }}
              >
                <h5>Purchase Summary</h5>
                <div className="summary-row">
                  <span>Event:</span>
                  <span>{event.eventName}</span>
                </div>
                <div className="summary-row">
                  <span>Item:</span>
                  <span>{registrationData.selectedItem.name}</span>
                </div>
                {registrationData.selectedItem.size && (
                  <div className="summary-row">
                    <span>Size:</span>
                    <span>{registrationData.selectedItem.size}</span>
                  </div>
                )}
                {registrationData.selectedItem.color && (
                  <div className="summary-row">
                    <span>Color:</span>
                    <span>{registrationData.selectedItem.color}</span>
                  </div>
                )}
                <div className="summary-row">
                  <span>Quantity:</span>
                  <span style={{ fontWeight: 700, color: "#6366f1" }}>
                    × {registrationData.quantity}
                  </span>
                </div>
              </div>
            )}
        </div>
      </Modal>

      {/* Event Discussion Forum */}
      {isAuthenticated && event && (
        <div style={{ marginTop: "40px" }}>
          <Forum eventId={eventId} />
        </div>
      )}
    </PageContainer>
  );
};

export default EventDetails;
