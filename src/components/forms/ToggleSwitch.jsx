// src/components/forms/ToggleSwitch.jsx
import React from "react";

const ToggleSwitch = ({ label, checked, onChange, disabled = false }) => {
  // Determine label dynamically
  const statusLabel =
    label === "Status"
      ? checked
        ? "Available"
        : "Reserved"
      : checked
      ? "Visible"
      : "Hidden";

  const statusColor = checked ? "bg-green-600" : "bg-red-500";

  return (
    <label
      className={`flex items-center gap-3 ${
        disabled ? "cursor-not-allowed opacity-70" : ""
      }`}
    >
      <span className="text-sm font-medium">{label}</span>

      <div className="toggle-wrapper">
        <input
          type="checkbox"
          className="toggle-checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
        />
        <span className="toggle-slider" />
      </div>

      <span
        className={`w-20 text-center px-2 py-1 text-xs font-semibold rounded-full ${statusColor} text-white`}
      >
        {statusLabel}
      </span>
    </label>
  );
};

export default ToggleSwitch;
