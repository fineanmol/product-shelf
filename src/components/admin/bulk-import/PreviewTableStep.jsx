// src/components/admin/bulk-import/PreviewTableStep.jsx
import React, { useState } from "react";
import { FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaEyeSlash, FaCopy } from "react-icons/fa";

const PAGE_SIZE = 20;

export default function PreviewTableStep({
  rows,
  skippedRows,
  onToggleSkip,
  duplicateCount = 0,
  onSkipAllDuplicates,
  onRestoreAllDuplicates,
}) {
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const readyCount = rows.filter((r) => !skippedRows.has(r._rowIndex) && r._status !== "error").length;
  const skippedCount = rows.filter((r) => skippedRows.has(r._rowIndex) || r._status === "error").length;
  const skippedDuplicatesCount = rows.filter((r) => r._isDuplicate && skippedRows.has(r._rowIndex)).length;

  const statusIcon = (row) => {
    if (skippedRows.has(row._rowIndex)) return <FaEyeSlash className="text-gray-400" />;
    if (row._status === "error") return <FaTimesCircle className="text-red-400" />;
    if (row._isDuplicate) return <FaCopy className="text-amber-400" />;
    if (row._status === "warning") return <FaExclamationTriangle className="text-amber-400" />;
    return <FaCheckCircle className="text-brand-mint" />;
  };

  const rowClass = (row) => {
    if (skippedRows.has(row._rowIndex)) return "opacity-40 bg-gray-50";
    if (row._status === "error") return "bg-red-50";
    if (row._isDuplicate) return "bg-amber-50/60";
    if (row._status === "warning") return "bg-amber-50/30";
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

      {/* Duplicate detection banner */}
      {duplicateCount > 0 && (
        <div className="flex items-center justify-between gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-3">
            <FaCopy className="text-amber-500 text-lg flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-900 text-sm">
                {duplicateCount} duplicate{duplicateCount !== 1 ? "s" : ""} detected
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                These rows match existing products by title + price.{" "}
                {skippedDuplicatesCount === duplicateCount
                  ? "All are pre-skipped."
                  : `${skippedDuplicatesCount} of ${duplicateCount} skipped.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onSkipAllDuplicates}
              className="text-xs font-semibold px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg transition-colors"
            >
              Skip all
            </button>
            <button
              onClick={onRestoreAllDuplicates}
              className="text-xs font-semibold px-3 py-1.5 bg-white hover:bg-gray-50 border border-amber-200 text-amber-700 rounded-lg transition-colors"
            >
              Upload anyway
            </button>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5 text-brand-mint font-semibold">
          <FaCheckCircle /> {readyCount} ready
        </span>
        <span className="flex items-center gap-1.5 text-gray-400 font-semibold">
          <FaEyeSlash /> {skippedCount} skipped
        </span>
        {duplicateCount > 0 && (
          <span className="flex items-center gap-1.5 text-amber-500 font-semibold">
            <FaCopy /> {duplicateCount} duplicate{duplicateCount !== 1 ? "s" : ""}
          </span>
        )}
        <span className="text-gray-400">of {rows.length} total</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-3 text-left font-semibold text-gray-500 w-10">#</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-500 w-8"></th>
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
                <td className="px-3 py-2.5 font-medium text-gray-800 max-w-[200px]">
                  <div className="truncate">{row.title || <span className="text-red-400 italic">Missing</span>}</div>
                  {row._isDuplicate && !skippedRows.has(row._rowIndex) && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded mt-0.5">
                      <FaCopy className="text-[8px]" /> duplicate
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-gray-700">
                  {row.price || <span className="text-red-400 italic">Missing</span>}
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
                    title={skippedRows.has(row._rowIndex) ? "Include this row" : "Skip this row"}
                    className={`w-8 h-5 rounded-full transition-all ${
                      skippedRows.has(row._rowIndex) ? "bg-gray-300" : "bg-brand-sky"
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
          <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors">
            ← Prev
          </button>
          <span className="text-xs text-gray-500">Page {page + 1} of {totalPages}</span>
          <button disabled={page === totalPages - 1} onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors">
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
