import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import "./DashboardLayout.css";

const DashboardLayout = ({
  children,
  sidebarItems = [],
  userRole = "participant",
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 900;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false); // reset on desktop
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className="dashboard-layout"
      style={{ position: "relative" }}
    >
      {/* Mobile sidebar toggle button */}
      {isMobile && (
        <button
          onClick={() => setSidebarOpen((prev) => !prev)}
          aria-label="Toggle sidebar"
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            zIndex: 1100,
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "var(--primary, #6366f1)",
            color: "#fff",
            border: "none",
            fontSize: "1.3rem",
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(99,102,241,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {sidebarOpen ? "✕" : "☰"}
        </button>
      )}

      {/* Sidebar overlay on mobile */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1000,
          }}
        />
      )}

      {/* Sidebar */}
      <div
        style={
          isMobile
            ? {
                position: "fixed",
                top: 0,
                left: sidebarOpen ? 0 : "-280px",
                width: "260px",
                height: "100vh",
                zIndex: 1050,
                transition: "left 0.28s cubic-bezier(0.4,0,0.2,1)",
                overflowY: "auto",
              }
            : undefined
        }
      >
        <Sidebar items={sidebarItems} userRole={userRole} />
      </div>

      {/* Main content */}
      <main
        className="dashboard-layout__main"
        style={
          isMobile
            ? { marginLeft: 0, width: "100%" }
            : undefined
        }
      >
        <div className="dashboard-layout__content">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
