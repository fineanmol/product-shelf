import { calculateMinPrice, normalizePrice } from "./utils";

// Remove all keys with undefined values — Firebase RTDB rejects them
const stripUndefined = (obj) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  );

export const buildProductPayload = (formData, user = {}, isNew = true) => {
  const normalizedCondition = formData.age || formData.condition || "New";
  const base = {
    ...formData,
    price: normalizePrice(formData.price),
    // Use conditional spread so the key is omitted entirely when not set
    ...(formData.original_price
      ? { original_price: normalizePrice(formData.original_price) }
      : {}),
    currency: formData.currency || "EUR",
    age: normalizedCondition,
    condition: normalizedCondition,
    ...(formData.admin_note ? { admin_note: formData.admin_note } : {}),
  };

  const payload = isNew
    ? {
        ...base,
        min_price: calculateMinPrice(formData.original_price),
        added_by: user?.uid || "unknown",
        added_email: user?.email || "",
        timestamp: Date.now(),
      }
    : {
        ...base,
        updatedAt: Date.now(),
      };

  // Final safety net: strip any remaining undefined values before DB write
  return stripUndefined(payload);
};
