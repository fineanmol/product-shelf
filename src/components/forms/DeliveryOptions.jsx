// src/components/forms/DeliveryOptions.jsx
import React from "react";

const DeliveryOptions = ({
  options = ["Pick Up", "Shipping"],
  selected = [],
  setSelected,
  canEdit = true,
}) => {
  const toggleOption = (option) => {
    if (!canEdit) return;

    const updated = selected.includes(option)
      ? selected.filter((o) => o !== option)
      : [...selected, option];

    setSelected(updated);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Delivery Options
      </label>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => (
          <label
            key={option}
            className={`flex items-center space-x-2 border px-3 py-1 rounded-full text-sm ${
              selected.includes(option) ? "bg-gray-100" : "bg-white"
            } ${!canEdit ? "cursor-not-allowed opacity-70" : ""}`}
          >
            <input
              type="checkbox"
              checked={selected.includes(option)}
              disabled={!canEdit}
              onChange={() => toggleOption(option)}
            />
            <span>{option.charAt(0).toUpperCase() + option.slice(1)}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default DeliveryOptions;
