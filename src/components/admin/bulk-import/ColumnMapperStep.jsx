// src/components/admin/bulk-import/ColumnMapperStep.jsx
import React from "react";
import { FIELD_DEFS } from "../../../utils/bulkImportUtils";
import { FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

export default function ColumnMapperStep({ headers, mapping, onChange, sampleRow }) {
  const unmappedRequired = FIELD_DEFS.filter(
    (f) => f.required && !mapping[f.key]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-brand-navy">Map Your Columns</h2>
        <p className="text-sm text-gray-500 mt-1">
          Match each product field to the corresponding column from your file.
          Required fields are marked with <span className="text-red-500 font-semibold">*</span>.
        </p>
      </div>

      {unmappedRequired.length > 0 && (
        <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
          <FaExclamationTriangle className="text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-amber-800">
            <strong>Required fields not yet mapped:</strong>{" "}
            {unmappedRequired.map((f) => f.label).join(", ")}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {FIELD_DEFS.map((field) => {
          const mapped = mapping[field.key];
          const sample = mapped && sampleRow ? sampleRow[mapped] : null;
          return (
            <div
              key={field.key}
              className={`grid grid-cols-12 items-center gap-3 p-3 rounded-xl border transition-colors ${
                mapped
                  ? "bg-green-50/50 border-green-100"
                  : field.required
                  ? "bg-red-50/40 border-red-100"
                  : "bg-gray-50 border-gray-100"
              }`}
            >
              {/* Field label */}
              <div className="col-span-4 flex items-center gap-2 min-w-0">
                {mapped ? (
                  <FaCheckCircle className="text-brand-mint text-sm flex-shrink-0" />
                ) : (
                  <span className="w-3 h-3 rounded-full border-2 border-gray-300 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-0.5">*</span>}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{field.description}</p>
                </div>
              </div>

              {/* Column select */}
              <div className="col-span-4">
                <select
                  value={mapping[field.key] || ""}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-sky focus:border-transparent transition-all"
                >
                  <option value="">— Not mapped —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              {/* Sample value */}
              <div className="col-span-4">
                {sample !== null && sample !== undefined && sample !== "" ? (
                  <span className="inline-block bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 max-w-full truncate font-mono">
                    {String(sample)}
                  </span>
                ) : mapped ? (
                  <span className="text-xs text-gray-400 italic">— empty in row 1 —</span>
                ) : (
                  <span className="text-xs text-gray-300 italic">no column selected</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
