// src/components/forms/ProductFormFields.jsx

import React, { useEffect, useState } from "react";
import {
  countWords,
  calculateDiscountedPrice,
  calculateDiscountPercent,
  normalizePrice,
  currencySymbols,
  CONDITION_OPTIONS,
} from "../../utils/utils";
import { getUserAccess } from "../../utils/permissions";
import { FaTruck, FaMapMarkerAlt } from "react-icons/fa";

/**
 * Toggles 'Shipping'/'Pick Up' in the delivery_options array.
 */
function handleDeliveryOptionChange(e, formData, setFormData) {
  const { value, checked } = e.target;
  let newOptions = Array.isArray(formData.delivery_options)
    ? [...formData.delivery_options]
    : [];

  if (checked) {
    if (!newOptions.includes(value)) newOptions.push(value);
  } else {
    newOptions = newOptions.filter((opt) => opt !== value);
  }

  setFormData((prev) => ({ ...prev, delivery_options: newOptions }));
}

const ProductFormFields = ({
  formData,
  setFormData,
  handleChange,
  canEdit,
}) => {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    async function fetchUserAccess() {
      try {
        const access = await getUserAccess(formData);
        setIsSuperAdmin(access.isSuperAdmin);
      } catch (error) {
        console.error("Error fetching user access:", error);
      }
    }

    if (formData) {
      fetchUserAccess();
    }
  }, [formData]);

  // Track which field the user last edited: "price" or "discount".
  const [lastChanged, setLastChanged] = useState(null);

  // Helper to disable fields
  const disabledClass = !canEdit
    ? "bg-gray-100 cursor-not-allowed opacity-70"
    : "";

  // For safer reading of any formData field
  const safeValue = (v) => (v !== undefined && v !== null ? v : "");

  /**
   * If user is adding a product (price is empty/undefined) and original_price > 0,
   * auto-fill price to 70% of original_price.
   * (Happens once, or whenever user sets original_price and leaves price blank.)
   */
  useEffect(() => {
    if (!canEdit) return;
    const originalVal = normalizePrice(formData.original_price);

    if (
      originalVal > 0 &&
      (formData.price === "" || formData.price === undefined)
    ) {
      const seventyPercent = parseFloat((originalVal * 0.7).toFixed(2));
      setFormData((prev) => ({
        ...prev,
        price: seventyPercent,
      }));
    }
  }, [formData.original_price, formData.price, canEdit, setFormData]);

  /**
   * Sync price & discount whenever user changes them, only if original_price > 0.
   * - If lastChanged=price => recalc discount, clamp [0..100].
   * - If lastChanged=discount => recalc price, clamp >= 0.
   * - If original_price <= 0 => skip all sync logic.
   */
  useEffect(() => {
    if (!canEdit) return;

    const orig = normalizePrice(formData.original_price);
    if (!orig || orig <= 0) return; // skip if no valid original

    const p = normalizePrice(formData.price);
    const d = parseFloat(formData.discount) || 0;

    if (lastChanged === "price") {
      // Recalc discount
      let price = p < 0 ? 0 : p;
      let discount = calculateDiscountPercent(orig, price);
      if (discount < 0) discount = 0;
      if (discount > 100) discount = 100;

      if (discount !== d || price !== p) {
        setFormData((prev) => ({
          ...prev,
          price,
          discount,
        }));
      }
    } else if (lastChanged === "discount") {
      // Recalc price
      let discount = d < 0 ? 0 : d > 100 ? 100 : d;
      let newPrice = parseFloat(calculateDiscountedPrice(orig, discount));
      if (newPrice < 0) newPrice = 0;

      if (newPrice !== p || discount !== d) {
        setFormData((prev) => ({
          ...prev,
          price: newPrice,
          discount,
        }));
      }
    }
  }, [
    formData.price,
    formData.discount,
    formData.original_price,
    canEdit,
    lastChanged,
    setFormData,
  ]);

  // Specialized onChange for "price" or "discount"
  const handlePriceDiscountChange = (e) => {
    handleChange(e);
    if (e.target.name === "price") {
      setLastChanged("price");
    } else if (e.target.name === "discount") {
      setLastChanged("discount");
    }
  };

  return (
    <div className="bg-white p-3 sm:p-4 rounded-lg shadow space-y-2 sm:space-y-4">
      {/* If read-only, show a small banner */}
      {!canEdit && (
        <div className="bg-yellow-100 text-yellow-700 p-2 rounded">
          You do not have permission to edit this product (read-only).
        </div>
      )}

      {/* Title & Image URL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Title */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700">Title</label>
          <input
            name="title"
            value={safeValue(formData.title)}
            onChange={handleChange}
            disabled={!canEdit}
            className={`p-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-300 ${disabledClass}`}
            placeholder="Product title..."
          />
          <p className="text-[11px] text-gray-400">
            {100 - countWords(formData.title || "")} words left
          </p>
        </div>

        {/* Image */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700">Image URL</label>
          <input
            name="image"
            value={safeValue(formData.image)}
            onChange={handleChange}
            disabled={!canEdit}
            className={`p-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-300 ${disabledClass}`}
            placeholder="https://..."
          />
        </div>
      </div>

      {/* Image Preview (if any) */}
      {formData.image && (
        <div className="flex justify-center">
          <img
            src={formData.image}
            alt="Preview"
            className="max-w-[90px] max-h-[90px] object-contain border rounded"
          />
        </div>
      )}

      {/* Description */}
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-700">Description</label>
        <textarea
          name="description"
          value={safeValue(formData.description)}
          onChange={handleChange}
          disabled={!canEdit}
          rows={2}
          className={`p-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-300 ${disabledClass}`}
          placeholder="Describe the product..."
        />
        <p className="text-[11px] text-gray-400">
          {100 - countWords(formData.description || "")} words left
        </p>
      </div>

      {/* Price / Original / Discount */}
      <div className="grid grid-cols-3 gap-2">
        {/* Price */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700">Price</label>
          <div className="flex rounded border focus-within:ring-1 focus-within:ring-blue-300">
            <input
              type="number"
              name="price"
              value={safeValue(formData.price)}
              onChange={handlePriceDiscountChange}
              disabled={!canEdit}
              className={`w-full p-2 text-sm focus:outline-none ${disabledClass}`}
              placeholder="€"
            />
            <span className="bg-gray-100 px-2 py-2 text-[13px] text-gray-600 flex items-center">
              {currencySymbols[formData.currency] || formData.currency}
            </span>
          </div>
        </div>

        {/* Original Price */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700">Original</label>
          <div className="flex rounded border focus-within:ring-1 focus-within:ring-blue-300">
            <input
              name="original_price"
              value={safeValue(formData.original_price)}
              onChange={handleChange}
              disabled={!canEdit}
              className={`w-full p-2 text-sm focus:outline-none ${disabledClass}`}
              placeholder="optional"
            />
            <span className="bg-gray-100 px-2 py-2 text-[13px] text-gray-600 flex items-center">
              {currencySymbols[formData.currency] || formData.currency}
            </span>
          </div>
        </div>

        {/* Discount */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700">
            Discount (%)
          </label>
          <input
            type="number"
            name="discount"
            value={safeValue(formData.discount)}
            onChange={handlePriceDiscountChange}
            disabled={!canEdit}
            className={`p-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-300 ${disabledClass}`}
            placeholder="0..100"
          />
        </div>
      </div>

      {/* Condition / Sold Out / Currency */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {/* Condition */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700">Condition</label>
          <select
            name="age"
            value={safeValue(formData.age) || "new"}
            onChange={handleChange}
            disabled={!canEdit}
            className={`p-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-300 ${disabledClass}`}
          >
            {CONDITION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Currency */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700">Currency</label>
          <select
            name="currency"
            value={safeValue(formData.currency) || "EUR"}
            onChange={handleChange}
            disabled={!canEdit}
            className={`p-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-300 ${disabledClass}`}
          >
            <option value="EUR">Euro (€)</option>
            <option value="USD">USD ($)</option>
            <option value="INR">INR (₹)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>

        {/* Sold Out */}
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
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
            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="sold_out" className="text-sm text-gray-700">
            Sold Out
          </label>
        </div>
      </div>

      {/* Delivery Options (Shipping / Pickup) */}
      <div className="flex flex-col space-y-1">
        <span className="text-sm font-medium text-gray-700">
          Delivery Options
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Shipping Toggle */}
          <label
            className={`
    flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-medium transition-all duration-200
    hover:shadow-md hover:scale-[1.02] active:scale-95
    ${
      formData.delivery_options?.includes("Shipping")
        ? "bg-blue-600 text-white border-blue-700"
        : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
    }
    ${!canEdit ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
  `}
          >
            <input
              type="checkbox"
              name="delivery_options"
              value="Shipping"
              disabled={!canEdit}
              checked={formData.delivery_options?.includes("Shipping")}
              onChange={(e) =>
                handleDeliveryOptionChange(e, formData, setFormData)
              }
              className="sr-only"
            />
            <FaTruck className="text-base md:text-lg" />
            <span>Shipping</span>
          </label>

          {/* Pickup Toggle */}
          <label
            className={`
    flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-medium transition-all duration-200
    hover:shadow-md hover:scale-[1.02] active:scale-95
    ${
      formData.delivery_options?.includes("Pick Up")
        ? "bg-green-600 text-white border-green-700"
        : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
    }
    ${!canEdit ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
  `}
          >
            <input
              type="checkbox"
              name="delivery_options"
              value="Pick Up"
              disabled={!canEdit}
              checked={formData.delivery_options?.includes("Pick Up")}
              onChange={(e) =>
                handleDeliveryOptionChange(e, formData, setFormData)
              }
              className="sr-only"
            />
            <FaMapMarkerAlt
              className={`
      text-base md:text-lg
      ${
        formData.delivery_options?.includes("Pick Up")
          ? "text-white"
          : "text-gray-500"
      }
    `}
            />
            <span>Pickup</span>
          </label>
        </div>
      </div>

      {/* Source, URL, Available From */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {/* Source */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700">Source</label>
          <input
            name="source"
            value={safeValue(formData.source)}
            onChange={handleChange}
            disabled={!canEdit}
            className={`p-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-300 ${disabledClass}`}
            placeholder="Amazon / eBay / etc."
          />
        </div>

        {/* URL */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700">
            Product URL
          </label>
          <input
            name="url"
            value={safeValue(formData.url)}
            onChange={handleChange}
            disabled={!canEdit}
            className={`p-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-300 ${disabledClass}`}
            placeholder="https://..."
          />
        </div>

        {/* Available From */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700">
            Available From
          </label>
          <input
            name="available_from"
            value={safeValue(formData.available_from)}
            onChange={handleChange}
            disabled={!canEdit}
            className={`p-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-300 ${disabledClass}`}
            placeholder="YYYY-MM-DD"
          />
        </div>
      </div>

      {/* Admin Notes */}
      {isSuperAdmin && (
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700">
            Admin Note
          </label>
          <textarea
            name="admin_note"
            value={safeValue(formData.admin_note)}
            onChange={handleChange}
            rows={2}
            className="p-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-300"
            placeholder="Notes for super admin"
          />
        </div>
      )}
    </div>
  );
};

export default ProductFormFields;
