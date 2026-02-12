import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { USER_ROLES } from "./utils/constants";

// Components
import Navbar from "./components/Navbar";

// Auth Pages
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Onboarding from "./pages/auth/Onboarding";

// Participant Pages
import ParticipantDashboard from "./pages/participant/ParticipantDashboard";
import BrowseEvents from "./pages/participant/BrowseEvents";
import EventDetails from "./pages/participant/EventDetails";
import OrganizersList from "./pages/participant/OrganizersList";
import OrganizerDetail from "./pages/participant/OrganizerDetail";
import Profile from "./pages/participant/Profile";

// Organizer Pages
import OrganizerDashboard from "./pages/organizer/OrganizerDashboard";
import CreateEvent from "./pages/organizer/CreateEvent";
import OrganizerEventDetails from "./pages/organizer/OrganizerEventDetails";
import EditEvent from "./pages/organizer/EditEvent";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import PasswordResets from "./pages/admin/PasswordResets";

import "./App.css";

// Home page - simple landing
const Home = () => {
  return (
    <div style={{ textAlign: "center", marginTop: "4rem", padding: "2rem" }}>
      <h1>Welcome to Felicity Platform</h1>
      <p style={{ marginTop: "1rem", fontSize: "1.2rem", color: "#666" }}>
        Event Management System for IIIT Hyderabad
      </p>
      <div
        style={{
          marginTop: "2rem",
          display: "flex",
          gap: "1rem",
          justifyContent: "center",
        }}
      >
        <a
          href="/login"
          style={{
            padding: "0.75rem 1.5rem",
            background: "#4a90e2",
            color: "white",
            borderRadius: "6px",
            textDecoration: "none",
          }}
        >
          Login
        </a>
        <a
          href="/signup"
          style={{
            padding: "0.75rem 1.5rem",
            background: "white",
            color: "#4a90e2",
            border: "2px solid #4a90e2",
            borderRadius: "6px",
            textDecoration: "none",
          }}
        >
          Sign Up
        </a>
      </div>
      <div style={{ marginTop: "3rem" }}>
        <h3>Quick Links (Testing)</h3>
        <div
          style={{
            marginTop: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            alignItems: "center",
          }}
        >
          <a href="/dashboard" style={{ color: "#4a90e2" }}>
            Participant Dashboard
          </a>
          <a href="/events" style={{ color: "#4a90e2" }}>
            Browse Events
          </a>
          <a href="/organizer/dashboard" style={{ color: "#4a90e2" }}>
            Organizer Dashboard
          </a>
          <a href="/admin/dashboard" style={{ color: "#4a90e2" }}>
            Admin Dashboard
          </a>
        </div>
      </div>
    </div>
  );
};

// Unauthorized page
const Unauthorized = () => (
  <div style={{ textAlign: "center", marginTop: "4rem" }}>
    <h1>Unauthorized</h1>
    <p>You don't have permission to access this page.</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Participant Routes - Unprotected for now */}
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<ParticipantDashboard />} />
          <Route path="/events" element={<BrowseEvents />} />
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/organizers" element={<OrganizersList />} />
          <Route path="/organizers/:id" element={<OrganizerDetail />} />
          <Route path="/profile" element={<Profile />} />

          {/* Organizer Routes - Unprotected for now */}
          <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
          <Route path="/organizer/events/create" element={<CreateEvent />} />
          <Route
            path="/organizer/events/:id"
            element={<OrganizerEventDetails />}
          />
          <Route path="/organizer/events/:id/edit" element={<EditEvent />} />
          <Route path="/organizer/events" element={<OrganizerDashboard />} />
          <Route path="/organizer/profile" element={<Profile />} />

          {/* Admin Routes - Unprotected for now */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/organizers" element={<AdminDashboard />} />
          <Route path="/admin/password-resets" element={<PasswordResets />} />

          {/* Default Route */}
          <Route path="/" element={<Home />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
