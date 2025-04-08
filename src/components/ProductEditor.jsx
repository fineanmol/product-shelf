// src/components/ProductEditor.jsx
import React, { useState } from "react";
import { getDatabase, ref, update, remove } from "firebase/database";
import { showToast } from "../utils/showToast";

const ProductEditor = ({ product }) => {
  const [formData, setFormData] = useState({
    ...product,
    status: product.status || "available",
    visible: product.visible !== false,
    source: product.source || "Amazon",
    available_from: product.available_from || "Now",
  });
  const [showPreview, setShowPreview] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Don't capitalize technical fields
    const fieldsToSkipCapitalization = [
      "image",
      "url",
      "price",
      "original_price",
      "available_from",
    ];

    const updatedValue = fieldsToSkipCapitalization.includes(name)
      ? value
      : value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

    setFormData((prev) => ({
      ...prev,
      [name]: updatedValue,
    }));
  };

  const currencySymbols = {
    EUR: "€",
    USD: "$",
    INR: "₹",
    GBP: "£",
  };

  const handleSave = () => {
    const payload = {
      ...formData,
      price: parseFloat(formData.price), // ensure it's a number
      original_price: formData.original_price
        ? parseFloat(formData.original_price)
        : undefined,
      currency: formData.currency || "EUR",
    };

    update(ref(getDatabase(), `/${product.id}`), payload);
    showToast("Product saved ✅");
    setShowPreview(false);
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(`Delete product "${formData.title}"?`);
    if (confirmDelete) {
      await remove(ref(getDatabase(), `/${product.id}`));
      showToast("Product deleted 🗑️");
    }
  };

  const countWords = (text) => text.trim().split(/\s+/).length;

  return (
    <div className="border p-4 rounded shadow bg-white space-y-4 text-left">
      {/* <div className="text-sm text-gray-600">Product ID: {product.id}</div> */}

      {/* Image Preview */}
      <div className="flex flex-col sm:flex-row items-start sm:items-left gap-4">
        {/* Left: Label + Input */}
        <div className="flex-1 w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Image URL
          </label>
          <input
            name="image"
            value={formData.image || ""}
            onChange={handleChange}
            className="w-full p-2 border rounded text-sm"
          />
        </div>

        {/* Right: Image Thumbnail */}
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
          value={formData.title || ""}
          onChange={handleChange}
          className="w-full p-2 border rounded text-sm"
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
          value={formData.description || ""}
          onChange={handleChange}
          className="w-full p-2 border rounded text-sm"
          rows={4}
        ></textarea>
        <p className="text-xs text-gray-500">
          {100 - countWords(formData.description || "")} words remaining
        </p>
      </div>

      {/* Price + Original Price + Currency */}
      <div className="grid grid-cols-3 gap-3">
        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Price
          </label>
          <div className="flex rounded border overflow-hidden">
            <input
              type="number"
              name="price"
              value={formData.price || ""}
              onChange={handleChange}
              className="w-full p-2 text-sm"
              placeholder="e.g. 6"
            />
            <span className="bg-gray-100 px-3 py-2 text-sm text-gray-600">
              {currencySymbols[formData.currency] || formData.currency}
            </span>
          </div>
        </div>

        {/* Original Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Original Price
          </label>

          <div className="flex rounded border overflow-hidden">
            <input
              name="original_price"
              value={formData.original_price || ""}
              onChange={handleChange}
              className="w-full p-2 border rounded text-sm"
              placeholder="Optional"
            />
            <span className="bg-gray-100 px-3 py-2 text-sm text-gray-600">
              {currencySymbols[formData.currency] || formData.currency}
            </span>
          </div>
        </div>

        {/* Currency */}
        <div className="max-w-fit">
          <label className="block text-sm font-medium text-gray-700">
            Currency
          </label>
          <select
            name="currency"
            value={formData.currency || "EUR"}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, currency: e.target.value }))
            }
            className="w-full p-2 border rounded text-sm"
          >
            <option value="EUR">Euro</option>
            <option value="USD">USD</option>
            <option value="INR">INR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
      </div>

      {/* Source and Available From */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Source
          </label>
          <input
            name="source"
            value={formData.source || ""}
            onChange={handleChange}
            className="w-full p-2 border rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Available From
          </label>
          <input
            name="available_from"
            value={formData.available_from || ""}
            onChange={handleChange}
            className="w-full p-2 border rounded text-sm"
          />
        </div>
      </div>
      <div className="flex justify-around flex-wrap gap-4">
        {/* Status Toggle */}
        <label className="flex items-center gap-3">
          <span className="text-sm font-medium">Status</span>
          <div className="toggle-wrapper">
            <input
              type="checkbox"
              className="toggle-checkbox"
              checked={formData.status === "available"}
              onChange={() =>
                setFormData((prev) => ({
                  ...prev,
                  status:
                    prev.status === "available" ? "reserved" : "available",
                }))
              }
              id="status-toggle"
            />
            <span className="toggle-slider"></span>
          </div>
          <span
            className={`w-20 text-center px-2 py-1 text-xs font-semibold rounded-full ${
              formData.status === "available"
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {formData.status === "available" ? "Available" : "Reserved"}
          </span>
        </label>

        {/* Visible Toggle */}
        <label className="flex items-center gap-3">
          <span className="text-sm font-medium">Visible</span>
          <div className="toggle-wrapper">
            <input
              type="checkbox"
              className="toggle-checkbox"
              checked={formData.visible !== false}
              onChange={() =>
                setFormData((prev) => ({
                  ...prev,
                  visible: !prev.visible,
                }))
              }
              id="visible-toggle"
            />
            <span className="toggle-slider"></span>
          </div>
          <span
            className={`w-20 text-center px-2 py-1 text-xs font-semibold rounded-full ${
              formData.visible !== false
                ? "bg-green-600 text-white"
                : "bg-gray-400 text-white"
            }`}
          >
            {formData.visible !== false ? "Visible" : "Hidden"}
          </span>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleSave}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Publish Changes
        </button>
        <button
          onClick={() => setShowPreview(true)}
          className="w-full bg-indigo-500 text-white py-2 rounded hover:bg-indigo-600"
        >
          Preview Before Submit
        </button>
      </div>

      {/* Delete Button */}
      <button
        onClick={handleDelete}
        className="w-full bg-red-500 text-white py-1 rounded mt-2 text-sm hover:bg-red-600"
      >
        Delete Product
      </button>

      {/* Preview Section */}
      {showPreview && (
        <div className="border mt-6 rounded-lg shadow-md p-4 bg-gray-50">
          <h3 className="text-xl font-semibold mb-2">Preview</h3>
          <img
            src={formData.image}
            alt="Preview"
            className="w-32 h-32 object-contain mb-2"
          />
          <h4 className="text-lg font-bold">{formData.title}</h4>
          <p className="text-sm text-gray-700">{formData.description}</p>
          <div className="text-sm mt-2">
            <p>
              <strong>Price:</strong> {formData.price}{" "}
              {currencySymbols[formData.currency] || formData.currency}
            </p>

            {formData.original_price && (
              <p>
                <strong>Original Price:</strong> {formData.original_price}{" "}
                {currencySymbols[formData.currency] || formData.currency}
              </p>
            )}

            <p>
              <strong>Status:</strong> {formData.status}
            </p>
            <p>
              <strong>Visible:</strong> {formData.visible ? "Yes" : "No"}
            </p>
            <p>
              <strong>Source:</strong> {formData.source}
            </p>
          </div>
          <button
            onClick={() => setShowPreview(false)}
            className="mt-4 bg-gray-300 text-black px-4 py-1 rounded hover:bg-gray-400"
          >
            Close Preview
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductEditor;
