import React, { useState } from "react";
import { showToast } from "../utils/showToast";
import { FaTruck, FaStore, FaShareAlt } from "react-icons/fa";

const InterestFormModal = ({ product, onClose, onSubmit }) => {
  const [step, setStep] = useState(1);
  const [deliveryPref, setDeliveryPref] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleNext = () => {
    if (step === 1 && !deliveryPref) {
      showToast("Please select a delivery method");
      return;
    }
    if (step === 2 && (!formData.name || !formData.email || !formData.phone)) {
      showToast("Please fill out all required fields");
      return;
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFinalSubmit = () => {
    onSubmit({ ...formData, delivery_preferences: [deliveryPref] });
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
    shipping: "2-3 business days",
    pickup: "Store location",
  };

  const renderSteps = (
    <div className="flex justify-center items-center mb-6 space-x-4">
      {[1, 2, 3].map((num) => (
        <div key={num} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full text-center text-white font-semibold text-sm flex items-center justify-center ${
              step === num ? "bg-blue-600" : "bg-gray-200 text-gray-600"
            }`}
          >
            {num}
          </div>
          {num < 3 && <div className="w-8 h-px bg-gray-300 mx-2" />}
        </div>
      ))}
    </div>
  );

  const closeIcon = (
    <button
      className="absolute top-4 right-5 text-gray-400 hover:text-gray-600 text-2xl"
      onClick={onClose}
    >
      &times;
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl p-6 relative">
        {closeIcon}
        {renderSteps}

        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Product Summary</h2>

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
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                      {product.status || "Available"}
                    </span>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                      New
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                    <FaShareAlt /> Share Product
                  </div>
                </div>
              </div>
              <p className="text-base font-semibold">€{product.price}</p>
            </div>

            <label className="text-sm font-medium block mb-2">
              Choose Delivery Method
            </label>
            <div className="grid grid-cols-2 gap-4">
              {deliveryOptions.map((option) => {
                const key = option.toLowerCase();
                return (
                  <label
                    key={option}
                    className={`border rounded-2xl p-4 cursor-pointer flex flex-col items-start gap-2 ${
                      deliveryPref === option
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200"
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
                      {icons[key] || null}
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
                className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Contact Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Full Name
                </label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Email Address
                </label>
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  placeholder="your@email.com"
                  required
                  type="email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Phone Number
                </label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter your phone number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Message (optional)
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  placeholder="Any specific questions or requests?"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={handleBack}
                className="bg-gray-200 text-gray-700 px-5 py-2 rounded hover:bg-gray-300"
              >
                ← Back
              </button>
              <button
                onClick={handleFinalSubmit}
                className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700"
              >
                Submit
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-10">
            <h2 className="text-2xl font-bold text-green-600 mb-4">
              🎉 Thank You!
            </h2>
            <p className="text-gray-700 mb-2">
              We've received your interest in:
            </p>
            <p className="font-medium text-lg">{product.title}</p>
            <p className="text-sm text-gray-500 mt-2">
              We'll reach out to you soon via email or phone.
            </p>

            <button
              onClick={onClose}
              className="mt-6 bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterestFormModal;
