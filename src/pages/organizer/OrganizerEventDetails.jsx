import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { organizerAPI } from "../../services/api";
import { formatDate, formatCurrency } from "../../utils/helpers";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";
import { EVENT_STATUS } from "../../utils/constants";
import "./CreateEvent.css";

const OrganizerEventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const res = await organizerAPI.getMyEvents();
      const evt = res.data.find((e) => e._id === id);
      if (!evt) return setError("Event not found");
      setEvent(evt);
    } catch (err) {
      setError("Failed to load event");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading event..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchEvent} />;

  return (
    <div className="create-event-container">
      <div className="create-event-header">
        <h1>{event.name}</h1>
        <div style={{ display: "flex", gap: "8px" }}>
          <Link to={`/organizer/events/${id}/edit`} className="btn-primary">
            Edit
          </Link>
        </div>
      </div>

      <div className="create-event-card">
        <section className="form-section">
          <h2>Details</h2>
          <p>{event.description}</p>
          <p>
            <strong>Type:</strong> {event.type}
          </p>
          <p>
            <strong>Eligibility:</strong> {event.eligibility}
          </p>
          <p>
            <strong>Start:</strong> {formatDate(event.startDate)}
          </p>
          <p>
            <strong>End:</strong> {formatDate(event.endDate)}
          </p>
          <p>
            <strong>Registration Deadline:</strong>{" "}
            {formatDate(event.registrationDeadline)}
          </p>
          <p>
            <strong>Registrations:</strong> {event.registeredCount || 0}
          </p>
          {event.registrationFee > 0 && (
            <p>
              <strong>Fee:</strong> {formatCurrency(event.registrationFee)}
            </p>
          )}
          <p>
            <strong>Status:</strong>{" "}
            <span className={`status-badge status-${event.status}`}>
              {event.status}
            </span>
          </p>
        </section>

        <section className="form-section">
          <h2>Custom Form</h2>
          {event.customForm?.fields?.length ? (
            <ul>
              {event.customForm.fields.map((f, idx) => (
                <li key={idx}>
                  {f.label} ({f.name})
                </li>
              ))}
            </ul>
          ) : (
            <p>No custom fields</p>
          )}
        </section>

        <div className="form-actions">
          <button
            className="btn-secondary"
            onClick={() => navigate("/organizer/dashboard")}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrganizerEventDetails;
