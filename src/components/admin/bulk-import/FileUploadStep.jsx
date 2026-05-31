// src/components/admin/bulk-import/FileUploadStep.jsx
import React, { useRef, useState } from "react";
import { FaFileExcel, FaUpload, FaDownload, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { parseFile, downloadTemplate, isTemplateFile } from "../../../utils/bulkImportUtils";

const ACCEPTED = [".xlsx", ".xls", ".csv"];

export default function FileUploadStep({ onParsed }) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const inputRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!ACCEPTED.includes(ext)) {
      setError("Please upload a .xlsx, .xls or .csv file.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { rows, headers } = await parseFile(file);
      if (rows.length === 0) { setError("The file appears to be empty."); setLoading(false); return; }
      if (rows.length > 200) { setError("File has more than 200 rows. Please split into smaller batches of up to 200 products."); setLoading(false); return; }
      const isTemplate = isTemplateFile(headers);
      setPreview({ rows, headers, fileName: file.name, isTemplate });
      onParsed({ rows, headers, isTemplate });
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-brand-navy">Upload Your File</h2>
        <p className="text-sm text-gray-500 mt-1">
          Upload an Excel (.xlsx, .xls) or CSV file. Up to 500 products per import.
        </p>
      </div>

      {/* Download template */}
      <div className="flex items-start gap-4 p-4 bg-brand-sky/5 border border-brand-sky/20 rounded-xl">
        <div className="w-10 h-10 bg-brand-sky/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <FaFileExcel className="text-brand-sky text-lg" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-brand-navy text-sm">Use our official template</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Pre-formatted with all columns + a Field Guide sheet. Upload it back and columns auto-map — no manual matching needed.
          </p>
        </div>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 bg-brand-sky hover:bg-brand-navy text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex-shrink-0"
        >
          <FaDownload /> Download Template
        </button>
      </div>

      {/* Drop zone */}
      {!preview ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
            dragging
              ? "border-brand-sky bg-brand-sky/5 scale-[1.01]"
              : "border-gray-200 hover:border-brand-sky hover:bg-gray-50"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-brand-sky border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Parsing file…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                <FaUpload className="text-gray-400 text-xl" />
              </div>
              <div>
                <p className="font-semibold text-gray-700">Drop your file here, or click to browse</p>
                <p className="text-xs text-gray-400 mt-1">Supports .xlsx · .xls · .csv</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* File preview after parse */
        <div className="border border-gray-200 rounded-xl p-5 space-y-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <FaCheckCircle className="text-brand-mint text-lg" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{preview.fileName}</p>
                <p className="text-xs text-gray-500">
                  {preview.rows.length} rows · {preview.headers.length} columns detected
                </p>
              </div>
            </div>
            <button
              onClick={() => { setPreview(null); onParsed(null); }}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <FaTimesCircle />
            </button>
          </div>

          {preview.isTemplate && (
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-sky bg-brand-sky/5 border border-brand-sky/20 rounded-lg px-3 py-2">
              <FaCheckCircle /> Official SkyMarket template detected — columns will auto-map!
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="text-xs w-full">
              <thead className="bg-gray-50">
                <tr>
                  {preview.headers.slice(0, 6).map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                  {preview.headers.length > 6 && (
                    <th className="px-3 py-2 text-gray-400">+{preview.headers.length - 6} more</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, 3).map((row, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    {preview.headers.slice(0, 6).map((h) => (
                      <td key={h} className="px-3 py-2 text-gray-600 truncate max-w-[120px]">
                        {String(row[h] ?? "")}
                      </td>
                    ))}
                    {preview.headers.length > 6 && <td className="px-3 py-2 text-gray-300">…</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 flex items-center gap-2">
          <FaTimesCircle /> {error}
        </p>
      )}
    </div>
  );
}
