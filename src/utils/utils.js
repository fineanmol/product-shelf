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

export const countWords = (text) => text.trim().split(/\s+/).length;

export const updateWithCapitalization = (name, value, fieldsToSkip = []) => {
  return fieldsToSkip.includes(name)
    ? value
    : value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

export const normalizePrice = (val) =>
  parseFloat(String(val || "").replace(/[^\d.]/g, "")) || 0;
