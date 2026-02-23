import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loading from "./common/Loading";

const ProtectedRoute = ({
  children,
  allowedRoles = [],
  redirectTo = "/login",
}) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading text="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    // Redirect to login with return url
    return (
      <Navigate to={redirectTo} state={{ from: location.pathname }} replace />
    );
  }

  // Check if user role is allowed
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard based on role
    const dashboardPath =
      {
        admin: "/admin/dashboard",
        organizer: "/organizer/dashboard",
        participant: "/dashboard",
      }[user?.role] || "/dashboard";

    return <Navigate to={dashboardPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
