// src/utils/bulkImportUtils.js
import * as XLSX from "xlsx";
import { buildProductPayload } from "./buildProductPayload";

// ─── Field definitions ────────────────────────────────────────────────────────
export const FIELD_DEFS = [
  { key: "title",            label: "Title",              required: true,  type: "text",   description: "Product name/title" },
  { key: "price",            label: "Price",              required: true,  type: "number", description: "Selling price (e.g. 49.99)" },
  { key: "description",      label: "Description",        required: false, type: "text",   description: "Product description" },
  { key: "image",            label: "Image URL",          required: false, type: "url",    description: "Direct link to product image (https://...)" },
  { key: "original_price",   label: "Original Price",     required: false, type: "number", description: "Original/retail price (for discount display)" },
  { key: "currency",         label: "Currency",           required: false, type: "select", description: "EUR, USD, GBP or INR", options: ["EUR","USD","GBP","INR"] },
  { key: "category",         label: "Category",           required: false, type: "select", description: "Electronics, Fashion, Home, Books, Toys, Sports or Other", options: ["Electronics","Fashion","Home","Books","Toys","Sports","Other"] },
  { key: "age",              label: "Condition",          required: false, type: "select", description: "New, Very Good, Good or Used", options: ["New","Very Good","Good","Used"] },
  { key: "source",           label: "Source",             required: false, type: "text",   description: "Where the product is from (e.g. Amazon, eBay)" },
  { key: "available_from",   label: "Available From",     required: false, type: "text",   description: "When the product is available (e.g. Now, 2024-06-01)" },
  { key: "url",              label: "Product URL",        required: false, type: "url",    description: "Link to the original product listing" },
  { key: "delivery_options", label: "Delivery Options",   required: false, type: "text",   description: "Comma-separated: Pick Up, Shipping" },
  { key: "status",           label: "Status",             required: false, type: "select", description: "available or reserved", options: ["available","reserved"] },
  { key: "visible",          label: "Visible",            required: false, type: "select", description: "true or false", options: ["true","false"] },
];

export const DEFAULT_VALUES = {
  description: "",
  image: "",
  original_price: "",
  currency: "EUR",
  category: "Other",
  age: "Good",
  condition: "Good",
  source: "",
  available_from: "Now",
  url: "",
  delivery_options: ["Pick Up", "Shipping"],
  status: "available",
  visible: true,
  sold_out: false,
  discount: 0,
};

// ─── Parse uploaded file ──────────────────────────────────────────────────────
export const parseFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
        resolve({ rows, headers });
      } catch (err) {
        reject(new Error("Failed to parse file. Please upload a valid .xlsx, .xls or .csv file."));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsArrayBuffer(file);
  });
};

// ─── Auto-map column headers to field keys ────────────────────────────────────
export const autoMapColumns = (headers) => {
  const mapping = {};
  FIELD_DEFS.forEach((field) => {
    // Try exact match first
    const exact = headers.find(
      (h) => h.toLowerCase().trim() === field.key.toLowerCase()
    );
    if (exact) { mapping[field.key] = exact; return; }

    // Try label match
    const labelMatch = headers.find(
      (h) => h.toLowerCase().trim() === field.label.toLowerCase()
    );
    if (labelMatch) { mapping[field.key] = labelMatch; return; }

    // Try fuzzy: remove spaces/underscores and compare
    const normalize = (s) => s.toLowerCase().replace(/[\s_-]/g, "");
    const fuzzy = headers.find(
      (h) => normalize(h) === normalize(field.key) || normalize(h) === normalize(field.label)
    );
    if (fuzzy) { mapping[field.key] = fuzzy; return; }

    mapping[field.key] = ""; // not mapped
  });
  return mapping;
};

// ─── Apply mapping to produce product-shaped rows ────────────────────────────
export const applyMapping = (rawRows, mapping) => {
  return rawRows.map((row, idx) => {
    const product = { _rowIndex: idx + 2 }; // +2 for header row + 1-indexed
    FIELD_DEFS.forEach((field) => {
      const col = mapping[field.key];
      if (col && row[col] !== undefined && row[col] !== "") {
        product[field.key] = String(row[col]).trim();
      }
    });
    return product;
  });
};

