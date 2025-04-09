// src/components/forms/ProductPreview.jsx
import React from "react";

const currencySymbols = {
  EUR: "€",
  USD: "$",
  INR: "₹",
  GBP: "£",
};

const ProductPreview = ({ formData, onClose }) => {
  return (
    <div className="border mt-6 rounded-lg shadow-md p-4 bg-gray-50">
      <h3 className="text-xl font-semibold mb-2">Preview</h3>
      {formData.image && (
        <img
          src={formData.image}
          alt="Preview"
          className="w-32 h-32 object-contain mb-2"
        />
      )}
      <h4 className="text-lg font-bold">{formData.title}</h4>
      <p className="text-sm text-gray-700">{formData.description}</p>

      <div className="text-sm mt-2 space-y-1">
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
        {formData.delivery_options?.length > 0 && (
          <p>
            <strong>Delivery Options:</strong>{" "}
            {formData.delivery_options.join(", ")}
          </p>
        )}
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

      <button
        onClick={onClose}
        className="mt-4 bg-gray-300 text-black px-4 py-1 rounded hover:bg-gray-400"
      >
        Close Preview
      </button>
    </div>
  );
};

export default ProductPreview;
