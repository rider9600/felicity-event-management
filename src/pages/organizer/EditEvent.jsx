import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { organizerAPI } from "../../services/api";
import {
  EVENT_TYPES,
  EVENT_STATUS,
  FORM_FIELD_TYPES,
} from "../../utils/constants";
import { isDateBefore } from "../../utils/validators";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";
import "./CreateEvent.css";

const EditEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: EVENT_TYPES.NORMAL,
    eligibility: "all",
    registrationDeadline: "",
    startDate: "",
    endDate: "",
    registrationLimit: "",
    registrationFee: 0,
    tags: "",
  });
  const [customFields, setCustomFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const res = await organizerAPI.getMyEvents();
      const evt = res.data.find((e) => e._id === id);
      if (!evt) {
        setError("Event not found");
        return;
      }
      setFormData({
        name: evt.name || "",
        description: evt.description || "",
        type: evt.type || EVENT_TYPES.NORMAL,
        eligibility: evt.eligibility || "all",
        registrationDeadline: evt.registrationDeadline || "",
        startDate: evt.startDate || "",
        endDate: evt.endDate || "",
        registrationLimit: evt.registrationLimit || "",
        registrationFee: evt.registrationFee || 0,
        tags: (evt.tags || []).join(", "),
      });
      setCustomFields(evt.customForm?.fields || []);
    } catch (err) {
      setError("Failed to load event");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addCustomField = () => {
    setCustomFields([
      ...customFields,
      {
        name: "",
        label: "",
        type: FORM_FIELD_TYPES.TEXT,
        required: false,
        options: [],
      },
    ]);
  };

  const updateCustomField = (index, field, value) => {
    const updated = [...customFields];
    updated[index][field] = value;
    setCustomFields(updated);
  };

  const removeCustomField = (index) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!formData.name || !formData.description) {
      setError("Name and description are required");
      return false;
    }

    if (!isDateBefore(formData.registrationDeadline, formData.startDate)) {
      setError("Registration deadline must be before event start date");
      return false;
    }

    if (!isDateBefore(formData.startDate, formData.endDate)) {
      setError("Start date must be before end date");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e, status) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    setError("");

    try {
      const eventData = {
        ...formData,
        status,
        tags: formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t),
        customForm: customFields.length > 0 ? { fields: customFields } : null,
      };

      await organizerAPI.updateEvent(id, eventData);
      navigate("/organizer/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update event");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      setSaving(true);
      await organizerAPI.publishEvent(id);
      navigate("/organizer/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to publish event");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading event..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchEvent} />;

  return (
    <div className="create-event-container">
      <div className="create-event-header">
        <h1>Edit Event</h1>
      </div>

      <div className="create-event-card">
        <form className="event-form">
          {/* reuse same layout as CreateEvent */}
          <section className="form-section">
            <h2>Basic Information</h2>
            <div className="form-group">
              <label htmlFor="name">Event Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">Event Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="type">Event Type *</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                >
                  <option value={EVENT_TYPES.NORMAL}>Normal Event</option>
                  <option value={EVENT_TYPES.MERCHANDISE}>Merchandise</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="eligibility">Eligibility *</label>
                <select
                  id="eligibility"
                  name="eligibility"
                  value={formData.eligibility}
                  onChange={handleChange}
                  required
                >
                  <option value="all">Open to All</option>
                  <option value="iiit">IIIT Only</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="tags">Tags (comma-separated)</label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="technology, workshop, free"
              />
            </div>
          </section>

          <section className="form-section">
            <h2>Schedule</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Registration Deadline *</label>
                <input
                  type="datetime-local"
                  name="registrationDeadline"
                  value={formData.registrationDeadline}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Event Start Date *</label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Event End Date *</label>
              <input
                type="datetime-local"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
              />
            </div>
          </section>

          <section className="form-section">
            <h2>Registration Details</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Registration Limit (optional)</label>
                <input
                  type="number"
                  name="registrationLimit"
                  value={formData.registrationLimit}
                  onChange={handleChange}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Registration Fee (₹)</label>
                <input
                  type="number"
                  name="registrationFee"
                  value={formData.registrationFee}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </div>
            </div>
          </section>

          {formData.type === EVENT_TYPES.NORMAL && (
            <section className="form-section">
              <h2>Custom Registration Form</h2>
              {customFields.map((field, index) => (
                <div key={index} className="custom-field-builder">
                  <div className="custom-field-header">
                    <h4>Field {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeCustomField(index)}
                      className="btn-danger btn-sm"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Field Label</label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) =>
                          updateCustomField(index, "label", e.target.value)
                        }
                        placeholder="e.g., Team Name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Field Name (no spaces)</label>
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) =>
                          updateCustomField(
                            index,
                            "name",
                            e.target.value.replace(/\s/g, "_"),
                          )
                        }
                        placeholder="e.g., team_name"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Field Type</label>
                      <select
                        value={field.type}
                        onChange={(e) =>
                          updateCustomField(index, "type", e.target.value)
                        }
                      >
                        <option value={FORM_FIELD_TYPES.TEXT}>Text</option>
                        <option value={FORM_FIELD_TYPES.TEXTAREA}>
                          Textarea
                        </option>
                        <option value={FORM_FIELD_TYPES.EMAIL}>Email</option>
                        <option value={FORM_FIELD_TYPES.NUMBER}>Number</option>
                        <option value={FORM_FIELD_TYPES.DATE}>Date</option>
                        <option value={FORM_FIELD_TYPES.DROPDOWN}>
                          Dropdown
                        </option>
                        <option value={FORM_FIELD_TYPES.CHECKBOX}>
                          Checkbox
                        </option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) =>
                            updateCustomField(
                              index,
                              "required",
                              e.target.checked,
                            )
                          }
                        />
                        Required Field
                      </label>
                    </div>
                  </div>

                  {(field.type === FORM_FIELD_TYPES.DROPDOWN ||
                    field.type === FORM_FIELD_TYPES.CHECKBOX) && (
                    <div className="form-group">
                      <label>Options (comma-separated)</label>
                      <input
                        type="text"
                        value={field.options.join(", ")}
                        onChange={(e) =>
                          updateCustomField(
                            index,
                            "options",
                            e.target.value.split(",").map((o) => o.trim()),
                          )
                        }
                        placeholder="Option 1, Option 2"
                      />
                    </div>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={addCustomField}
                className="btn-secondary"
              >
                + Add Custom Field
              </button>
            </section>
          )}

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate("/organizer/dashboard")}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, EVENT_STATUS.DRAFT)}
              className="btn-secondary"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save as Draft"}
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, EVENT_STATUS.PUBLISHED)}
              className="btn-primary"
              disabled={saving}
            >
              {saving ? "Updating..." : "Update & Publish"}
            </button>
            <button
              type="button"
              onClick={handlePublish}
              className="btn-primary"
              disabled={saving}
            >
              {saving ? "Publishing..." : "Publish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEvent;
