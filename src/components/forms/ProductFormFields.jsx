// src/components/forms/ProductFormFields.jsx
import React, { useEffect } from "react";
import {
  countWords,
  calculateDiscountedPrice,
  calculateDiscountPercent,
  normalizePrice,
  currencySymbols,
  CONDITION_OPTIONS,
} from "../../utils/utils";
import { getUserAccess } from "../../utils/permissions";

const ProductFormFields = ({
  formData,
  setFormData,
  handleChange,
  canEdit,
}) => {
  const { isSuperAdmin } = getUserAccess(formData);

  const disabledClass = !canEdit
    ? "bg-gray-100 cursor-not-allowed opacity-70"
    : "";

  const safeValue = (value) =>
    value !== undefined && value !== null ? value : "";

  useEffect(() => {
    if (!canEdit) return;

    const original = normalizePrice(formData.original_price);
    const discount = formData.discount;
    const price = normalizePrice(formData.price);

    // Keep price/discount/ in sync
    if (original && discount >= 20 && discount <= 30) {
      const updatedPrice = parseFloat(
        calculateDiscountedPrice(original, discount)
      );
      if (updatedPrice !== price) {
        setFormData((prev) => ({
          ...prev,
          price: updatedPrice,
        }));
      }
    } else if (original && price) {
      const updatedDiscount = calculateDiscountPercent(original, price);
      if (updatedDiscount !== discount) {
        setFormData((prev) => ({
          ...prev,
          discount: updatedDiscount,
        }));
      }
    }
  }, [formData.original_price, formData.price, formData.discount, canEdit]);

  return (
    <>
      {/* Image URL */}
      <div className="flex flex-col sm:flex-row items-start sm:items-left gap-4">
        <div className="flex-1 w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Image URL
          </label>
          <input
            name="image"
            value={safeValue(formData.image)}
            onChange={handleChange}
            disabled={!canEdit}
            className={`w-full p-2 border rounded text-sm ${disabledClass}`}
          />
        </div>
        {formData.image && (
          <img
            src={formData.image}
            alt="Preview"
            className="w-24 h-24 sm:w-32 sm:h-32 object-contain rounded"
          />
        )}
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          name="title"
          value={safeValue(formData.title)}
          onChange={handleChange}
          disabled={!canEdit}
          className={`w-full p-2 border rounded text-sm ${disabledClass}`}
        />
        <p className="text-xs text-gray-500">
          {100 - countWords(formData.title || "")} words remaining
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          name="description"
          value={safeValue(formData.description)}
          onChange={handleChange}
          disabled={!canEdit}
          className={`w-full p-2 border rounded text-sm ${disabledClass}`}
          rows={4}
        />
        <p className="text-xs text-gray-500">
          {100 - countWords(formData.description || "")} words remaining
        </p>
      </div>

      {/* Price Section */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Price
          </label>
          <div className="flex rounded border overflow-hidden">
            <input
              type="number"
              name="price"
              value={safeValue(formData.price)}
              onChange={handleChange}
              disabled={!canEdit}
              className={`w-full p-2 text-sm ${disabledClass}`}
              placeholder="e.g. 6"
            />
            <span className="bg-gray-100 px-3 py-2 text-sm text-gray-600">
              {currencySymbols[formData.currency] || formData.currency}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Original Price
          </label>
          <div className="flex rounded border overflow-hidden">
            <input
              name="original_price"
              value={safeValue(formData.original_price)}
              onChange={handleChange}
              disabled={!canEdit}
              className={`w-full p-2 border rounded text-sm ${disabledClass}`}
              placeholder="Optional"
            />
            <span className="bg-gray-100 px-3 py-2 text-sm text-gray-600">
              {currencySymbols[formData.currency] || formData.currency}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Discount (%)
          </label>
          <input
            type="number"
            name="discount"
            value={safeValue(formData.discount)}
            onChange={handleChange}
            disabled={!canEdit}
            className={`w-full p-2 border rounded text-sm ${disabledClass}`}
            placeholder="e.g. 25"
          />
        </div>
      </div>

      {/* Currency / Condition / Sold Out */}
      <div className="grid grid-cols-3 gap-3 mt-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Currency
          </label>
          <select
            name="currency"
            value={formData.currency || "EUR"}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, currency: e.target.value }))
            }
            disabled={!canEdit}
            className={`w-full p-2 border rounded text-sm ${disabledClass}`}
          >
            <option value="EUR">Euro</option>
            <option value="USD">USD</option>
            <option value="INR">INR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Condition / Age
          </label>
          <select
            name="age"
            value={formData.age || "New"}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, age: e.target.value }))
            }
            disabled={!canEdit}
            className={`w-full p-2 border rounded text-sm mt-1 ${disabledClass}`}
          >
            {CONDITION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 mt-7">
          <input
            type="checkbox"
            id="sold_out"
            disabled={!canEdit}
            checked={formData.sold_out === true}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                sold_out: e.target.checked,
                status: e.target.checked ? "reserved" : "available",
              }))
            }
          />
          <label htmlFor="sold_out" className="text-sm text-gray-700">
            Mark as Sold Out
          </label>
        </div>
      </div>

      {/* Source & Admin Fields */}
      <div className="grid grid-cols-3 gap-3 mt-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Source
          </label>
          <input
            name="source"
            value={safeValue(formData.source)}
            onChange={handleChange}
            disabled={!canEdit}
            className={`w-fit p-2 border rounded text-sm ${disabledClass}`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Product URL
          </label>
          <input
            name="url"
            value={safeValue(formData.url)}
            onChange={handleChange}
            disabled={!canEdit}
            className={`w-full p-2 border rounded text-sm ${disabledClass}`}
            placeholder="https://..."
          />
        </div>
        <div className="w-fit">
          <label className="block text-sm font-medium text-gray-700">
            Available From
          </label>
          <input
            name="available_from"
            value={safeValue(formData.available_from)}
            onChange={handleChange}
            disabled={!canEdit}
            className={`w-fit p-2 border rounded text-sm ${disabledClass}`}
          />
        </div>
        {isSuperAdmin && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">
              Admin Notes
            </label>
            <textarea
              name="admin_note"
              value={formData.admin_note || ""}
              onChange={handleChange}
              className="w-full p-2 border rounded text-sm"
              placeholder="Optional notes visible only to super admin"
              rows={3}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default ProductFormFields;
