import React from "react";
import { FaSearch } from "react-icons/fa";

const SearchBar = ({ 
  value, 
  onChange, 
  placeholder = "Search...",
  className = "" 
}) => {
  return (
    <div className={`relative ${className}`}>
      <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        placeholder={placeholder}
        className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-sky focus:border-brand-sky transition-all hover:border-brand-sky"
        value={value}
        onChange={onChange}
      />
    </div>
  );
};

export default SearchBar;


