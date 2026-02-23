import React from "react";
import "./Input.css";

const Input = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder = "",
  required = false,
  error = "",
  className = "",
  options = [], // for select type
  rows = 3, // for textarea
  ...props
}) => {
  const renderInput = () => {
    if (type === "select") {
      return (
        <select
          value={value}
          onChange={onChange}
          className={`input ${error ? "input--error" : ""}`}
          required={required}
          {...props}
        >
          <option value="">{placeholder || "Select an option"}</option>
          {options.map((option, index) => (
            <option key={index} value={option.value || option}>
              {option.label || option}
            </option>
          ))}
        </select>
      );
    }

    if (type === "textarea") {
      return (
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`input ${error ? "input--error" : ""}`}
          required={required}
          rows={rows}
          {...props}
        />
      );
    }

    return (
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`input ${error ? "input--error" : ""}`}
        required={required}
        {...props}
      />
    );
  };

  return (
    <div className={`input-group ${className}`}>
      {label && (
        <label className="input-label">
          {label} {required && <span className="required">*</span>}
        </label>
      )}
      {renderInput()}
      {error && <span className="input-error">{error}</span>}
    </div>
  );
};

export default Input;
