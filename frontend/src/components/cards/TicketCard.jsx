import React from "react";
import Card from "../Card";
import Badge from "../common/Badge";
import Button from "../common/Button";
import "./TicketCard.css";

const TicketCard = ({
  ticket = {},
  event = {},
  showQR = true,
  onViewDetails,
  onDownload,
}) => {
  const {
    ticketId = "TICKET-ID",
    status = "active",
    attendance = false,
    paymentStatus = "pending",
    createdAt,
    purchaseDetails,
  } = ticket;

  const {
    eventName = "Event Name",
    eventStartDate,
    eventType = "normal",
  } = event;

  const getStatusVariant = (status) => {
    switch (status) {
      case "active":
        return "success";
      case "completed":
        return "info";
      case "cancelled":
        return "danger";
      case "rejected":
        return "warning";
      default:
        return "default";
    }
  };

  const getPaymentStatusVariant = (status) => {
    switch (status) {
      case "paid":
        return "success";
      case "pending":
        return "warning";
      case "refunded":
        return "info";
      default:
        return "default";
    }
  };

  const formatDate = (date) => {
    return date ? new Date(date).toLocaleDateString() : "Not set";
  };

  return (
    <Card className="ticket-card">
      <div className="ticket-card__header">
        <div className="ticket-card__title-row">
          <h4 className="ticket-card__title">{eventName}</h4>
          <div className="ticket-card__badges">
            <Badge variant={getStatusVariant(status)}>{status}</Badge>
            {paymentStatus && (
              <Badge variant={getPaymentStatusVariant(paymentStatus)}>
                {paymentStatus}
              </Badge>
            )}
          </div>
        </div>
        <div className="ticket-card__id">Ticket ID: {ticketId}</div>
      </div>

      <div className="ticket-card__details">
        <div className="ticket-card__detail">
          <span className="label">Event Date:</span>
          <span>{formatDate(eventStartDate)}</span>
        </div>
        <div className="ticket-card__detail">
          <span className="label">Registration Date:</span>
          <span>{formatDate(createdAt)}</span>
        </div>
        {eventType === "merchandise" && purchaseDetails && (
          <div className="ticket-card__detail">
            <span className="label">Item:</span>
            <span>
              {purchaseDetails.name} - ₹{purchaseDetails.price}
            </span>
          </div>
        )}
        <div className="ticket-card__detail">
          <span className="label">Attendance:</span>
          <Badge variant={attendance ? "success" : "warning"} size="small">
            {attendance ? "Attended" : "Not Attended"}
          </Badge>
        </div>
      </div>

      {showQR && (
        <div className="ticket-card__qr">
          <div className="qr-placeholder">
            <span>QR Code</span>
            <small>Scan at venue</small>
          </div>
        </div>
      )}

      <div className="ticket-card__actions">
        <Button
          variant="outline"
          size="small"
          onClick={() => onViewDetails && onViewDetails(ticket)}
        >
          View Details
        </Button>
        <Button
          variant="primary"
          size="small"
          onClick={() => onDownload && onDownload(ticket)}
        >
          Download
        </Button>
      </div>
    </Card>
  );
};

export default TicketCard;
