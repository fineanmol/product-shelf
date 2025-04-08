// src/components/ProductForm.jsx
import React, { useState } from "react";
import { getDatabase, push, ref } from "firebase/database";
import { showToast } from "../utils/showToast";
import { getAuth } from "firebase/auth";

const currencySymbols = {
  EUR: "€",
  USD: "$",
  INR: "₹",
  GBP: "£",
};

const initial = {
  title: "",
  description: "",
  image: "",
  price: "",
  original_price: "",
  discount: 20,
  status: "available",
  visible: true,
  source: "Amazon",
  available_from: "Now",
  currency: "EUR",
  url: "",
  delivery_options: ["pickup", "shipping"],
};

// Given original price and discount, return discounted price
const calculateDiscountedPrice = (original, discount) => {
  return ((original * (100 - discount)) / 100).toFixed(2);
};

// Given original and discounted price, return discount %
const calculateDiscountPercent = (original, discounted) => {
  return Math.round(((original - discounted) / original) * 100);
};

const ProductForm = () => {
  const [formData, setFormData] = useState(initial);
  const [showPreview, setShowPreview] = useState(false);
  const db = getDatabase();

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

  const countWords = (text) => text.trim().split(/\s+/).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const auth = getAuth();
    const user = auth.currentUser;

    const payload = {
      ...formData,
      price: parseFloat(formData.price),
      original_price: formData.original_price
        ? parseFloat(formData.original_price)
        : undefined,
      currency: formData.currency || "EUR",
      added_by: user?.uid || "unknown",
      timestamp: Date.now(),
    };

    await push(ref(db, "/"), payload);
    showToast("Product added ✅");
    setFormData(initial);
    setShowPreview(false);
  };

  const handleOriginalPriceChange = (e) => {
    const original_price = parseFloat(e.target.value) || "";
    const discount = formData.discount || 20;
    const price =
      original_price && discount
        ? calculateDiscountedPrice(original_price, discount)
        : "";

    setFormData((prev) => ({
      ...prev,
      original_price,
      price,
    }));
  };

  const handleDiscountChange = (e) => {
    const discount = parseFloat(e.target.value) || 0;
    const original_price = parseFloat(formData.original_price) || 0;
    const price =
      original_price && discount
        ? calculateDiscountedPrice(original_price, discount)
        : "";

    setFormData((prev) => ({
      ...prev,
      discount,
      price,
    }));
  };

  const handlePriceChange = (e) => {
    const price = parseFloat(e.target.value) || "";
    const original_price = parseFloat(formData.original_price) || 0;
    const discount =
      original_price && price
        ? calculateDiscountPercent(original_price, price)
        : "";

    setFormData((prev) => ({
      ...prev,
      price,
      discount,
    }));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border p-4 rounded shadow bg-white space-y-4 text-left"
    >
      {/* Image URL + Thumbnail */}
      <div className="flex flex-col sm:flex-row items-start sm:items-left gap-4">
        <div className="flex-1 w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Image URL
          </label>
          <input
            name="image"
            id="image"
            value={formData.image}
            onChange={handleChange}
            className="w-full p-2 border rounded text-sm"
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
          value={formData.title}
          onChange={handleChange}
          className="w-full p-2 border rounded text-sm"
        />
        <p className="text-xs text-gray-500">
          {100 - countWords(formData.title)} words remaining
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="w-full p-2 border rounded text-sm"
          rows={4}
        />
        <p className="text-xs text-gray-500">
          {100 - countWords(formData.description)} words remaining
        </p>
      </div>
      {/* Original Price → Discount → Price (Sell Price) */}
      <div className="grid grid-cols-3 gap-3">
        {/* Original Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Original Price
          </label>
          <div className="flex rounded border overflow-hidden">
            <input
              name="original_price"
              value={formData.original_price}
              onChange={handleOriginalPriceChange}
              type="number"
              step="0.01"
              className="w-full p-2 text-sm"
              placeholder="Original"
            />
            <span className="bg-gray-100 px-3 py-2 text-sm text-gray-600">
              {currencySymbols[formData.currency]}
            </span>
          </div>
        </div>

        {/* Sell Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Sell Price
          </label>
          <div className="flex rounded border overflow-hidden">
            <input
              name="price"
              value={formData.price}
              onChange={handlePriceChange}
              type="number"
              step="0.01"
              className="w-full p-2 text-sm"
              placeholder="Final Price"
            />
            <span className="bg-gray-100 px-3 py-2 text-sm text-gray-600">
              {currencySymbols[formData.currency]}
            </span>
          </div>
        </div>

        {/* Discount */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Discount %
          </label>
          <input
            name="discount"
            value={formData.discount}
            onChange={handleDiscountChange}
            type="number"
            step="1"
            className="w-full p-2 border rounded text-sm"
            placeholder="e.g. 20"
          />
        </div>
      </div>

      {/* Source & Available From */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Source
          </label>
          <input
            name="source"
            value={formData.source}
            onChange={handleChange}
            className="w-full p-2 border rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Product URL
          </label>
          <input
            name="url"
            value={formData.url}
            onChange={handleChange}
            className="w-full p-2 border rounded text-sm"
            placeholder="https://example.com/product"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Available From
          </label>
          <input
            name="available_from"
            value={formData.available_from}
            onChange={handleChange}
            className="w-full p-2 border rounded text-sm"
          />
        </div>
      </div>

      {/* Toggles */}
      <div className="flex justify-around flex-wrap gap-4">
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
            />
            <span className="toggle-slider"></span>
          </div>
          <span
            className={`w-20 text-center px-2 py-1 text-xs font-semibold rounded-full ${
              formData.status === "available" ? "bg-green-600" : "bg-red-600"
            } text-white`}
          >
            {formData.status === "available" ? "Available" : "Reserved"}
          </span>
        </label>

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
            />
            <span className="toggle-slider"></span>
          </div>
          <span
            className={`w-20 text-center px-2 py-1 text-xs font-semibold rounded-full ${
              formData.visible !== false ? "bg-green-600" : "bg-gray-400"
            } text-white`}
          >
            {formData.visible !== false ? "Visible" : "Hidden"}
          </span>
        </label>
      </div>
      {/* Delivery Options */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Delivery Options
        </label>
        <div className="flex flex-wrap gap-3">
          {["pickup", "shipping"].map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={formData.delivery_options.includes(option)}
                onChange={(e) => {
                  const updated = e.target.checked
                    ? [...formData.delivery_options, option]
                    : formData.delivery_options.filter((o) => o !== option);
                  setFormData((prev) => ({
                    ...prev,
                    delivery_options: updated,
                  }));
                }}
              />
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Add Product
        </button>
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className="w-full bg-indigo-500 text-white py-2 rounded hover:bg-indigo-600"
        >
          Preview Before Submit
        </button>
      </div>

      {/* Preview */}
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
              {currencySymbols[formData.currency]}
            </p>
            {formData.original_price && (
              <p>
                <strong>Original Price:</strong> {formData.original_price}{" "}
                {currencySymbols[formData.currency]}
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
            {formData.url && (
              <p>
                <strong>URL:</strong>{" "}
                <a
                  href={formData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  {formData.url}
                </a>
              </p>
            )}
          </div>
          {formData.delivery_options?.length > 0 && (
            <p className="mt-2">
              <strong>Delivery:</strong>{" "}
              {formData.delivery_options
                .map((d) => d.charAt(0).toUpperCase() + d.slice(1))
                .join(", ")}
            </p>
          )}

          <button
            onClick={() => setShowPreview(false)}
            className="mt-4 bg-gray-300 text-black px-4 py-1 rounded hover:bg-gray-400"
          >
            Close Preview
          </button>
        </div>
      )}
    </form>
  );
};

export default ProductForm;
