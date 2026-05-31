// src/components/admin/bulk-import/ValidationStep.jsx
import React from "react";
import { FIELD_DEFS, DEFAULT_VALUES } from "../../../utils/bulkImportUtils";
import { FaCheckCircle, FaExclamationTriangle, FaTimesCircle } from "react-icons/fa";

export default function ValidationStep({ validationResults, customDefaults, onDefaultChange, onSkipField }) {
  const { valid, warnings, errors } = validationResults;

  // Collect all unique problem fields across all rows
  const errorFields = {};
  const warningFields = {};

  errors.forEach((row) => {
    row.issues.forEach((issue) => {
      if (!errorFields[issue.field]) errorFields[issue.field] = 0;
      errorFields[issue.field]++;
    });
  });
  warnings.forEach((row) => {
    row.issues.forEach((issue) => {
      if (!warningFields[issue.field]) warningFields[issue.field] = 0;
      warningFields[issue.field]++;
    });
  });

  const fieldDef = (key) => FIELD_DEFS.find((f) => f.key === key);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-brand-navy">Validate & Set Defaults</h2>
        <p className="text-sm text-gray-500 mt-1">
          Review issues found in your file and set defaults for missing fields.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-green-50 border border-green-100 text-center">
          <FaCheckCircle className="text-brand-mint mx-auto mb-1 text-2xl" />
          <p className="text-2xl font-bold text-gray-800">{valid.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Ready to upload</p>
        </div>
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-center">
          <FaExclamationTriangle className="text-amber-500 mx-auto mb-1 text-2xl" />
          <p className="text-2xl font-bold text-gray-800">{warnings.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Using defaults</p>
        </div>
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-center">
          <FaTimesCircle className="text-red-400 mx-auto mb-1 text-2xl" />
          <p className="text-2xl font-bold text-gray-800">{errors.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Need attention</p>
        </div>
      </div>

      {/* Error fields — required to fix */}
      {Object.keys(errorFields).length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
            <FaTimesCircle className="text-red-400" /> Required fields missing
          </h3>
          {Object.entries(errorFields).map(([fieldKey, count]) => {
            const def = fieldDef(fieldKey);
            const hasDefault = customDefaults[fieldKey] !== undefined && customDefaults[fieldKey] !== "";
            return (
              <div key={fieldKey} className="p-4 bg-red-50 border border-red-100 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">
                      {def?.label || fieldKey}
                      <span className="ml-2 text-xs text-red-400 font-normal">
                        Missing in {count} row{count !== 1 ? "s" : ""}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">{def?.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {def?.options ? (
                    <select
                      value={customDefaults[fieldKey] || ""}
                      onChange={(e) => onDefaultChange(fieldKey, e.target.value)}
                      className="flex-1 text-sm border border-red-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-sky"
                    >
                      <option value="">— Set a default value —</option>
                      {def.options.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type={def?.type === "number" ? "number" : "text"}
                      placeholder={`Set default ${def?.label || fieldKey}…`}
                      value={customDefaults[fieldKey] || ""}
                      onChange={(e) => onDefaultChange(fieldKey, e.target.value)}
                      className="flex-1 text-sm border border-red-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-sky"
                    />
                  )}
                  <button
                    onClick={() => onSkipField(fieldKey)}
                    className="text-xs text-gray-500 hover:text-red-600 whitespace-nowrap px-3 py-2 border border-gray-200 rounded-lg hover:border-red-200 transition-colors"
                  >
                    Skip these {count} rows
                  </button>
                </div>

                {hasDefault && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <FaCheckCircle /> Default set — affected rows will use "{customDefaults[fieldKey]}"
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Warning fields — optional, using defaults */}
      {Object.keys(warningFields).length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
            <FaExclamationTriangle className="text-amber-500" /> Optional fields — using defaults
          </h3>
          {Object.entries(warningFields).map(([fieldKey, count]) => {
            const def = fieldDef(fieldKey);
            const defaultVal = customDefaults[fieldKey] ?? DEFAULT_VALUES[fieldKey];
            return (
              <div key={fieldKey} className="p-4 bg-amber-50 border border-amber-100 rounded-xl space-y-2">
                <p className="font-semibold text-gray-800 text-sm">
                  {def?.label || fieldKey}
                  <span className="ml-2 text-xs text-amber-600 font-normal">
                    Not set in {count} row{count !== 1 ? "s" : ""}
                  </span>
                </p>
                <div className="flex items-center gap-3">
                  {def?.options ? (
                    <select
                      value={customDefaults[fieldKey] || defaultVal || ""}
                      onChange={(e) => onDefaultChange(fieldKey, e.target.value)}
                      className="flex-1 text-sm border border-amber-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-sky"
                    >
                      {def.options.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type={def?.type === "number" ? "number" : "text"}
                      placeholder={`Default: ${defaultVal ?? "none"}`}
                      value={customDefaults[fieldKey] ?? defaultVal ?? ""}
                      onChange={(e) => onDefaultChange(fieldKey, e.target.value)}
                      className="flex-1 text-sm border border-amber-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-sky"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {errors.length === 0 && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-xl">
          <FaCheckCircle className="text-brand-mint text-xl" />
          <div>
            <p className="font-semibold text-gray-800 text-sm">All rows are valid!</p>
            <p className="text-xs text-gray-500">Click Next to review the preview table before uploading.</p>
          </div>
        </div>
      )}
    </div>
  );
}
