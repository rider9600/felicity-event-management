import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/common/ErrorBoundary";
import Home from "./pages/Home";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Onboarding from "./pages/Onboarding";
import CreateEvent from "./pages/CreateEvent";
import ClubsOrganizers from "./pages/ClubsOrganizers";
import "./App.css";

// Lazy load dashboard components
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Tickets = React.lazy(() => import("./pages/Tickets"));
const OrganizerDashboard = React.lazy(
  () => import("./pages/OrganizerDashboard"),
);
const OrganizerEvents = React.lazy(() => import("./pages/OrganizerEvents"));
const OrganizerAnalytics = React.lazy(
  () => import("./pages/OrganizerAnalytics"),
);
const OrganizerEventDetail = React.lazy(
  () => import("./pages/OrganizerEventDetail"),
);
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const Analytics = React.lazy(() => import("./pages/Analytics"));
const ManageUsers = React.lazy(() => import("./pages/ManageUsers"));
const OrganizerDetail = React.lazy(() => import("./pages/OrganizerDetail"));
const PasswordResetRequests = React.lazy(() => import("./pages/PasswordResetRequests"));
const ManageClubs = React.lazy(() => import("./pages/ManageClubs"));

// Role-based route component
const RoleBasedRedirect = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  switch (user?.role) {
    case "admin":
      return <Navigate to="/admin/dashboard" replace />;
    case "organizer":
      return <Navigate to="/organizer/dashboard" replace />;
    case "participant":
    default:
      return <Navigate to="/dashboard" replace />;
  }
};

function AppContent() {
  return (
    <ErrorBoundary>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <React.Suspense
            fallback={<div className="loading-fallback">Loading...</div>}
          >
            <ErrorBoundary>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/:eventId" element={<EventDetails />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/clubs" element={<ClubsOrganizers />} />
                <Route path="/organizers/:organizerId" element={<ErrorBoundary><React.Suspense fallback={<div className="loading-fallback">Loading...</div>}><OrganizerDetail /></React.Suspense></ErrorBoundary>} />

                {/* Role-based dashboard redirect */}
                <Route
                  path="/dashboard-redirect"
                  element={<RoleBasedRedirect />}
                />

                {/* Protected participant routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ErrorBoundary>
                      <ProtectedRoute allowedRoles={["participant"]}>
                        <Dashboard />
                      </ProtectedRoute>
                    </ErrorBoundary>
                  }
                />

                <Route
                  path="/tickets"
                  element={
                    <ErrorBoundary>
                      <ProtectedRoute allowedRoles={["participant"]}>
                        <Tickets />
                      </ProtectedRoute>
                    </ErrorBoundary>
                  }
                />

                <Route
                  path="/profile"
                  element={
                    <ErrorBoundary>
                      <ProtectedRoute
                        allowedRoles={["participant", "organizer", "admin"]}
                      >
                        <Profile />
                      </ProtectedRoute>
                    </ErrorBoundary>
                  }
                />

                <Route
                  path="/onboarding"
                  element={
                    <ErrorBoundary>
                      <ProtectedRoute
                        allowedRoles={["participant", "organizer", "admin"]}
                      >
                        <Onboarding />
                      </ProtectedRoute>
                    </ErrorBoundary>
                  }
                />

                {/* Organizer routes */}
                <Route
                  path="/organizer/dashboard"
                  element={
                    <ErrorBoundary>
                      <ProtectedRoute allowedRoles={["organizer", "admin"]}>
                        <OrganizerDashboard />
                      </ProtectedRoute>
                    </ErrorBoundary>
                  }
                />

                <Route
                  path="/organizer/events"
                  element={
                    <ErrorBoundary>
                      <ProtectedRoute allowedRoles={["organizer", "admin"]}>
                        <OrganizerEvents />
                      </ProtectedRoute>
                    </ErrorBoundary>
                  }
                />

                <Route
                  path="/organizer/events/:eventId"
                  element={
                    <ErrorBoundary>
                      <ProtectedRoute allowedRoles={["organizer", "admin"]}>
                        <OrganizerEventDetail />
                      </ProtectedRoute>
                    </ErrorBoundary>
                  }
                />

                <Route
                  path="/organizer/events/create"
                  element={
                    <ErrorBoundary>
                      <ProtectedRoute allowedRoles={["organizer", "admin"]}>
                        <CreateEvent />
                      </ProtectedRoute>
                    </ErrorBoundary>
                  }
                />

                <Route
                  path="/organizer/events/edit/:eventId"
                  element={
                    <ErrorBoundary>
                      <ProtectedRoute allowedRoles={["organizer", "admin"]}>
                        <CreateEvent />
                      </ProtectedRoute>
                    </ErrorBoundary>
                  }
                />

                <Route
                  path="/organizer/analytics"
                  element={
                    <ErrorBoundary>
                      <ProtectedRoute allowedRoles={["organizer", "admin"]}>
                        <OrganizerAnalytics />
                      </ProtectedRoute>
                    </ErrorBoundary>
                  }
                />

                {/* Admin routes */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <ErrorBoundary>
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    </ErrorBoundary>
                  }
                />

                <Route
                  path="/admin/analytics"
                  element={
                    <ErrorBoundary>
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <Analytics />
                      </ProtectedRoute>
                    </ErrorBoundary>
                  }
                />

                <Route
                  path="/admin/users"
                  element={
                    <ErrorBoundary>
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <ManageUsers />
                      </ProtectedRoute>
                    </ErrorBoundary>
                  }
                />

                <Route
                  path="/admin/password-requests"
                  element={
                    <ErrorBoundary>
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <PasswordResetRequests />
                      </ProtectedRoute>
                    </ErrorBoundary>
                  }
                />

                <Route
                  path="/admin/clubs"
                  element={
                    <ErrorBoundary>
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <ManageClubs />
                      </ProtectedRoute>
                    </ErrorBoundary>
                  }
                />

                {/* Redirect old paths */}
                <Route
                  path="/dashboard/*"
                  element={<Navigate to="/dashboard" replace />}
                />

                {/* Default redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ErrorBoundary>
          </React.Suspense>
        </main>
      </div>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
