import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Card from "../components/Card";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import PageContainer from "../components/layout/PageContainer";
import "./Login.css";
const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const { login, loading, error, isAuthenticated, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/dashboard";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  useEffect(() => {
    if (error) {
      setErrors({ submit: error });
    }
  }, [error]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

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

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const result = await login(formData.email, formData.password);

    if (result.success) {
      navigate(from, { replace: true });
    }
  };

  return (
    <PageContainer
      title="Sign In"
      subtitle="Welcome back! Please sign in to your account."
    >
      <div className="login-container">
        <Card title="Login to Your Account">
          {errors.submit && (
            <div className="error-message">{errors.submit}</div>
          )}

          <form onSubmit={handleSubmit}>
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
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
              placeholder="Enter your password"
            />

            <Button
              type="submit"
              variant="primary"
              size="large"
              disabled={loading}
              className="submit-button"
            >
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="signup-section">
            <p>
              Don't have an account?{" "}
              <Link to="/register" className="signup-link">
                Sign up here
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};

export default Login;