// ─── Validate a single row ────────────────────────────────────────────────────
export const validateRow = (row, defaults = {}) => {
  const errors = [];
  const warnings = [];

  FIELD_DEFS.forEach((field) => {
    const value = row[field.key];
    const hasDefault = defaults[field.key] !== undefined && defaults[field.key] !== "";

    if (field.required && (value === undefined || value === "")) {
      if (hasDefault) {
        warnings.push({ field: field.key, message: `Using default: "${defaults[field.key]}"` });
      } else {
        errors.push({ field: field.key, message: `"${field.label}" is required` });
      }
    }

    // Type coercions / value checks
    if (value !== undefined && value !== "") {
      if (field.type === "number" && isNaN(parseFloat(value))) {
        errors.push({ field: field.key, message: `"${field.label}" must be a number` });
      }
      if (field.key === "price" && parseFloat(value) <= 0) {
        errors.push({ field: field.key, message: `"Price" must be greater than 0` });
      }
      if (field.options && !field.options.map(o => o.toLowerCase()).includes(String(value).toLowerCase())) {
        warnings.push({ field: field.key, message: `"${value}" is not a standard value for ${field.label}. Will use as-is.` });
      }
    }
  });

  return { errors, warnings, valid: errors.length === 0 };
};

// ─── Merge defaults into a row ────────────────────────────────────────────────
export const applyDefaults = (row, customDefaults = {}) => {
  const merged = { ...DEFAULT_VALUES, ...customDefaults, ...row };

  // Normalise delivery_options string → array
  if (typeof merged.delivery_options === "string") {
    merged.delivery_options = merged.delivery_options
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  // Normalise visible → boolean
  if (merged.visible === "true" || merged.visible === true) merged.visible = true;
  else if (merged.visible === "false" || merged.visible === false) merged.visible = false;

  // Normalise price/original_price → number
  if (merged.price) merged.price = parseFloat(merged.price) || 0;
  if (merged.original_price) merged.original_price = parseFloat(merged.original_price) || undefined;

  // Keep condition in sync with age
  merged.condition = merged.age || merged.condition || DEFAULT_VALUES.age;
  merged.age = merged.condition;

  return merged;
};

// ─── Build Firebase-ready payload for one row ─────────────────────────────────
export const buildRowPayload = (row, user, customDefaults = {}) => {
  const merged = applyDefaults(row, customDefaults);
  return buildProductPayload(merged, user, true);
};

// ─── Download the official template .xlsx ────────────────────────────────────
export const downloadTemplate = () => {
  // Sheet 1: Data template with headers + example row
  const headers = FIELD_DEFS.map((f) => f.key);
  const example = {
    title: "Sony WH-1000XM5 Headphones",
    price: 199.99,
    description: "Premium noise-cancelling wireless headphones, barely used.",
    image: "https://example.com/image.jpg",
    original_price: 380,
    currency: "EUR",
    category: "Electronics",
    age: "Very Good",
    source: "Amazon",
    available_from: "Now",
    url: "https://amazon.com/dp/B09XS7JWHH",
    delivery_options: "Pick Up, Shipping",
    status: "available",
    visible: "true",
  };

  const dataSheet = XLSX.utils.json_to_sheet([example], { header: headers });

  // Column widths
  dataSheet["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 4, 20) }));

  // Sheet 2: Field guide
  const guide = FIELD_DEFS.map((f) => ({
    "Field Name": f.key,
    "Label": f.label,
    "Required": f.required ? "✅ Yes" : "No",
    "Type": f.type,
    "Valid Values / Notes": f.options ? f.options.join(", ") : f.description,
  }));
  const guideSheet = XLSX.utils.json_to_sheet(guide);
  guideSheet["!cols"] = [{ wch: 20 }, { wch: 18 }, { wch: 12 }, { wch: 10 }, { wch: 60 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, dataSheet, "Products");
  XLSX.utils.book_append_sheet(workbook, guideSheet, "Field Guide");

  XLSX.writeFile(workbook, "skymarket-product-template.xlsx");
};

// ─── Detect duplicate rows against existing products ─────────────────────────
// A duplicate is a row whose (normalised title + price) matches an existing product.
export const detectDuplicates = (rows, existingProducts = []) => {
  const fingerprints = new Set(
    existingProducts.map((p) =>
      `${String(p.title || "").trim().toLowerCase()}::${parseFloat(p.price) || 0}`
    )
  );
  return rows.map((row) => {
    const key = `${String(row.title || "").trim().toLowerCase()}::${parseFloat(row.price) || 0}`;
    return { ...row, _isDuplicate: fingerprints.has(key) };
  });
};

// ─── Check if uploaded file matches the template (1-1 mapping) ───────────────
export const isTemplateFile = (headers) => {
  const templateKeys = FIELD_DEFS.map((f) => f.key);
  const matched = templateKeys.filter((k) => headers.includes(k));
  return matched.length >= FIELD_DEFS.filter((f) => f.required).length;
};
