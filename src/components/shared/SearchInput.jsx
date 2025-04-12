// src/components/shared/SearchInput.jsx
import React from "react";

const SearchInput = ({ value, onChange, placeholder = "Search..." }) => {
  return (
    <input
      type="text"
      className="border px-3 py-2 rounded w-full sm:w-64 text-sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
};

export default SearchInput;
