import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import Card from "../components/Card";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import PageContainer from "../components/layout/PageContainer";

const Register = () => {
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    contactNumber: "",
    college: "",
    interests: "",
    password: "",
    confirmPassword: "",
    participantType: "non-iiit",
  });
  const [errors, setErrors] = useState({});

  const { register, loading, error, isAuthenticated, clearError, updateUser } =
    useAuth();
  const { apiCall } = useApi();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/onboarding", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      setErrors({ submit: error });
    }
  }, [error]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Auto-set participant type based on email
    if (name === "email") {
      const isIIIT =
        value.endsWith("@students.iiit.ac.in") ||
        value.endsWith("@research.iiit.ac.in");
      const newParticipantType = isIIIT ? "iiit" : "non-iiit";
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        participantType: newParticipantType,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
    if (error) {
      clearError();
      setErrors((prev) => ({ ...prev, submit: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstname.trim()) {
      newErrors.firstname = "First name is required";
    }

    if (!formData.lastname.trim()) {
      newErrors.lastname = "Last name is required";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    } else if (
      formData.participantType === "iiit" &&
      !formData.email.endsWith("@students.iiit.ac.in") &&
      !formData.email.endsWith("@research.iiit.ac.in")
    ) {
      newErrors.email =
        "IIIT participants must use @students.iiit.ac.in or @research.iiit.ac.in email";
    }

    if (!formData.contactNumber) {
      newErrors.contactNumber = "Mobile number is required";
    } else if (!/^[0-9]{10}$/.test(formData.contactNumber)) {
      newErrors.contactNumber = "Mobile number must be exactly 10 digits";
    }

    if (
      formData.participantType === "non-iiit" &&
      !formData.college.trim()
    ) {
      newErrors.college = "College / organization name is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const interestsArray = formData.interests
      ? formData.interests
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const { confirmPassword, ...rest } = formData;

    const registrationData = {
      ...rest,
      college:
        rest.participantType === "iiit"
          ? "IIITH"
          : rest.college.trim(),
    };

    const result = await register(registrationData);

    if (result.success) {
      // Persist contact number and college on participant profile
      try {
        const profileRes = await apiCall("/point/participant/profile", {
          method: "PUT",
          body: JSON.stringify({
            contactNumber: formData.contactNumber,
            college: registrationData.college,
          }),
        });

        if (profileRes?.success && profileRes.data?.participant) {
          updateUser(profileRes.data.participant);
        } else {
          updateUser({
            contactNumber: formData.contactNumber,
            college: registrationData.college,
          });
        }
      } catch {
        // Fall back to updating local user only
        updateUser({
          contactNumber: formData.contactNumber,
          college: registrationData.college,
        });
      }

      // Store initial interests into preferences so they show in Profile
      try {
        if (interestsArray.length) {
          await apiCall("/point/preferences/set", {
            method: "POST",
            body: JSON.stringify({ interests: interestsArray }),
          });
        }
      } catch {
        // ignore preference save errors during registration
      }

      navigate("/onboarding", { replace: true });
    }
  };

  const participantTypeOptions = [
    { value: "iiit", label: "IIIT Student" },
    { value: "non-iiit", label: "External Participant" },
  ];

  return (
    <PageContainer
      title="Create Account"
      subtitle="Join Felicity Platform and start managing events."
    >
      <div style={{ maxWidth: "400px", margin: "0 auto" }}>
        <Card title="Create Your Account">
          {errors.submit && (
            <div
              style={{
                background: "#f8d7da",
                color: "#721c24",
                padding: "0.75rem",
                borderRadius: "4px",
                marginBottom: "1rem",
              }}
            >
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Input
              label="First Name"
              type="text"
              name="firstname"
              value={formData.firstname}
              onChange={handleChange}
              error={errors.firstname}
              required
              placeholder="Enter your first name"
            />

            <Input
              label="Last Name"
              type="text"
              name="lastname"
              value={formData.lastname}
              onChange={handleChange}
              error={errors.lastname}
              required
              placeholder="Enter your last name"
            />

            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
              placeholder="Enter your email"
            />

            <Input
              label="Mobile Number"
              type="tel"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              error={errors.contactNumber}
              required
              placeholder="10-digit mobile number"
              maxLength={10}
            />

            <Input
              label="College / Organization"
              type="text"
              name="college"
              value={
                formData.participantType === "iiit"
                  ? "IIITH"
                  : formData.college
              }
              onChange={handleChange}
              error={errors.college}
              required={formData.participantType === "non-iiit"}
              disabled={formData.participantType === "iiit"}
              placeholder="Your college or organization name"
            />

          <Input
            label="Participant Type"
            type="select"
            name="participantType"
            value={formData.participantType}
            onChange={handleChange}
            options={participantTypeOptions}
            required
          />

            <Input
              label="Interests (comma-separated)"
              type="text"
              name="interests"
              value={formData.interests}
              onChange={handleChange}
              placeholder="e.g., coding, music, sports"
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
              placeholder="Create a password"
            />

            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              required
              placeholder="Confirm your password"
            />

            <Button
              type="submit"
              variant="primary"
              size="large"
              disabled={loading}
              style={{ width: "100%", marginTop: "1rem" }}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div
            style={{
              textAlign: "center",
              marginTop: "1.5rem",
              paddingTop: "1rem",
              borderTop: "1px solid #eee",
            }}
          >
            <p>
              Already have an account?{" "}
              <Link
                to="/login"
                style={{ color: "#007bff", textDecoration: "none" }}
              >
                Sign in here
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};

export default Register;
