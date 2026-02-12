import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { PARTICIPANT_TYPES } from "../../utils/constants";
import {
  isValidEmail,
  isIIITEmail,
  isValidPassword,
  isValidPhone,
} from "../../utils/validators";
import "./Signup.css";

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    participantType: PARTICIPANT_TYPES.IIIT,
    collegeOrg: "",
    contactNumber: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setError("");
  };

  const validateForm = () => {
    if (!formData.firstName || !formData.lastName) {
      setError("First name and last name are required");
      return false;
    }

    if (!isValidEmail(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }

    if (
      formData.participantType === PARTICIPANT_TYPES.IIIT &&
      !isIIITEmail(formData.email)
    ) {
      setError(
        "IIIT participants must use email ending with @students.iiit.ac.in or @research.iiit.ac.in",
      );
      return false;
    }

    if (!isValidPassword(formData.password)) {
      setError("Password must be at least 6 characters long");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    if (formData.contactNumber && !isValidPhone(formData.contactNumber)) {
      setError("Please enter a valid 10-digit phone number");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const { confirmPassword, ...signupData } = formData;
    const result = await signup(signupData);

    if (result.success) {
      // Redirect to onboarding for preference selection
      navigate("/onboarding");
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Sign Up for Felicity</h1>
        <p className="auth-subtitle">
          Create your participant account to get started.
        </p>
        <p
          className="organizer-note"
          style={{
            fontSize: "0.9rem",
            color: "#666",
            marginBottom: "1rem",
            padding: "0.75rem",
            background: "#fff3cd",
            borderRadius: "6px",
            border: "1px solid #ffc107",
          }}
        >
          <strong>Note:</strong> Organizer accounts are created by Admin only.
          If you're an organizer, contact the admin for credentials.
        </p>

        {error && <div className="error-alert">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name *</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                placeholder="First name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name *</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                placeholder="Last name"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="participantType">Participant Type *</label>
            <select
              id="participantType"
              name="participantType"
              value={formData.participantType}
              onChange={handleChange}
              required
            >
              <option value={PARTICIPANT_TYPES.IIIT}>IIIT Student</option>
              <option value={PARTICIPANT_TYPES.NON_IIIT}>
                Non-IIIT Participant
              </option>
            </select>
            {formData.participantType === PARTICIPANT_TYPES.IIIT && (
              <small className="form-help">Must use IIIT email address</small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your.email@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="collegeOrg">College / Organization</label>
            <input
              type="text"
              id="collegeOrg"
              name="collegeOrg"
              value={formData.collegeOrg}
              onChange={handleChange}
              placeholder="Your college or organization"
            />
          </div>

          <div className="form-group">
            <label htmlFor="contactNumber">Contact Number</label>
            <input
              type="tel"
              id="contactNumber"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              placeholder="10-digit mobile number"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Create a password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm password"
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
