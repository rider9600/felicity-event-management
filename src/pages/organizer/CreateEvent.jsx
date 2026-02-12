import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { organizerAPI } from "../../services/api";
import {
  EVENT_TYPES,
  EVENT_STATUS,
  FORM_FIELD_TYPES,
} from "../../utils/constants";
import { isDateBefore } from "../../utils/validators";
import "./CreateEvent.css";

const CreateEvent = () => {
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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

      await organizerAPI.createEvent(eventData);
      navigate("/organizer/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create event");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="create-event-container">
      <div className="create-event-header">
        <h1>Create New Event</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="create-event-card">
        <form className="event-form">
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
                <label htmlFor="registrationDeadline">
                  Registration Deadline *
                </label>
                <input
                  type="datetime-local"
                  id="registrationDeadline"
                  name="registrationDeadline"
                  value={formData.registrationDeadline}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="startDate">Event Start Date *</label>
                <input
                  type="datetime-local"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="endDate">Event End Date *</label>
              <input
                type="datetime-local"
                id="endDate"
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
                <label htmlFor="registrationLimit">
                  Registration Limit (optional)
                </label>
                <input
                  type="number"
                  id="registrationLimit"
                  name="registrationLimit"
                  value={formData.registrationLimit}
                  onChange={handleChange}
                  min="0"
                />
              </div>

              <div className="form-group">
                <label htmlFor="registrationFee">Registration Fee (₹)</label>
                <input
                  type="number"
                  id="registrationFee"
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
              <p className="section-description">
                Add custom fields to collect additional information from
                participants
              </p>

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
                        placeholder="Option 1, Option 2, Option 3"
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
              {saving ? "Publishing..." : "Publish Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;
