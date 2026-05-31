// src/components/admin/bulk-import/PreviewTableStep.jsx
import React, { useState } from "react";
import { FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaEyeSlash } from "react-icons/fa";

const PAGE_SIZE = 20;

export default function PreviewTableStep({ rows, skippedRows, onToggleSkip }) {
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const readyCount = rows.filter((r) => !skippedRows.has(r._rowIndex) && r._status !== "error").length;
  const skippedCount = skippedRows.size + rows.filter((r) => r._status === "error").length;

  const statusIcon = (row) => {
    if (skippedRows.has(row._rowIndex)) return <FaEyeSlash className="text-gray-400" />;
    if (row._status === "error") return <FaTimesCircle className="text-red-400" />;
    if (row._status === "warning") return <FaExclamationTriangle className="text-amber-400" />;
    return <FaCheckCircle className="text-brand-mint" />;
  };

  const rowClass = (row) => {
    if (skippedRows.has(row._rowIndex)) return "opacity-40 bg-gray-50";
    if (row._status === "error") return "bg-red-50";
    if (row._status === "warning") return "bg-amber-50/40";
    return "bg-white hover:bg-gray-50";
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-brand-navy">Preview & Review</h2>
        <p className="text-sm text-gray-500 mt-1">
          Review all rows before uploading. Toggle individual rows to skip them.
        </p>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5 text-brand-mint font-semibold">
          <FaCheckCircle /> {readyCount} ready
        </span>
        <span className="flex items-center gap-1.5 text-gray-400 font-semibold">
          <FaEyeSlash /> {skippedCount} skipped
        </span>
        <span className="text-gray-400">of {rows.length} total rows</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-3 text-left font-semibold text-gray-500 w-10">#</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-500 w-8">Status</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-500">Title</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-500">Price</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-500">Currency</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-500">Condition</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-500">Category</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-500">Status</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-500 w-16">Skip</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pageRows.map((row) => (
              <tr key={row._rowIndex} className={`transition-colors ${rowClass(row)}`}>
                <td className="px-3 py-2.5 text-gray-400">{row._rowIndex}</td>
                <td className="px-3 py-2.5">{statusIcon(row)}</td>
                <td className="px-3 py-2.5 font-medium text-gray-800 max-w-[200px] truncate">
                  {row.title || <span className="text-red-400 italic">Missing</span>}
                </td>
                <td className="px-3 py-2.5 text-gray-700">
                  {row.price
                    ? `${row.price}`
                    : <span className="text-red-400 italic">Missing</span>}
                </td>
                <td className="px-3 py-2.5 text-gray-600">{row.currency || "EUR"}</td>
                <td className="px-3 py-2.5 text-gray-600">{row.age || row.condition || "—"}</td>
                <td className="px-3 py-2.5 text-gray-600">{row.category || "—"}</td>
                <td className="px-3 py-2.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                    row.status === "available"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {row.status || "available"}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <button
                    onClick={() => onToggleSkip(row._rowIndex)}
                    className={`w-8 h-5 rounded-full transition-all ${
                      skippedRows.has(row._rowIndex)
                        ? "bg-gray-300"
                        : "bg-brand-sky"
                    }`}
                  >
                    <span className={`block w-4 h-4 rounded-full bg-white shadow transition-transform mx-0.5 ${
                      skippedRows.has(row._rowIndex) ? "translate-x-0" : "translate-x-3"
                    }`} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            ← Prev
          </button>
          <span className="text-xs text-gray-500">
            Page {page + 1} of {totalPages}
          </span>
          <button
            disabled={page === totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
