import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { eventAPI } from "../../services/api";
import {
  formatDate,
  formatDateTime,
  formatCurrency,
  isRegistrationOpen,
} from "../../utils/helpers";
import { EVENT_TYPES } from "../../utils/constants";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";
import "./EventDetails.css";

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [registering, setRegistering] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await eventAPI.getById(id);
      setEvent(response.data);

      // Initialize form data for custom fields
      if (response.data.customForm?.fields) {
        const initialData = {};
        response.data.customForm.fields.forEach((field) => {
          initialData[field.name] = "";
        });
        setFormData(initialData);
      }
    } catch (err) {
      setError("Failed to load event details");
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (fieldName, value) => {
    setFormData({ ...formData, [fieldName]: value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegistering(true);

    try {
      if (event.type === EVENT_TYPES.MERCHANDISE) {
        await eventAPI.purchaseMerchandise(id, formData);
        alert(
          "Merchandise purchased successfully! Check your email for the ticket.",
        );
      } else {
        await eventAPI.register(id, formData);
        alert("Registration successful! Check your email for the ticket.");
      }
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    } finally {
      setRegistering(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading event details..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchEvent} />;
  if (!event) return <ErrorMessage message="Event not found" />;

  const registrationOpen = isRegistrationOpen(event);
  const deadlinePassed = new Date(event.registrationDeadline) < new Date();
  const limitReached =
    event.registrationLimit && event.registeredCount >= event.registrationLimit;

  return (
    <div className="event-details-container">
      <div className="event-details-card">
        <div className="event-header">
          <div>
            <h1>{event.name}</h1>
            <p className="event-organizer-name">by {event.organizer?.name}</p>
          </div>
          <span className={`badge badge-${event.type}`}>{event.type}</span>
        </div>

        <div className="event-content">
          <section className="event-section">
            <h2>Description</h2>
            <p className="event-description">{event.description}</p>
          </section>

          <section className="event-section">
            <h2>Event Details</h2>
            <div className="event-info-grid">
              <div className="info-item">
                <strong>Event Type:</strong>
                <span className="capitalize">{event.type}</span>
              </div>
              <div className="info-item">
                <strong>Eligibility:</strong>
                <span className="capitalize">{event.eligibility}</span>
              </div>
              <div className="info-item">
                <strong>Start Date:</strong>
                <span>{formatDateTime(event.startDate)}</span>
              </div>
              <div className="info-item">
                <strong>End Date:</strong>
                <span>{formatDateTime(event.endDate)}</span>
              </div>
              <div className="info-item">
                <strong>Registration Deadline:</strong>
                <span>{formatDateTime(event.registrationDeadline)}</span>
              </div>
              <div className="info-item">
                <strong>Registration Fee:</strong>
                <span>
                  {event.registrationFee > 0
                    ? formatCurrency(event.registrationFee)
                    : "Free"}
                </span>
              </div>
              {event.registrationLimit && (
                <div className="info-item">
                  <strong>Seats Available:</strong>
                  <span>
                    {event.registrationLimit - (event.registeredCount || 0)} /{" "}
                    {event.registrationLimit}
                  </span>
                </div>
              )}
            </div>
          </section>

          {event.tags && event.tags.length > 0 && (
            <section className="event-section">
              <h2>Tags</h2>
              <div className="tags-container">
                {event.tags.map((tag, index) => (
                  <span key={index} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          {event.type === EVENT_TYPES.MERCHANDISE && event.itemDetails && (
            <section className="event-section">
              <h2>Item Details</h2>
              <div className="merchandise-info">
                <p>
                  <strong>Available Stock:</strong> {event.itemDetails.stock}
                </p>
                {event.itemDetails.sizes && (
                  <p>
                    <strong>Sizes:</strong> {event.itemDetails.sizes.join(", ")}
                  </p>
                )}
                {event.itemDetails.colors && (
                  <p>
                    <strong>Colors:</strong>{" "}
                    {event.itemDetails.colors.join(", ")}
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Registration Section */}
          <section className="event-section registration-section">
            {!showRegistrationForm ? (
              <div>
                {deadlinePassed && (
                  <div className="alert alert-error">
                    Registration deadline has passed
                  </div>
                )}
                {limitReached && (
                  <div className="alert alert-error">
                    Registration limit reached
                  </div>
                )}
                {!registrationOpen && !deadlinePassed && (
                  <div className="alert alert-warning">
                    Registration is currently closed
                  </div>
                )}

                <button
                  onClick={() => setShowRegistrationForm(true)}
                  className="btn-primary btn-lg"
                  disabled={!registrationOpen || deadlinePassed || limitReached}
                >
                  {event.type === EVENT_TYPES.MERCHANDISE
                    ? "Purchase Now"
                    : "Register Now"}
                </button>
              </div>
            ) : (
              <div className="registration-form-container">
                <h2>
                  {event.type === EVENT_TYPES.MERCHANDISE
                    ? "Complete Purchase"
                    : "Complete Registration"}
                </h2>
                <form onSubmit={handleRegister} className="registration-form">
                  {event.customForm?.fields?.map((field) => (
                    <div key={field.name} className="form-group">
                      <label htmlFor={field.name}>
                        {field.label}
                        {field.required && <span className="required">*</span>}
                      </label>

                      {field.type === "textarea" ? (
                        <textarea
                          id={field.name}
                          value={formData[field.name] || ""}
                          onChange={(e) =>
                            handleFormChange(field.name, e.target.value)
                          }
                          required={field.required}
                          rows={4}
                        />
                      ) : field.type === "dropdown" ? (
                        <select
                          id={field.name}
                          value={formData[field.name] || ""}
                          onChange={(e) =>
                            handleFormChange(field.name, e.target.value)
                          }
                          required={field.required}
                        >
                          <option value="">Select...</option>
                          {field.options?.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : field.type === "checkbox" ? (
                        <div className="checkbox-group">
                          {field.options?.map((option) => (
                            <label key={option} className="checkbox-label">
                              <input
                                type="checkbox"
                                value={option}
                                onChange={(e) => {
                                  const current = formData[field.name] || [];
                                  if (e.target.checked) {
                                    handleFormChange(field.name, [
                                      ...current,
                                      option,
                                    ]);
                                  } else {
                                    handleFormChange(
                                      field.name,
                                      current.filter((v) => v !== option),
                                    );
                                  }
                                }}
                              />
                              {option}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <input
                          type={field.type}
                          id={field.name}
                          value={formData[field.name] || ""}
                          onChange={(e) =>
                            handleFormChange(field.name, e.target.value)
                          }
                          required={field.required}
                        />
                      )}
                    </div>
                  ))}

                  <div className="form-actions">
                    <button
                      type="button"
                      onClick={() => setShowRegistrationForm(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={registering}
                    >
                      {registering ? "Processing..." : "Confirm"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
