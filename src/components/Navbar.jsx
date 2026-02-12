import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { USER_ROLES } from "../utils/constants";
import "./Navbar.css";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!isAuthenticated) return null;

  const getNavLinks = () => {
    switch (user?.role) {
      case USER_ROLES.PARTICIPANT:
        return (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/events">Browse Events</Link>
            <Link to="/organizers">Clubs/Organizers</Link>
            <Link to="/profile">Profile</Link>
          </>
        );
      case USER_ROLES.ORGANIZER:
        return (
          <>
            <Link to="/organizer/dashboard">Dashboard</Link>
            <Link to="/organizer/events/create">Create Event</Link>
            <Link to="/organizer/events">Ongoing Events</Link>
            <Link to="/organizer/profile">Profile</Link>
          </>
        );
      case USER_ROLES.ADMIN:
        return (
          <>
            <Link to="/admin/dashboard">Dashboard</Link>
            <Link to="/admin/organizers">Manage Organizers</Link>
            <Link to="/admin/password-resets">Password Resets</Link>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          Felicity Platform
        </Link>
        <div className="navbar-links">
          {getNavLinks()}
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
