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

    const trendClass = `dashboard-card__trend dashboard-card__trend--${trendDirection}`;
    const trendIcon = trendDirection === "up" ? "↗" : "↘";

    return (
      <span className={trendClass}>
        {trendIcon} {trend}
      </span>
    );
  };

  return (
    <Card
      className={`dashboard-card dashboard-card--${variant} ${onClick ? "dashboard-card--clickable" : ""}`}
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
