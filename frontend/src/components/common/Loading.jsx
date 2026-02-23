import React from "react";
import "./Loading.css";

const Loading = ({ text = "Loading...", size = "medium" }) => {
  return (
    <div className="loading-container">
      <div className={`loading-spinner loading-spinner--${size}`}></div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
};

export default Loading;
