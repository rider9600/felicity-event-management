import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = ({ items = [], userRole = "participant" }) => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="sidebar">
      <div className="sidebar__header">
        <h3 className="sidebar__title">
          {userRole === "admin" && "Admin Dashboard"}
          {userRole === "organizer" && "Organizer Dashboard"}
          {userRole === "participant" && "My Dashboard"}
        </h3>
      </div>
      <nav className="sidebar__nav">
        {items.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className={`sidebar__link ${
              isActive(item.path) ? "sidebar__link--active" : ""
            }`}
          >
            {item.icon && <span className="sidebar__icon">{item.icon}</span>}
            <span className="sidebar__label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
