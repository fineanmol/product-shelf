// src/pages/admin/BulkImport.jsx
import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getDatabase, ref, push, get } from "firebase/database";
import { getAuth } from "firebase/auth";
import {
  autoMapColumns,
  applyMapping,
  validateRow,
  buildRowPayload,
  DEFAULT_VALUES,
  detectDuplicates,
} from "../../utils/bulkImportUtils";
import FileUploadStep from "../../components/admin/bulk-import/FileUploadStep";
import ColumnMapperStep from "../../components/admin/bulk-import/ColumnMapperStep";
import ValidationStep from "../../components/admin/bulk-import/ValidationStep";
import PreviewTableStep from "../../components/admin/bulk-import/PreviewTableStep";
import UploadProgressStep from "../../components/admin/bulk-import/UploadProgressStep";
import { showToast } from "../../utils/showToast";
import { FaArrowLeft, FaFileUpload } from "react-icons/fa";
import { getCurrentUserRole, filterDataByUserRole } from "../../utils/permissions";

const STEPS = ["Upload", "Map Columns", "Validate", "Preview", "Upload"];

export default function BulkImport() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // Existing products for duplicate detection
  const [existingProducts, setExistingProducts] = useState([]);

  // Step 1: parsed file data
  const [parsedData, setParsedData] = useState(null);

  // Step 2: column mapping  { fieldKey: columnHeader }
  const [mapping, setMapping] = useState({});

  // Step 3: processed rows + custom defaults + skipped fields
  const [processedRows, setProcessedRows] = useState([]);
  const [customDefaults, setCustomDefaults] = useState({});
  const [skippedFields, setSkippedFields] = useState(new Set());
  const [validationResults, setValidationResults] = useState({
    valid: [], warnings: [], errors: [],
  });

  // Step 4: per-row skips
  const [skippedRows, setSkippedRows] = useState(new Set());

  // Step 5: upload state
  const [uploadResults, setUploadResults] = useState([]);
  const [uploading, setUploading] = useState(false);

  // ── Fetch existing products for duplicate detection ──────────────────────────
  useEffect(() => {
    const fetchExisting = async () => {
      try {
        const db = getDatabase();
        const roleData = await getCurrentUserRole();
        const snapshot = await get(ref(db, "products"));
        if (snapshot.exists()) {
          const data = snapshot.val();
          let list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
          list = filterDataByUserRole(
            list,
            roleData.role,
            roleData.user?.uid,
            roleData.isSuperAdmin
          );
          setExistingProducts(list);
        }
      } catch (_) {
        // Non-critical — duplicate detection will just not work if this fails
      }
    };
    fetchExisting();
  }, []);

  // ── Step 1 → 2 ──────────────────────────────────────────────────────────────
  const handleParsed = (data) => {
    if (!data) { setParsedData(null); return; }
    setParsedData(data);
    setMapping(autoMapColumns(data.headers));
  };

  const goToMapper = () => {
    if (!parsedData) { showToast("Please upload a file first."); return; }
    setStep(1);
  };

  // ── Step 2 → 3 ──────────────────────────────────────────────────────────────
  const handleMappingChange = (fieldKey, columnHeader) => {
    setMapping((prev) => ({ ...prev, [fieldKey]: columnHeader }));
  };

  const goToValidation = () => {
    const rows = applyMapping(parsedData.rows, mapping);
    const valid = [], warnings = [], errors = [];

    rows.forEach((row) => {
      const result = validateRow(row, { ...DEFAULT_VALUES, ...customDefaults });
      const entry = { row, rowIndex: row._rowIndex, issues: [...result.errors, ...result.warnings] };
      if (!result.valid) {
        if (result.errors.length > 0) {
          row._status = "error";
          errors.push({ ...entry, issues: result.errors });
        }
        if (result.warnings.length > 0 && result.errors.length === 0) {
          row._status = "warning";
          warnings.push({ ...entry, issues: result.warnings });
        }
        if (result.errors.length > 0 && result.warnings.length > 0) {
          warnings.push({ ...entry, issues: result.warnings });
        }
      } else {
        row._status = "valid";
        valid.push(entry);
      }
    });

    setProcessedRows(rows);
    setValidationResults({ valid, warnings, errors });
    setStep(2);
  };

  // ── Step 3 helpers ───────────────────────────────────────────────────────────
  const handleDefaultChange = (fieldKey, value) => {
    setCustomDefaults((prev) => ({ ...prev, [fieldKey]: value }));
    setProcessedRows((prev) => {
      const updated = prev.map((row) => {
        const result = validateRow(row, { ...DEFAULT_VALUES, ...customDefaults, [fieldKey]: value });
        if (result.valid || result.errors.length === 0) {
          return { ...row, _status: result.warnings.length > 0 ? "warning" : "valid" };
        }
        return row;
      });
      const valid = [], warnings = [], errors = [];
      updated.forEach((row) => {
        const entry = { row, rowIndex: row._rowIndex, issues: [] };
        if (row._status === "error") errors.push(entry);
        else if (row._status === "warning") warnings.push(entry);
        else valid.push(entry);
      });
      setValidationResults({ valid, warnings, errors });
      return updated;
    });
  };

  const handleSkipField = (fieldKey) => {
    setSkippedFields((prev) => { const n = new Set(prev); n.add(fieldKey); return n; });
    setProcessedRows((prev) =>
      prev.map((row) => {
        const result = validateRow(row, { ...DEFAULT_VALUES, ...customDefaults });
        const hasThisError = result.errors.some((e) => e.field === fieldKey);
        if (hasThisError) return { ...row, _status: "skipped" };
        return row;
      })
    );
  };

  const goToPreview = () => {
    const unresolvedErrors = validationResults.errors.filter((e) =>
      e.issues.some((i) => {
        const hasDefault = customDefaults[i.field] !== undefined && customDefaults[i.field] !== "";
        return !hasDefault && !skippedFields.has(i.field);
      })
    );
    if (unresolvedErrors.length > 0) {
      showToast("⚠️ Please set defaults or skip all rows with errors first.");
      return;
    }
    // Run duplicate detection when entering preview
    const withDuplicates = detectDuplicates(processedRows, existingProducts);
    setProcessedRows(withDuplicates);

    // Auto-add duplicates to the skipped set
    const dupIndexes = withDuplicates
      .filter((r) => r._isDuplicate)
      .map((r) => r._rowIndex);
    if (dupIndexes.length > 0) {
      setSkippedRows((prev) => {
        const next = new Set(prev);
        dupIndexes.forEach((i) => next.add(i));
        return next;
      });
      showToast(`⚠️ ${dupIndexes.length} duplicate${dupIndexes.length !== 1 ? "s" : ""} detected and pre-skipped. You can un-skip them in the preview.`);
    }
    setStep(3);
  };

  // ── Step 4 helpers ───────────────────────────────────────────────────────────
  const handleToggleSkip = (rowIndex) => {
    setSkippedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowIndex)) next.delete(rowIndex);
      else next.add(rowIndex);
      return next;
    });
  };

  const handleSkipAllDuplicates = () => {
    const dupIndexes = processedRows
      .filter((r) => r._isDuplicate)
      .map((r) => r._rowIndex);
    setSkippedRows((prev) => {
      const next = new Set(prev);
      dupIndexes.forEach((i) => next.add(i));
      return next;
    });
  };

  const handleRestoreAllDuplicates = () => {
    const dupIndexes = processedRows
      .filter((r) => r._isDuplicate)
      .map((r) => r._rowIndex);
    setSkippedRows((prev) => {
      const next = new Set(prev);
      dupIndexes.forEach((i) => next.delete(i));
      return next;
    });
  };

  // ── Step 5: Upload ───────────────────────────────────────────────────────────
  const handleUpload = useCallback(async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    const db = getDatabase();

    const toUpload = processedRows.filter(
      (row) => !skippedRows.has(row._rowIndex) && row._status !== "skipped"
    );

    if (toUpload.length === 0) {
      showToast("No rows selected for upload.");
      return;
    }

    setUploading(true);
    setUploadResults([]);
    setStep(4);

    const BATCH = 10;
    const results = [];

    for (let i = 0; i < toUpload.length; i += BATCH) {
      const batch = toUpload.slice(i, i + BATCH);
      const batchResults = await Promise.allSettled(
        batch.map(async (row) => {
          const payload = buildRowPayload(row, user, customDefaults);
          await push(ref(db, "products"), payload);
          return { status: "success", row, rowIndex: row._rowIndex };
        })
      );

      batchResults.forEach((res, idx) => {
        if (res.status === "fulfilled") {
          results.push(res.value);
        } else {
          results.push({
            status: "error",
            row: batch[idx],
            rowIndex: batch[idx]._rowIndex,
            error: res.reason?.message || "Unknown error",
          });
        }
      });

      setUploadResults([...results]);
      await new Promise((r) => setTimeout(r, 200));
    }

    setUploading(false);
    const successCount = results.filter((r) => r.status === "success").length;
    showToast(`✅ ${successCount} product${successCount !== 1 ? "s" : ""} imported!`);
  }, [processedRows, skippedRows, customDefaults]);

  const uploadableCount = processedRows.filter(
    (r) => !skippedRows.has(r._rowIndex) && r._status !== "skipped"
  ).length;
  const duplicateCount = processedRows.filter((r) => r._isDuplicate).length;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6 space-y-6">

        {/* Page header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/products")}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-brand-navy transition-colors"
          >
            <FaArrowLeft />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <FaFileUpload className="text-brand-sky" />
              <h1 className="text-2xl font-bold text-brand-navy">Bulk Import Products</h1>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Import up to 200 products at once from an Excel or CSV file
            </p>
          </div>
        </div>

        {/* Step progress bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center">
            {STEPS.map((label, i) => (
              <React.Fragment key={i}>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    i < step ? "bg-brand-mint text-white"
                    : i === step ? "bg-brand-sky text-white"
                    : "bg-gray-100 text-gray-400"
                  }`}>
                    {i < step ? "✓" : i + 1}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${
                    i === step ? "text-brand-navy" : i < step ? "text-brand-mint" : "text-gray-400"
                  }`}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 transition-colors ${i < step ? "bg-brand-mint" : "bg-gray-100"}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          {step === 0 && <FileUploadStep onParsed={handleParsed} />}
          {step === 1 && (
            <ColumnMapperStep
              headers={parsedData?.headers || []}
              mapping={mapping}
              onChange={handleMappingChange}
              sampleRow={parsedData?.rows?.[0] || {}}
            />
          )}
          {step === 2 && (
            <ValidationStep
              validationResults={validationResults}
              customDefaults={customDefaults}
              onDefaultChange={handleDefaultChange}
              onSkipField={handleSkipField}
            />
          )}
          {step === 3 && (
            <PreviewTableStep
              rows={processedRows}
              skippedRows={skippedRows}
              onToggleSkip={handleToggleSkip}
              duplicateCount={duplicateCount}
              onSkipAllDuplicates={handleSkipAllDuplicates}
              onRestoreAllDuplicates={handleRestoreAllDuplicates}
            />
          )}
          {step === 4 && (
            <UploadProgressStep
              rows={processedRows.filter(
                (r) => !skippedRows.has(r._rowIndex) && r._status !== "skipped"
              )}
              results={uploadResults}
              uploading={uploading}
              onGoToProducts={() => navigate("/admin/products")}
            />
          )}
        </div>

        {/* Navigation buttons */}
        {step < 4 && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              ← Back
            </button>

            {step === 0 && (
              <button onClick={goToMapper} disabled={!parsedData}
                className="px-6 py-2.5 bg-brand-sky hover:bg-brand-navy text-white font-semibold rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm">
                Next: Map Columns →
              </button>
            )}
            {step === 1 && (
              <button onClick={goToValidation}
                className="px-6 py-2.5 bg-brand-sky hover:bg-brand-navy text-white font-semibold rounded-lg transition-colors text-sm">
                Next: Validate →
              </button>
            )}
            {step === 2 && (
              <button onClick={goToPreview}
                className="px-6 py-2.5 bg-brand-sky hover:bg-brand-navy text-white font-semibold rounded-lg transition-colors text-sm">
                Next: Preview →
              </button>
            )}
            {step === 3 && (
              <button onClick={handleUpload} disabled={uploadableCount === 0}
                className="px-6 py-2.5 bg-brand-mint hover:bg-green-600 text-white font-semibold rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm">
                Upload {uploadableCount} Product{uploadableCount !== 1 ? "s" : ""} →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
