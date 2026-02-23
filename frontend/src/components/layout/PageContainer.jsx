import React from "react";
import "./PageContainer.css";

const PageContainer = ({
  children,
  title,
  subtitle,
  actions,
  className = "",
}) => {
  return (
    <div className={`page-container ${className}`}>
      {(title || actions) && (
        <div className="page-container__header">
          <div className="page-container__title-section">
            {title && <h1 className="page-container__title">{title}</h1>}
            {subtitle && <p className="page-container__subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="page-container__actions">{actions}</div>}
        </div>
      )}
      <div className="page-container__content">{children}</div>
    </div>
  );
};

export default PageContainer;
