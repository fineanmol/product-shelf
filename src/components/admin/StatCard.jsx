// src/components/admin/StatCard.jsx
import React from "react";

const StatCard = ({ title, value, subtitle, icon }) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow text-gray-700 flex items-center gap-4">
      <div className="text-2xl text-blue-500">{icon}</div>
      <div>
        <div className="text-sm text-gray-500">{title}</div>
        <div className="text-xl font-bold">{value}</div>
        {subtitle && (
          <div className="text-xs text-gray-400 mt-1">{subtitle}</div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
