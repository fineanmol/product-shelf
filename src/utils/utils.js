// src/utils/utils.js

export const currencySymbols = {
  EUR: "€",
  USD: "$",
  INR: "₹",
  GBP: "£",
};

export const calculateDiscountedPrice = (original, discount) =>
  ((original * (100 - discount)) / 100).toFixed(2);

export const calculateDiscountPercent = (original, discounted) =>
  Math.round(((original - discounted) / original) * 100);

export const calculateMinPrice = (original) => {
  const val = parseFloat(original);
  return val && !isNaN(val) ? (val * 0.44).toFixed(2) : "";
};

export const countWords = (text) => text.trim().split(/\s+/).length;

export const updateWithCapitalization = (name, value, fieldsToSkip = []) => {
  return fieldsToSkip.includes(name)
    ? value
    : value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

export const normalizePrice = (val) =>
  parseFloat(String(val || "").replace(/[^\d.]/g, "")) || 0;

export const CONDITION_OPTIONS = [
  { value: "New", label: "🆕 New (Unused)" },
  { value: "Very Good", label: "👍 Very Good (Minimal signs of use)" },
  { value: "Good", label: "✅ Good (Used but functional)" },
];

export const getConditionLabel = (val) => {
  if (!val) return "";
  const normalized = val
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const iconMap = {
    "New": "🆕",
    "Very Good": "👍",
    "Good": "✅",
    "Used": "📦",
  };
  return `${iconMap[normalized] || ""} ${normalized}`;
};

