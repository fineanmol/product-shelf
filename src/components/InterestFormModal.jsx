import React, { useState } from "react";
import { showToast } from "../utils/showToast";

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

  const closeIcon = (
    <button
      className="absolute top-2 right-3 text-gray-400 hover:text-gray-600 text-2xl"
      onClick={onClose}
    >
      &times;
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl p-6 relative">
        {closeIcon}

        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">{product.title}</h2>
            <p className="text-2xl font-bold text-black">€{product.price}</p>
            <p className="text-sm text-gray-400 mt-2">{product.description}</p>

            <div className="mt-6">
              <label className="text-sm font-medium block mb-2">
                Choose Delivery Method
              </label>
              <div className="grid grid-cols-2 gap-4">
                {deliveryOptions.map((option) => (
                  <label
                    key={option}
                    className={`border rounded-lg p-3 cursor-pointer ${
                      deliveryPref === option
                        ? "border-blue-500 bg-blue-50"
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
                    <div className="font-semibold">{option}</div>
                    <div className="text-xs text-gray-500">
                      {option.toLowerCase() === "shipping"
                        ? "2-3 business days"
                        : "Store pickup"}
                    </div>
                  </label>
                ))}
              </div>
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
            <div className="flex items-center gap-4 mb-4">
              <img
                src={product.image}
                alt={product.title}
                className="w-16 h-16 rounded object-cover"
              />
              <div>
                <h3 className="font-medium text-base">{product.title}</h3>
                <p className="text-sm text-gray-400">€{product.price}</p>
              </div>
            </div>

            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded mb-4"
              placeholder="Enter your full name"
              required
            />

            <label className="block text-sm font-medium mb-1">
              Email Address
            </label>
            <input
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border rounded mb-4"
              placeholder="your@email.com"
              required
              type="email"
            />

            <label className="block text-sm font-medium mb-1">
              Phone Number
            </label>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full p-2 border rounded mb-4"
              placeholder="Enter your phone number"
              required
            />

            <label className="block text-sm font-medium mb-1">
              Message (optional)
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              className="w-full p-2 border rounded mb-4"
              placeholder="Any specific questions or requests?"
            />

            <div className="text-right">
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
