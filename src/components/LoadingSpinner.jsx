import "./LoadingSpinner.css";

const LoadingSpinner = ({ size = "medium", message = "" }) => {
  return (
    <div className="loading-container">
      <div className={`spinner spinner-${size}`}></div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
