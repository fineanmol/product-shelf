// src/components/InterestFormModal.jsx

import React, { useState } from "react";
import { showToast } from "../utils/showToast";
import {
  FaTruck,
  FaStore,
  FaShareAlt,
  FaCheckCircle,
  FaShippingFast,
} from "react-icons/fa";

const InterestFormModal = ({ product, onClose, onSubmit }) => {
  const [step, setStep] = useState(1);
  const [deliveryPref, setDeliveryPref] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  // For demonstration: share the product link (or fallback to copy)
  const handleShare = () => {
    const productLink = product.url || window.location.href;
    if (navigator.share) {
      navigator
        .share({
          title: product.title,
          text: `Check out this product: ${product.title}`,
          url: productLink,
        })
        .then(() => showToast("✅ Shared successfully!"))
        .catch(() => showToast("❌ Could not share. Please try again."));
    } else {
      // Fallback: copy to clipboard
      const url = `${window.location.origin}/product/${product.id}`;
      navigator.clipboard.writeText(url);
      showToast("Product link copied!");
    }
  };

  const handleNext = () => {
    // Step 1 validation
    if (step === 1 && !deliveryPref) {
      showToast("Please select a delivery method.");
      return;
    }
    // Step 2 validation
    if (
      step === 2 &&
      (!formData.name.trim() ||
        !formData.email.trim() ||
        !formData.phone.trim())
    ) {
      showToast("Please fill out all required fields.");
      return;
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFinalSubmit = () => {
    const interestObj = {
      ...formData,
      delivery_preferences: [deliveryPref],
      productId: product.id, // so you know which product this interest is for
      timestamp: Date.now(),
    };
    onSubmit(interestObj);

    setStep(3);
  };

  const deliveryOptions = Array.isArray(product.delivery_options)
    ? product.delivery_options
    : [];

  const icons = {
    shipping: <FaTruck className="text-gray-600 text-xl" />,
    pickup: <FaStore className="text-gray-600 text-xl" />,
  };
  const descriptions = {
    shipping: "Arrives in 2-3 business days",
    pickup: "Pickup from Berlin, 10317",
  };

  const renderSteps = (
    <div className="relative mb-6">
      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200" />
      <div
        className="absolute top-1/2 left-0 h-0.5 bg-blue-600 transition-all duration-300"
        style={{ width: `${((step - 1) / 2) * 100}%` }}
      />
      <div className="flex justify-between relative z-10">
        {[1, 2, 3].map((num) => {
          const isActive = step >= num;
          return (
            <div key={num} className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full text-center text-white font-semibold text-sm flex items-center justify-center mb-2 ${
                  isActive ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                {num}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Close (X) icon
  const closeIcon = (
    <button
      aria-label="Close"
      className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl font-bold focus:outline-none"
      onClick={onClose}
    >
      &times;
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl p-6 relative">
        {closeIcon}

        {renderSteps}

        <div
          className={`transition-opacity duration-300 ${
            step === 1
              ? "opacity-100"
              : "opacity-0 absolute pointer-events-none"
          }`}
          style={{ minHeight: step === 1 ? "auto" : 0 }}
        >
          <h2 className="text-xl font-bold mb-4">Choose Delivery Method</h2>

          <div className="flex items-center justify-between border rounded-xl p-4 mb-6">
            <div className="flex items-center gap-4">
              <img
                src={product.image}
                alt={product.title}
                className="w-14 h-14 rounded object-cover"
              />
              <div>
                <h3 className="font-semibold text-sm leading-tight">
                  {product.title}
                </h3>
                <div className="flex gap-2 mt-1">
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full capitalize">
                    {product.status || "Available"}
                  </span>
                  {/* Example: Condition or "New" */}
                  {product.age && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                      {product.age}
                    </span>
                  )}
                </div>
                <div
                  className="flex items-center gap-1 text-gray-500 text-xs mt-1 cursor-pointer hover:text-gray-600"
                  onClick={() => {
                    const url = `${window.location.origin}/product/${product.id}`;
                    navigator.clipboard.writeText(url);
                    showToast("Product link copied!");
                  }}
                >
                  <FaShareAlt />
                  <span>Share Product</span>
                </div>
              </div>
            </div>
            <p className="text-base font-semibold">
              €{product.price?.toLocaleString() || "N/A"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {deliveryOptions.map((option) => {
              const key = option.toLowerCase();
              return (
                <label
                  key={option}
                  className={`border rounded-2xl p-4 cursor-pointer flex flex-col items-start gap-2 transition-colors ${
                    deliveryPref === option
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="delivery"
                    value={option}
                    className="sr-only"
                    checked={deliveryPref === option}
                    onChange={() => setDeliveryPref(option)}
                  />
                  <div className="flex items-center gap-2">
                    {icons[key] || <FaShippingFast className="text-xl" />}
                    <span className="text-sm font-semibold capitalize">
                      {option}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {descriptions[key] || ""}
                  </span>
                </label>
              );
            })}
          </div>

          <div className="mt-6 text-right">
            <button
              onClick={handleNext}
              className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              Continue →
            </button>
          </div>
        </div>

        <div
          className={`transition-opacity duration-300 ${
            step === 2
              ? "opacity-100"
              : "opacity-0 absolute pointer-events-none"
          }`}
          style={{ minHeight: step === 2 ? "auto" : 0 }}
        >
          <h2 className="text-xl font-bold mb-4">Contact Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-left">
                Full Name
              </label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-300 text-left"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-left">
                Email
              </label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-300 text-left"
                placeholder="you@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-left">
                Phone
              </label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-300 text-left"
                placeholder="Enter your phone number"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-left">
                Message (optional)
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-300 text-left"
                placeholder="Any specific questions or requests?"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={handleBack}
              className="bg-gray-200 text-gray-700 px-5 py-2 rounded hover:bg-gray-300 transition-colors focus:outline-none"
            >
              ← Back
            </button>
            <button
              onClick={handleFinalSubmit}
              className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              Submit
            </button>
          </div>
        </div>

        <div
          className={`transition-opacity duration-300 ${
            step === 3
              ? "opacity-100"
              : "opacity-0 absolute pointer-events-none"
          }`}
          style={{ minHeight: step === 3 ? "auto" : 0 }}
        >
          <div className="text-center py-8">
            <FaCheckCircle className="text-green-500 text-5xl mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-green-600 mb-4">
              Thank You!
            </h2>
            <p className="text-gray-700 mb-2">
              We have received your interest in:
            </p>
            <p className="font-medium text-lg">{product.title}</p>
            <p className="text-sm text-gray-500 mt-2">
              We'll reach out to you soon via email or phone.
            </p>

            <button
              onClick={onClose}
              className="mt-6 bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition-colors focus:outline-none"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterestFormModal;
