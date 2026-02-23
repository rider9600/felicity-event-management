import React from "react";
import "./Card.css";

const Card = ({ title, children, className = "", style = {} }) => {
  return (
    <div
      className={`card ${className}`}
      style={{
        borderRadius: "16px",
        overflow: "hidden",
        ...style,
      }}
    >
      {title && <h3 className="card-title">{title}</h3>}
      <div className="card-content">{children}</div>
    </div>
  );
};

export default Card;
