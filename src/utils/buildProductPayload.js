import { calculateMinPrice, normalizePrice } from "./utils";

export const buildProductPayload = (formData, user = {}, isNew = true) => {
  const base = {
    ...formData,
    price: normalizePrice(formData.price),
    original_price: formData.original_price
      ? normalizePrice(formData.original_price)
      : undefined,
    currency: formData.currency || "EUR",
    age: formData.age || "New",
    ...(formData.admin_note && { admin_note: formData.admin_note }),
  };

  if (isNew) {
    return {
      ...base,
      min_price: calculateMinPrice(formData.original_price),
      added_by: user?.uid || "unknown",
      added_email: user?.email || "",
      timestamp: Date.now(),
    };
  }

  return {
    ...base,
    updatedAt: Date.now(),
  };
};
