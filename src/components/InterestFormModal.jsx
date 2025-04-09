import React, { useState } from "react";
import { showToast } from "../utils/showToast";

const InterestFormModal = ({ product, onClose, onSubmit }) => {
  const [deliveryPrefs, setDeliveryPrefs] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const { name, email, phone } = Object.fromEntries(new FormData(form));

    if (deliveryPrefs.length === 0) {
      showToast("Please select at least one delivery preference.");
      return;
    }

    onSubmit({ name, email, phone, delivery_preferences: deliveryPrefs });
  };

  const handleDeliveryChange = (option) => {
    setDeliveryPrefs((prev) =>
      prev.includes(option)
        ? prev.filter((o) => o !== option)
        : [...prev, option]
    );
  };

  const deliveryOptions = Array.isArray(product.delivery_options)
    ? product.delivery_options
    : [];

  const labels = {
    pickup: "Pickup / Abholung",
    shipping: "Shipping / Versand",
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-xl font-bold mb-4">
          Interested in {product.title}?
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <input
            required
            name="name"
            placeholder="Your Name"
            minLength={2}
            maxLength={18}
            pattern="^[A-Za-zÀ-ÿ ,.'-]{2,50}$"
            title="Enter a valid name (letters, spaces, hyphens allowed)"
            className="w-full p-2 border rounded"
          />
          <input
            required
            name="email"
            type="email"
            placeholder="Email"
            maxLength={30}
            pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
            title="Enter a valid email address"
            className="w-full p-2 border rounded"
          />
          <input
            required
            name="phone"
            placeholder="Phone Number (e.g. +491234567890)"
            pattern="^\+?[1-9]\d{6,14}$"
            title="Enter a valid international phone number (7 to 15 digits, may start with +)"
            className="w-full p-2 border rounded"
          />

          {/* Delivery Preference */}
          {deliveryOptions.map((option) => {
            const isShipping = option.toLowerCase() === "shipping";
            return (
              <label key={option} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="delivery_preference"
                  value={option}
                  checked={deliveryPrefs.includes(option)}
                  onChange={() => handleDeliveryChange(option)}
                  className="accent-blue-600"
                />
                <span className="flex items-center gap-2">
                  {labels[option.toLowerCase()] || option}
                  {isShipping && (
                    <span
                      className="ml-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full"
                      title="Shipping is a paid service"
                    >
                      Paid
                    </span>
                  )}
                </span>
              </label>
            );
          })}

          <button
            type="submit"
            className="bg-red-600 text-white w-full py-2 rounded hover:bg-red-700 mt-2"
          >
            Submit Interest
          </button>
        </form>
      </div>
    </div>
  );
};

export default InterestFormModal;
