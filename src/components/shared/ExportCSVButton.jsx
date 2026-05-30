// src/components/shared/ExportCSVButton.jsx
import React from "react";
import { FaDownload } from "react-icons/fa";

const ExportCSVButton = ({ data, headers, filename = "data.csv" }) => {
  const handleExport = () => {
    if (!data || data.length === 0) return;

    const csvContent = [
      headers.join(","),
      ...data.map((row) => headers.map((h) => row[h] ?? "").join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  return (
    <button
      onClick={handleExport}
      className="bg-brand-mint text-brand-navy hover:bg-brand-navy hover:text-white px-3 py-2.5 rounded-lg flex items-center gap-1.5 text-sm font-semibold transition-colors shadow-sm"
    >
      <FaDownload /> Export CSV
    </button>
  );
};

export default ExportCSVButton;
