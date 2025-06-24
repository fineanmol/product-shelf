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
  isSuperAdmin: isSuperAdminProp,
}) => {
  const [isSuperAdmin, setIsSuperAdmin] = useState(isSuperAdminProp ?? false);

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

  // Update local state when prop changes
  useEffect(() => {
    if (typeof isSuperAdminProp !== "undefined") {
      setIsSuperAdmin(isSuperAdminProp);
    } else if (formData) {
      // Only fetch from API if prop is not provided
      async function fetchUserAccess() {
        try {
          const access = await getUserAccess(formData);
          setIsSuperAdmin(access.isSuperAdmin);
        } catch (error) {
          console.error("Error fetching user access:", error);
        }
      }
      fetchUserAccess();
    }
  }, [isSuperAdminProp, formData]);

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
    <div className="space-y-8">
      {/* If read-only, show a small banner */}
      {!canEdit && (
        <div className="bg-yellow-100 text-yellow-700 p-3 rounded-lg border border-yellow-200">
          <span className="text-sm font-medium">⚠️ Read-only mode</span>
          <p className="text-xs mt-1">
            You do not have permission to edit this product
          </p>
        </div>
      )}

      {/* Main Form Grid - Two Column Layout on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Basic Information
            </h3>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Title *
              </label>
              <input
                name="title"
                value={safeValue(formData.title)}
                onChange={handleChange}
                disabled={!canEdit}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${disabledClass}`}
                placeholder="Enter product title..."
                maxLength="100"
              />
              <p className="text-xs text-gray-500 mt-1">
                {100 - countWords(formData.title || "")} characters remaining
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={safeValue(formData.description)}
                onChange={handleChange}
                disabled={!canEdit}
                rows={4}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${disabledClass}`}
                placeholder="Describe your product in detail..."
              />
              <p className="text-xs text-gray-500 mt-1">
                {100 - countWords(formData.description || "")} words remaining
              </p>
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image URL
              </label>
              <input
                name="image"
                value={safeValue(formData.image)}
                onChange={handleChange}
                disabled={!canEdit}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${disabledClass}`}
                placeholder="https://example.com/image.jpg"
              />
              {formData.image && (
                <div className="mt-3">
                  <img
                    src={formData.image}
                    alt="Product preview"
                    className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Delivery Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Delivery Options
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Shipping Option */}
              <label
                className={`
                  flex items-center gap-3 p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer
                  ${
                    formData.delivery_options?.includes("Shipping")
                      ? "border-blue-500 bg-blue-50 text-blue-900"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }
                  ${!canEdit ? "opacity-60 cursor-not-allowed" : ""}
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
                <FaTruck
                  className={`text-xl ${
                    formData.delivery_options?.includes("Shipping")
                      ? "text-blue-600"
                      : "text-gray-400"
                  }`}
                />
                <div>
                  <div className="font-medium">Shipping</div>
                  <div className="text-xs text-gray-500">Ship to customer</div>
                </div>
              </label>

              {/* Pickup Option */}
              <label
                className={`
                  flex items-center gap-3 p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer
                  ${
                    formData.delivery_options?.includes("Pick Up")
                      ? "border-green-500 bg-green-50 text-green-900"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }
                  ${!canEdit ? "opacity-60 cursor-not-allowed" : ""}
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
                  className={`text-xl ${
                    formData.delivery_options?.includes("Pick Up")
                      ? "text-green-600"
                      : "text-gray-400"
                  }`}
                />
                <div>
                  <div className="font-medium">Pickup</div>
                  <div className="text-xs text-gray-500">Customer pickup</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Pricing Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Pricing & Details
            </h3>

            {/* Pricing Grid - Consistent 2x2 Layout */}
            <div className="grid grid-cols-2 gap-4">
              {/* Current Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Price *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="price"
                    value={safeValue(formData.price)}
                    onChange={handlePriceDiscountChange}
                    disabled={!canEdit}
                    step="0.01"
                    min="0"
                    className={`w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${disabledClass}`}
                    placeholder="0.00"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                    {currencySymbols[formData.currency] || formData.currency}
                  </span>
                </div>
              </div>

              {/* Original Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Original Price
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="original_price"
                    value={safeValue(formData.original_price)}
                    onChange={handleChange}
                    disabled={!canEdit}
                    step="0.01"
                    min="0"
                    className={`w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${disabledClass}`}
                    placeholder="Optional"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                    {currencySymbols[formData.currency] || formData.currency}
                  </span>
                </div>
              </div>

              {/* Discount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount %
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="discount"
                    value={safeValue(formData.discount)}
                    onChange={handlePriceDiscountChange}
                    disabled={!canEdit}
                    min="0"
                    max="100"
                    className={`w-full pl-4 pr-8 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${disabledClass}`}
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                    %
                  </span>
                </div>
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  name="currency"
                  value={safeValue(formData.currency) || "EUR"}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${disabledClass}`}
                >
                  <option value="EUR">Euro (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            {/* Product Details */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              {/* Condition */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition
                </label>
                <select
                  name="age"
                  value={safeValue(formData.age) || "new"}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${disabledClass}`}
                >
                  {CONDITION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sold Out Checkbox */}
              <div className="flex items-center pt-8">
                <label className="flex items-center gap-3 cursor-pointer">
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
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Mark as Sold Out
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Additional Information
            </h3>

            <div className="grid grid-cols-1 gap-4">
              {/* Source */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source
                </label>
                <input
                  name="source"
                  value={safeValue(formData.source)}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${disabledClass}`}
                  placeholder="Amazon, eBay, etc."
                />
              </div>

              {/* Available From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available From
                </label>
                <input
                  name="available_from"
                  value={safeValue(formData.available_from)}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${disabledClass}`}
                  placeholder="Now, 2024-01-01, etc."
                />
              </div>

              {/* Product URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product URL
                </label>
                <input
                  name="url"
                  type="url"
                  value={safeValue(formData.url)}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${disabledClass}`}
                  placeholder="https://example.com/product"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Notes - Full Width Section */}
      {isSuperAdmin && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
            Admin Notes
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Internal Notes
            </label>
            <textarea
              name="admin_note"
              value={safeValue(formData.admin_note)}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Internal notes for administrators..."
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductFormFields;
