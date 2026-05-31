// src/components/admin/bulk-import/UploadProgressStep.jsx
import React from "react";
import { FaCheckCircle, FaTimesCircle, FaSpinner } from "react-icons/fa";
import * as XLSX from "xlsx";

export default function UploadProgressStep({ rows, results, uploading, onGoToProducts }) {
  const done = results.filter((r) => r.status === "success").length;
  const failed = results.filter((r) => r.status === "error").length;
  const progress = rows.length > 0 ? Math.round((results.length / rows.length) * 100) : 0;

  const downloadFailedRows = () => {
    const failedRows = results
      .filter((r) => r.status === "error")
      .map((r) => ({ ...r.row, _error: r.error }));
    const ws = XLSX.utils.json_to_sheet(failedRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Failed Rows");
    XLSX.writeFile(wb, "skymarket-failed-imports.xlsx");
  };

  const isComplete = !uploading && results.length === rows.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-brand-navy">
          {isComplete ? "Import Complete!" : "Uploading Products…"}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {isComplete
            ? `${done} product${done !== 1 ? "s" : ""} uploaded successfully.`
            : `Uploading ${rows.length} products in batches…`}
        </p>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-500">
          <span>{results.length} of {rows.length} processed</span>
          <span>{progress}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-sky rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Summary cards */}
      {results.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-center">
            <FaCheckCircle className="text-brand-mint mx-auto mb-1 text-xl" />
            <p className="text-2xl font-bold text-gray-800">{done}</p>
            <p className="text-xs text-gray-500">Uploaded</p>
          </div>
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-center">
            <FaTimesCircle className="text-red-400 mx-auto mb-1 text-xl" />
            <p className="text-2xl font-bold text-gray-800">{failed}</p>
            <p className="text-xs text-gray-500">Failed</p>
          </div>
        </div>
      )}

      {/* Row-by-row status list (last 20 processed) */}
      {results.length > 0 && (
        <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
          {results.slice(-20).reverse().map((r, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              {r.status === "success"
                ? <FaCheckCircle className="text-brand-mint flex-shrink-0" />
                : <FaTimesCircle className="text-red-400 flex-shrink-0" />}
              <span className="flex-1 truncate text-gray-700">{r.row?.title || `Row ${r.rowIndex}`}</span>
              {r.status === "error" && (
                <span className="text-xs text-red-400 truncate max-w-[160px]">{r.error}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Uploading spinner */}
      {uploading && (
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <FaSpinner className="animate-spin text-brand-sky" />
          Uploading in batches of 10…
        </div>
      )}

      {/* Actions when done */}
      {isComplete && (
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onGoToProducts}
            className="flex-1 bg-brand-sky hover:bg-brand-navy text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
          >
            Go to Products →
          </button>
          {failed > 0 && (
            <button
              onClick={downloadFailedRows}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Download Failed Rows
            </button>
          )}
        </div>
      )}
    </div>
  );
}
