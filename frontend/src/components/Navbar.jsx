import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "./common/Button";
import Badge from "./common/Badge";
import Modal from "./common/Modal";
import "./Navbar.css";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Track screen size
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    setShowLogoutModal(false);
    navigate("/");
  };

  const getNavItems = () => {
    if (!isAuthenticated) {
      return [
        { label: "Home", path: "/" },
        { label: "Events", path: "/events" },
        { label: "Login", path: "/login" },
        { label: "Register", path: "/register" },
      ];
    }

    const commonItems = [
      { label: "Home", path: "/" },
      { label: "Events", path: "/events" },
    ];

    switch (user?.role) {
      case "admin":
        return [
          ...commonItems,
          { label: "Dashboard", path: "/admin/dashboard" },
          { label: "Manage Clubs/Organizers", path: "/admin/clubs" },
          { label: "Password Reset Requests", path: "/admin/password-requests" },
          { label: "Analytics", path: "/admin/analytics" },
          { label: "Profile", path: "/profile" },
        ];
      case "organizer":
        return [
          ...commonItems,
          { label: "Dashboard", path: "/organizer/dashboard" },
          { label: "My Events", path: "/organizer/events" },
          { label: "Ongoing Events", path: "/organizer/events?status=ongoing" },
          { label: "Create Event", path: "/organizer/events/create" },
          { label: "Analytics", path: "/organizer/analytics" },
          { label: "Profile", path: "/profile" },
        ];
      case "participant":
      default:
        return [
          ...commonItems,
          { label: "Dashboard", path: "/dashboard" },
          { label: "Browse Events", path: "/events" },
          { label: "Clubs/Organizers", path: "/clubs" },
          { label: "My Tickets", path: "/tickets" },
          { label: "Profile", path: "/profile" },
        ];
    }
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case "admin": return "danger";
      case "organizer": return "primary";
      case "participant": return "success";
      default: return "default";
    }
  };

  const navItems = getNavItems();
  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className="navbar" style={{ position: "relative" }}>
        {/* Brand */}
        <div className="navbar-brand">
          <Link to="/">Felicity Platform</Link>
        </div>

        {/* Desktop nav links */}
        {!isMobile && (
          <ul className="navbar-nav">
            {navItems.map((item, index) => (
              <li key={index}>
                <Link
                  to={item.path}
                  style={{
                    fontWeight: isActive(item.path) ? "700" : "400",
                    opacity: isActive(item.path) ? 1 : 0.8,
                  }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Right section */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {isAuthenticated && !isMobile && (
            <div className="navbar-user">
              <div className="navbar-user__info">
                <span className="navbar-user__name">
                  {user?.firstname} {user?.lastname}
                </span>
                <Badge variant={getRoleBadgeVariant(user?.role)} size="small">
                  {user?.role}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="small"
                onClick={() => setShowLogoutModal(true)}
              >
                Logout
              </Button>
            </div>
          )}

          {/* Hamburger button — mobile only */}
          {isMobile && (
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "1.5rem",
                color: "inherit",
                padding: "4px 8px",
                lineHeight: 1,
              }}
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile slide-down menu */}
      {isMobile && menuOpen && (
        <div
          style={{
            position: "fixed",
            top: "60px",
            left: 0,
            right: 0,
            zIndex: 999,
            background: "var(--navbar-bg, #0f0f1a)",
            borderBottom: "1px solid var(--border-color, #2a2a4a)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            padding: "12px 0 20px",
          }}
        >
          {/* User info strip */}
          {isAuthenticated && (
            <div
              style={{
                padding: "12px 20px",
                borderBottom: "1px solid var(--border-color, #2a2a4a)",
                marginBottom: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>
                  {user?.firstname} {user?.lastname}
                </div>
                <Badge variant={getRoleBadgeVariant(user?.role)} size="small">
                  {user?.role}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="small"
                onClick={() => {
                  setMenuOpen(false);
                  setShowLogoutModal(true);
                }}
              >
                Logout
              </Button>
            </div>
          )}

          {/* Nav links list */}
          <ul style={{ listStyle: "none", margin: 0, padding: "0 12px" }}>
            {navItems.map((item, index) => (
              <li key={index}>
                <Link
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: "block",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    fontWeight: isActive(item.path) ? "700" : "400",
                    background: isActive(item.path)
                      ? "rgba(99,102,241,0.15)"
                      : "transparent",
                    color: "inherit",
                    textDecoration: "none",
                    transition: "background 0.2s",
                  }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Logout confirmation modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Confirm Logout"
        size="small"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowLogoutModal(false)}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleLogout}>
              Logout
            </Button>
          </>
        }
      >
        <p>Are you sure you want to logout?</p>
      </Modal>
    </>
  );
};

export default Navbar;
