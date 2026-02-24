import React from "react";
import Card from "../Card";
import "./DashboardCard.css";

const DashboardCard = ({
  title,
  value,
  description,
  icon,
  trend,
  trendDirection = "up",
  variant = "default",
  onClick,
  children,
}) => {
  const renderTrend = () => {
    if (!trend) return null;

    // Support simple strings ("+12%") and objects like:
    // { value: "+12%", direction: "up" }
    const trendValue =
      typeof trend === "object" && trend !== null ? trend.value : trend;
    const direction =
      (typeof trend === "object" && trend !== null && trend.direction) ||
      trendDirection;

    if (!trendValue) return null;

    const trendClass = `dashboard-card__trend dashboard-card__trend--${direction}`;
    const trendIcon = direction === "down" ? "↘" : "↗";

    return (
      <span className={trendClass}>
        {trendIcon} {trendValue}
      </span>
    );
  };

  return (
    <Card
      className={`dashboard-card dashboard-card--${variant} ${
        onClick ? "dashboard-card--clickable" : ""
      }`}
      onClick={onClick}
    >
      <div className="dashboard-card__header">
        {icon && <div className="dashboard-card__icon">{icon}</div>}
        <div className="dashboard-card__content">
          <h3 className="dashboard-card__title">{title}</h3>
          {value !== undefined && (
            <div className="dashboard-card__value-row">
              <span className="dashboard-card__value">{value}</span>
              {renderTrend()}
            </div>
          )}
          {description && (
            <p className="dashboard-card__description">{description}</p>
          )}
        </div>
      </div>
      {children && <div className="dashboard-card__body">{children}</div>}
    </Card>
  );
};

export default DashboardCard;

