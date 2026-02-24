import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useEventApi } from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";
import PageContainer from "../components/layout/PageContainer";
import DashboardLayout from "../components/layout/DashboardLayout";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Loading from "../components/common/Loading";
import Card from "../components/Card";
import "./CreateEvent.css";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const emptyMerchandiseItem = () => ({
  id: Date.now() + Math.random(),
  name: "",
  size: "",
  color: "",
  variant: "",
  stock: 1,
  purchaseLimit: 1,
});

const emptyFormField = () => ({
  id: Date.now() + Math.random(),
  type: "text",
  label: "",
  required: false,
  options: [], // for dropdown / checkbox-group
});

const FIELD_TYPES = [
  { value: "text",     label: "Text" },
  { value: "textarea", label: "Long Text" },
  { value: "number",   label: "Number" },
  { value: "dropdown", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
  { value: "file",     label: "File Upload" },
];

// ─── Component ───────────────────────────────────────────────────────────────

const CreateEvent = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createEvent, updateEvent, getEventById, loading } = useEventApi();

  const isEditing = Boolean(eventId);

  /* ── Core event fields ── */
  const [eventData, setEventData] = useState({
    eventName: "",
    eventDescription: "",
    eventType: "normal",
    eventStartDate: "",
    eventEndDate: "",
    eventStartTime: "",
    eventEndTime: "",
    venue: "",
    registrationLimit: "",
    registrationFee: 0,
    registrationDeadline: "",
    eligibility: "",
    tags: "",
  });

  /* ── Merchandise items (for merchandise events) ── */
  const [merchandiseItems, setMerchandiseItems] = useState([emptyMerchandiseItem()]);

  /* ── Custom form fields (for normal events) ── */
  const [formFields, setFormFields] = useState([]);

  const [saving, setSaving] = useState(false);
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [error, setError] = useState("");

  // ── Load event for editing ──────────────────────────────────────────────

  useEffect(() => {
    if (isEditing) loadEventForEditing();
  }, [eventId]);

  const loadEventForEditing = async () => {
    setLoadingEvent(true);
    try {
      const result = await getEventById(eventId);
      if (result.success) {
        const ev = result.event || result.data?.event || result.data || {};
        const startDate = ev.eventStartDate ? new Date(ev.eventStartDate) : null;
        const endDate   = ev.eventEndDate   ? new Date(ev.eventEndDate)   : null;
        const deadline  = ev.registrationDeadline ? new Date(ev.registrationDeadline) : null;

        setEventData({
          eventName:           ev.eventName        || "",
          eventDescription:    ev.eventDescription || "",
          eventType:           ev.eventType        || "normal",
          eventStartDate:      startDate ? startDate.toISOString().split("T")[0] : "",
          eventEndDate:        endDate   ? endDate.toISOString().split("T")[0]   : "",
          eventStartTime:      startDate ? startDate.toTimeString().slice(0, 5)  : "",
          eventEndTime:        endDate   ? endDate.toTimeString().slice(0, 5)    : "",
          venue:               ev.venue              || "",
          registrationLimit:   ev.registrationLimit  || "",
          registrationFee:     ev.registrationFee    || 0,
          registrationDeadline: deadline ? deadline.toISOString().split("T")[0] : "",
          eligibility:         ev.eligibility || "",
          tags:                ev.eventTags ? ev.eventTags.join(", ") : "",
        });

        // Restore merchandise items
        if (ev.eventType === "merchandise" && ev.merchandise?.items?.length) {
          setMerchandiseItems(
            ev.merchandise.items.map((item, i) => ({ ...item, id: i }))
          );
        }

        // Restore custom form fields
        if (ev.eventType === "normal" && ev.customForm?.fields?.length) {
          setFormFields(
            ev.customForm.fields.map((f, i) => ({
              ...f,
              id: i,
              options: f.options || [],
            }))
          );
        }
      }
    } catch (err) {
      setError("Failed to load event: " + err.message);
    } finally {
      setLoadingEvent(false);
    }
  };

  // ── Input helpers ───────────────────────────────────────────────────────

  const handleChange = (field, value) =>
    setEventData((prev) => ({ ...prev, [field]: value }));

  // ── Merchandise item helpers ────────────────────────────────────────────

  const addItem = () =>
    setMerchandiseItems((prev) => [...prev, emptyMerchandiseItem()]);

  const removeItem = (id) =>
    setMerchandiseItems((prev) => prev.filter((i) => i.id !== id));

  const updateItem = (id, field, value) =>
    setMerchandiseItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );

  // ── Form field helpers ──────────────────────────────────────────────────

  const addFormField = () =>
    setFormFields((prev) => [...prev, emptyFormField()]);

  const removeFormField = (id) =>
    setFormFields((prev) => prev.filter((f) => f.id !== id));

  const updateFormField = (id, field, value) =>
    setFormFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );

  const moveField = (index, direction) => {
    const next = [...formFields];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setFormFields(next);
  };

  const updateFieldOptions = (id, optText) => {
    // options stored as comma-separated string converted to array on submit
    updateFormField(id, "_optionsText", optText);
  };

  // ── Submit ──────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!eventData.eventStartDate) { setError("Start Date is required."); return; }
    if (!eventData.eventEndDate)   { setError("End Date is required."); return; }
    if (!eventData.eventStartTime) { setError("Start Time is required."); return; }
    if (!eventData.eventEndTime)   { setError("End Time is required."); return; }
    if (eventData.eventType === "merchandise" && merchandiseItems.some((i) => !i.name.trim())) {
      setError("All merchandise items must have a name."); return;
    }

    setSaving(true);
    try {
      const eventStartDate = `${eventData.eventStartDate}T${eventData.eventStartTime}:00`;
      const eventEndDate   = `${eventData.eventEndDate}T${eventData.eventEndTime}:00`;
      const registrationDeadline = eventData.registrationDeadline
        ? `${eventData.registrationDeadline}T23:59:59`
        : null;

      const payload = {
        eventName:           eventData.eventName,
        eventDescription:    eventData.eventDescription,
        eventType:           eventData.eventType,
        eventStartDate,
        eventEndDate,
        venue:               eventData.venue,
        registrationLimit:   parseInt(eventData.registrationLimit) || 0,
        registrationFee:     parseFloat(eventData.registrationFee) || 0,
        registrationDeadline,
        eligibility:         eventData.eligibility,
        eventTags:           eventData.tags.split(",").map((t) => t.trim()).filter(Boolean),
      };

      if (eventData.eventType === "merchandise") {
        // Clean and attach merchandise items
        payload.merchandise = {
          items: merchandiseItems.map(({ id, _optionsText, ...rest }) => ({
            ...rest,
            stock:         parseInt(rest.stock)         || 0,
            purchaseLimit: parseInt(rest.purchaseLimit) || 1,
          })),
        };
      } else {
        // Attach custom form schema
        payload.customForm = {
          fields: formFields.map(({ id, _optionsText, ...f }, index) => {
            const baseLabel = (f.label || "").trim() || `Field ${index + 1}`;
            let slug =
              (f.name || "")
                .toString()
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "_")
                .replace(/^_+|_+$/g, "") ||
              baseLabel
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "_")
                .replace(/^_+|_+$/g, "") ||
              `field_${index + 1}`;

            return {
              ...f,
              // stable key used by registration form + backend
              name: slug,
              options: _optionsText
                ? _optionsText
                    .split(",")
                    .map((o) => o.trim())
                    .filter(Boolean)
                : f.options || [],
            };
          }),
        };
      }

      const result = isEditing
        ? await updateEvent(eventId, payload)
        : await createEvent(payload);

      if (result.success) {
        navigate("/organizer/events");
      } else {
        setError(result.error || "Failed to save event.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────

  if (loadingEvent) {
    return (
      <DashboardLayout>
        <PageContainer>
          <Loading size="large" />
        </PageContainer>
      </DashboardLayout>
    );
  }

  const isMerchandise = eventData.eventType === "merchandise";

  return (
    <DashboardLayout>
      <div className="create-event-page">
        <div className="create-event-header">
          <Button variant="ghost" onClick={() => navigate("/organizer/events")}>
            ← Back to Events
          </Button>
          <h1>{isEditing ? "Edit Event" : "Create New Event"}</h1>
          <p>Fill in the details to {isEditing ? "update" : "create"} your event</p>
        </div>

        {error && (
          <div style={{
            background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444",
            borderRadius: "8px", padding: "12px 16px", marginBottom: "20px", color: "#ef4444",
          }}>
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="create-event-form">
          {/* ── Basic Info ── */}
          <Card className="form-section">
            <h3 className="section-title">Basic Information</h3>

            <div className="form-row">
              <Input
                label="Event Name *"
                type="text"
                value={eventData.eventName}
                onChange={(e) => handleChange("eventName", e.target.value)}
                placeholder="Enter event name"
                required
              />

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "#c0c0d8" }}>
                  Event Type *
                </label>
                <div style={{ display: "flex", gap: "12px" }}>
                  {[
                    { value: "normal",      label: "🎟️ Normal Event",    desc: "Workshops, talks, competitions" },
                    { value: "merchandise", label: "🛍️ Merchandise Sale", desc: "T-shirts, kits, etc." },
                  ].map((opt) => (
                    <div
                      key={opt.value}
                      onClick={() => handleChange("eventType", opt.value)}
                      style={{
                        flex: 1,
                        padding: "14px",
                        border: `2px solid ${eventData.eventType === opt.value ? "#6366f1" : "var(--border-color, #2a2a4a)"}`,
                        borderRadius: "10px",
                        cursor: "pointer",
                        background: eventData.eventType === opt.value ? "rgba(99,102,241,0.12)" : "transparent",
                        transition: "all 0.2s",
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{opt.label}</div>
                      <div style={{ fontSize: "0.8rem", color: "#888", marginTop: "4px" }}>{opt.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Input
              label="Event Description *"
              type="textarea"
              value={eventData.eventDescription}
              onChange={(e) => handleChange("eventDescription", e.target.value)}
              placeholder="Describe your event in detail..."
              rows={4}
              required
            />
          </Card>

          {/* ── Schedule & Location ── */}
          <Card className="form-section">
            <h3 className="section-title">Schedule &amp; Location</h3>

            <div className="form-row">
              <Input
                label="Start Date *"
                type="date"
                value={eventData.eventStartDate}
                onChange={(e) => {
                  const val = e.target.value;
                  handleChange("eventStartDate", val);
                  if (!eventData.eventEndDate) handleChange("eventEndDate", val);
                }}
                min={new Date().toISOString().split("T")[0]}
                required
              />
              <Input
                label="End Date *"
                type="date"
                value={eventData.eventEndDate}
                onChange={(e) => handleChange("eventEndDate", e.target.value)}
                min={eventData.eventStartDate || new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            <div className="form-row">
              <Input
                label="Start Time *"
                type="time"
                value={eventData.eventStartTime}
                onChange={(e) => handleChange("eventStartTime", e.target.value)}
                required
              />
              <Input
                label="End Time *"
                type="time"
                value={eventData.eventEndTime}
                onChange={(e) => handleChange("eventEndTime", e.target.value)}
                required
              />
            </div>

            <Input
              label="Venue *"
              type="text"
              value={eventData.venue}
              onChange={(e) => handleChange("venue", e.target.value)}
              placeholder="Event location or venue"
              required
            />
          </Card>

          {/* ── Registration Settings ── */}
          <Card className="form-section">
            <h3 className="section-title">Registration Settings</h3>

            <div className="form-row">
              <Input
                label="Registration Deadline *"
                type="date"
                value={eventData.registrationDeadline}
                onChange={(e) => handleChange("registrationDeadline", e.target.value)}
                max={eventData.eventStartDate || undefined}
                required
              />
              <Input
                label={isMerchandise ? "Max Purchases (0 = unlimited)" : "Registration Limit (0 = unlimited)"}
                type="number"
                value={eventData.registrationLimit}
                onChange={(e) => handleChange("registrationLimit", e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>

            <div className="form-row">
              <Input
                label="Registration Fee (₹)"
                type="number"
                value={eventData.registrationFee}
                onChange={(e) => handleChange("registrationFee", e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
              />
              <Input
                label="Eligibility"
                type="select"
                value={eventData.eligibility}
                onChange={(e) => handleChange("eligibility", e.target.value)}
                options={[
                  { value: "",       label: "Open to All" },
                  { value: "iiit",   label: "IIIT Students Only" },
                ]}
              />
            </div>

            <Input
              label="Event Tags (comma-separated)"
              type="text"
              value={eventData.tags}
              onChange={(e) => handleChange("tags", e.target.value)}
              placeholder="tech, cultural, sports, workshop"
            />
          </Card>

          {/* ── Merchandise Items (merchandise events only) ── */}
          {isMerchandise && (
            <Card className="form-section">
              <h3 className="section-title">🛍️ Merchandise Items</h3>
              <p style={{ color: "#888", fontSize: "0.875rem", marginBottom: "16px" }}>
                Add each item variant separately (e.g. T-shirt Size S, T-shirt Size M).
              </p>

              {merchandiseItems.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    background: "rgba(99,102,241,0.06)",
                    border: "1px solid var(--border-color, #2a2a4a)",
                    borderRadius: "10px",
                    padding: "16px",
                    marginBottom: "12px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <strong style={{ color: "#c084fc" }}>Item #{idx + 1}</strong>
                    {merchandiseItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="small"
                        onClick={() => removeItem(item.id)}
                        style={{ color: "#ef4444" }}
                      >
                        ✕ Remove
                      </Button>
                    )}
                  </div>

                  <div className="form-row">
                    <Input
                      label="Item Name *"
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(item.id, "name", e.target.value)}
                      placeholder="e.g. Felicity T-Shirt"
                      required
                    />
                    <Input
                      label="Size (optional)"
                      type="text"
                      value={item.size}
                      onChange={(e) => updateItem(item.id, "size", e.target.value)}
                      placeholder="S, M, L, XL, etc."
                    />
                  </div>

                  <div className="form-row">
                    <Input
                      label="Color (optional)"
                      type="text"
                      value={item.color}
                      onChange={(e) => updateItem(item.id, "color", e.target.value)}
                      placeholder="Black, White, etc."
                    />
                    <Input
                      label="Variant (optional)"
                      type="text"
                      value={item.variant}
                      onChange={(e) => updateItem(item.id, "variant", e.target.value)}
                      placeholder="Premium, Standard, etc."
                    />
                  </div>

                  <div className="form-row">
                    <Input
                      label="Stock Quantity *"
                      type="number"
                      value={item.stock}
                      onChange={(e) => updateItem(item.id, "stock", e.target.value)}
                      min="0"
                      required
                    />
                    <Input
                      label="Purchase Limit per Participant"
                      type="number"
                      value={item.purchaseLimit}
                      onChange={(e) => updateItem(item.id, "purchaseLimit", e.target.value)}
                      min="1"
                    />
                  </div>
                </div>
              ))}

              <Button type="button" variant="outline" size="small" onClick={addItem}>
                + Add Another Item
              </Button>
            </Card>
          )}

          {/* ── Custom Form Builder (normal events only) ── */}
          {!isMerchandise && (
            <Card className="form-section">
              <h3 className="section-title">📋 Registration Form Builder</h3>
              <p style={{ color: "#888", fontSize: "0.875rem", marginBottom: "16px" }}>
                Add custom fields to collect information from participants at registration.
                {formFields.length === 0 && " (No extra fields — participants register with just their account info.)"}
              </p>

              {formFields.map((field, idx) => (
                <div
                  key={field.id}
                  style={{
                    background: "rgba(99,102,241,0.06)",
                    border: "1px solid var(--border-color, #2a2a4a)",
                    borderRadius: "10px",
                    padding: "16px",
                    marginBottom: "12px",
                  }}
                >
                  {/* Field header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <strong style={{ color: "#60a5fa" }}>Field #{idx + 1}</strong>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <Button type="button" variant="ghost" size="small" onClick={() => moveField(idx, -1)} disabled={idx === 0}>↑</Button>
                      <Button type="button" variant="ghost" size="small" onClick={() => moveField(idx, 1)} disabled={idx === formFields.length - 1}>↓</Button>
                      <Button type="button" variant="ghost" size="small" onClick={() => removeFormField(field.id)} style={{ color: "#ef4444" }}>✕</Button>
                    </div>
                  </div>

                  <div className="form-row">
                    <Input
                      label="Field Label *"
                      type="text"
                      value={field.label}
                      onChange={(e) => updateFormField(field.id, "label", e.target.value)}
                      placeholder="e.g. Team Name, Institution, etc."
                    />
                    <Input
                      label="Field Type"
                      type="select"
                      value={field.type}
                      onChange={(e) => updateFormField(field.id, "type", e.target.value)}
                      options={FIELD_TYPES}
                    />
                  </div>

                  {/* Options for dropdown/checkbox-group */}
                  {(field.type === "dropdown" || field.type === "checkbox") && (
                    <Input
                      label="Options (comma-separated) *"
                      type="text"
                      value={field._optionsText ?? field.options?.join(", ") ?? ""}
                      onChange={(e) => updateFormField(field.id, "_optionsText", e.target.value)}
                      placeholder="Option 1, Option 2, Option 3"
                    />
                  )}

                  {/* Required toggle */}
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", cursor: "pointer", fontSize: "0.875rem" }}>
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateFormField(field.id, "required", e.target.checked)}
                    />
                    <span>Required field</span>
                  </label>
                </div>
              ))}

              <Button type="button" variant="outline" size="small" onClick={addFormField}>
                + Add Form Field
              </Button>
            </Card>
          )}

          {/* ── Actions ── */}
          <div className="form-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/organizer/events")}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              disabled={saving || loading}
            >
              {saving
                ? isEditing ? "Updating..." : "Creating..."
                : isEditing ? "Update Event" : "Create Event"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CreateEvent;
