import React from "react";
import { useNavigate } from "react-router-dom";
import Card from "../Card";
import Button from "../common/Button";
import Badge from "../common/Badge";
import "./EventCard.css";

const EventCard = ({
  event = {},
  onRegister,
  onEdit,
  onDelete,
  onPublish,
  showActions = true,
  userRole = "participant",
  currentUserId,
}) => {
  const navigate = useNavigate();

  const {
    _id,
    eventName = "Event Name",
    eventDescription = "Event description...",
    eventType = "normal",
    eventStartDate,
    eventEndDate,
    registrationDeadline,
    registrationLimit,
    registrationCount = 0,
    registrationFee = 0,
    status = "draft",
    organizerId = {},
  } = event;

  const handleViewDetails = () => {
    if (userRole === "organizer") {
      navigate(`/organizer/events/${_id || event.id}`);
    } else {
      navigate(`/events/${_id || event.id}`);
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "published":
        return "success";
      case "ongoing":
        return "primary";
      case "completed":
        return "info";
      case "closed":
        return "danger";
      case "draft":
        return "warning";
      default:
        return "secondary";
    }
  };

  const getTimeStatus = () => {
    if (!eventStartDate || !eventEndDate) return null;

    // Get precise current time
    const now = new Date();
    const startDate = new Date(eventStartDate);
    const endDate = new Date(eventEndDate);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return null;
    }

    // Calculate precise time differences
    const timeToStart = startDate.getTime() - now.getTime();
    const timeToEnd = endDate.getTime() - now.getTime();
    const timeSinceEnd = now.getTime() - endDate.getTime();

    // Grace period: 30 minutes
    const gracePeriod = 30 * 60 * 1000;

    if (timeToStart > 0) {
      // Event hasn't started - show time until start
      const hoursToStart = Math.floor(timeToStart / (1000 * 60 * 60));
      const minutesToStart = Math.floor(
        (timeToStart % (1000 * 60 * 60)) / (1000 * 60),
      );

      let timeLabel = "Upcoming";
      if (hoursToStart < 1 && minutesToStart <= 30) {
        timeLabel = `Starting in ${minutesToStart}m`;
      } else if (hoursToStart < 24) {
        timeLabel = `Starts in ${hoursToStart}h ${minutesToStart}m`;
      }

      return { label: timeLabel, variant: "info" };
    } else if (timeToEnd > 0) {
      // Event is ongoing - show time until end
      const hoursToEnd = Math.floor(timeToEnd / (1000 * 60 * 60));
      const minutesToEnd = Math.floor(
        (timeToEnd % (1000 * 60 * 60)) / (1000 * 60),
      );

      let timeLabel = "Ongoing";
      if (hoursToEnd < 1) {
        timeLabel = `Ends in ${minutesToEnd}m`;
      } else {
        timeLabel = `Ends in ${hoursToEnd}h ${minutesToEnd}m`;
      }

      return { label: timeLabel, variant: "primary" };
    } else if (timeSinceEnd <= gracePeriod) {
      // Recently ended, still in grace period
      const minutesSinceEnd = Math.floor(timeSinceEnd / (1000 * 60));
      return { label: `Ended ${minutesSinceEnd}m ago`, variant: "warning" };
    } else {
      // Event completed
      return { label: "Completed", variant: "secondary" };
    }
  };

  const isRegistrationOpen = () => {
    if (status !== "published") return false;

    const now = new Date();
    const deadline = registrationDeadline
      ? new Date(registrationDeadline)
      : null;
    const startDate = eventStartDate ? new Date(eventStartDate) : null;

    // Precise time checking for registration
    // Registration closes at deadline OR when event starts (whichever comes first)
    if (deadline && now.getTime() > deadline.getTime()) {
      console.log(
        `Registration closed: Past deadline (${deadline.toLocaleString()})`,
      );
      return false;
    }

    if (startDate && now.getTime() > startDate.getTime()) {
      console.log(
        `Registration closed: Event already started (${startDate.toLocaleString()})`,
      );
      return false;
    }

    // Check if event is at capacity
    if (registrationLimit && registrationCount >= registrationLimit) {
      console.log(
        `Registration closed: Event at capacity (${registrationCount}/${registrationLimit})`,
      );
      return false;
    }

    return true;
  };

  const formatDate = (date) => {
    return date ? new Date(date).toLocaleDateString() : "Not set";
  };

  const getRegistrationTimeInfo = () => {
    if (!registrationDeadline || status !== "published") return null;

    const now = new Date();
    const deadline = new Date(registrationDeadline);

    if (isNaN(deadline.getTime())) return null;

    const timeToDeadline = deadline.getTime() - now.getTime();

    if (timeToDeadline <= 0) {
      return { message: "Registration closed", type: "expired" };
    }

    const days = Math.floor(timeToDeadline / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeToDeadline % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor(
      (timeToDeadline % (1000 * 60 * 60)) / (1000 * 60),
    );

    let message = "";
    if (days > 0) {
      message = `${days}d ${hours}h left to register`;
    } else if (hours > 0) {
      message = `${hours}h ${minutes}m left to register`;
    } else {
      message = `${minutes}m left to register`;
    }

    // Determine urgency
    const type = timeToDeadline < 24 * 60 * 60 * 1000 ? "urgent" : "normal"; // Less than 24 hours

    return { message, type };
  };

  const renderActions = () => {
    if (!showActions) return null;

    if (userRole === "participant") {
      const timeStatus = getTimeStatus();
      const canRegister = isRegistrationOpen();

      return (
        <div className="event-card__actions">
          <Button variant="outline" size="small" onClick={handleViewDetails}>
            View Details
          </Button>
          <Button
            variant="primary"
            size="small"
            onClick={() => onRegister && onRegister(event)}
            disabled={!canRegister}
            title={
              !canRegister ? "Registration closed or event has started" : ""
            }
          >
            {eventType === "merchandise" ? "Purchase" : "Register"}
          </Button>
        </div>
      );
    }

    if (userRole === "organizer") {
      const isOwner =
        currentUserId &&
        (event.organizerId?._id === currentUserId ||
          event.organizerId === currentUserId);

      return (
        <div className="event-card__actions">
          <Button variant="outline" size="small" onClick={handleViewDetails}>
            View Details
          </Button>
          {isOwner && (
            <>
              {event.status === "draft" && (
                <Button
                  variant="success"
                  size="small"
                  onClick={() => onPublish && onPublish(event)}
                >
                  Publish
                </Button>
              )}
              <Button
                variant="outline"
                size="small"
                onClick={() => onEdit && onEdit(event)}
              >
                Edit
              </Button>
              <Button
                variant="danger"
                size="small"
                onClick={() => onDelete && onDelete(event)}
              >
                Delete
              </Button>
            </>
          )}
        </div>
      );
    }

    if (userRole === "admin") {
      return (
        <div className="event-card__actions">
          <Button variant="outline" size="small" onClick={handleViewDetails}>
            View Details
          </Button>
          <Button
            variant="outline"
            size="small"
            onClick={() => onEdit && onEdit(event)}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="small"
            onClick={() => onDelete && onDelete(event)}
          >
            Delete
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <Card className="event-card">
      <div className="event-card__header">
        <div className="event-card__title-row">
          <h4 className="event-card__title">{eventName}</h4>
          <div className="event-card__badges">
            <Badge variant={getStatusVariant(status)}>{status}</Badge>
            {(() => {
              const timeStatus = getTimeStatus();
              return timeStatus ? (
                <Badge variant={timeStatus.variant}>{timeStatus.label}</Badge>
              ) : null;
            })()}
            {(() => {
              // Registration status badge for published events
              if (status === "published") {
                const canReg = isRegistrationOpen();
                if (canReg) {
                  return <Badge variant="success">Registration Open</Badge>;
                } else {
                  return <Badge variant="danger">Registration Closed</Badge>;
                }
              }
              return null;
            })()}
            <Badge variant="light">{eventType}</Badge>
          </div>
        </div>
        <p className="event-card__description">{eventDescription}</p>
      </div>

      <div className="event-card__details">
        <div className="event-card__detail">
          <span className="label">Start Date:</span>
          <span>{formatDate(eventStartDate)}</span>
        </div>
        {eventEndDate && eventStartDate !== eventEndDate && (
          <div className="event-card__detail">
            <span className="label">End Date:</span>
            <span>{formatDate(eventEndDate)}</span>
          </div>
        )}
        <div className="event-card__detail">
          <span className="label">Registration Deadline:</span>
          <span>{formatDate(registrationDeadline)}</span>
        </div>
        {(() => {
          const regTimeInfo = getRegistrationTimeInfo();
          return regTimeInfo ? (
            <div className="event-card__detail">
              <span className="label">Registration Time:</span>
              <span
                style={{
                  color:
                    regTimeInfo.type === "urgent"
                      ? "red"
                      : regTimeInfo.type === "expired"
                        ? "gray"
                        : "green",
                  fontWeight: regTimeInfo.type === "urgent" ? "bold" : "normal",
                }}
              >
                {regTimeInfo.message}
              </span>
            </div>
          ) : null;
        })()}
        <div className="event-card__detail">
          <span className="label">Fee:</span>
          <span>{registrationFee === 0 ? "Free" : `₹${registrationFee}`}</span>
        </div>
        {registrationLimit && (
          <div className="event-card__detail">
            <span className="label">Capacity:</span>
            <span>
              {registrationCount}/{registrationLimit}
              {registrationLimit - registrationCount <= 10 &&
                registrationLimit - registrationCount > 0 && (
                  <span style={{ color: "orange", marginLeft: "4px" }}>
                    (Only {registrationLimit - registrationCount} spots left!)
                  </span>
                )}
              {registrationCount >= registrationLimit && (
                <span style={{ color: "red", marginLeft: "4px" }}>(Full)</span>
              )}
            </span>
          </div>
        )}
      </div>

      {renderActions()}
    </Card>
  );
};

export default EventCard;
