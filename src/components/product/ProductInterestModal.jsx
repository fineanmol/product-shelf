// src/components/InterestFormModal.jsx

import React, { useState, useRef, useEffect } from "react";
import { showToast } from "../../utils/showToast";
import {
  FaTruck,
  FaStore,
  FaShareAlt,
  FaCheckCircle,
  FaShippingFast,
} from "react-icons/fa";
import { analytics } from "../../firebase";
import { logEvent } from "firebase/analytics";
import emailjs from "emailjs-com";

const ProductInterestModal = ({ product, onClose, onSubmit }) => {
  const [step, setStep] = useState(1);
  const [deliveryPref, setDeliveryPref] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState(100);
  const nameRef = useRef();
  const emailRef = useRef();
  const deliveryRef = useRef();
  const timerRef = useRef();

  // Analytics test event on modal open
  useEffect(() => {
    if (analytics)
      logEvent(analytics, "test_event_modal", { product_id: product.id });
  }, [product.id]);

  // Autofocus first input on each step
  useEffect(() => {
    if (step === 1 && deliveryRef.current) deliveryRef.current.focus();
    if (step === 2 && nameRef.current) nameRef.current.focus();
  }, [step]);

  // Close modal on Esc
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // Progress bar for auto-close after success
  useEffect(() => {
    if (success && step === 3) {
      setProgress(100);
      let pct = 100;
      timerRef.current = setInterval(() => {
        pct -= 2;
        setProgress(pct);
        if (pct <= 0) {
          clearInterval(timerRef.current);
          onClose();
        }
      }, 100);
      return () => clearInterval(timerRef.current);
    }
  }, [success, step, onClose]);

  // Validation helpers
  const validateName = (name) => name.trim().length > 0;
  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const validatePhone = (phone) => /^\d{7,15}$/.test(phone.trim());

  // Real-time validation - only show errors for fields that are touched and have content or have been blurred
  useEffect(() => {
    const newErrors = {};
    if (step === 2) {
      if (touched.name && !validateName(formData.name))
        newErrors.name = "Name is required.";
      // Only show email error if field has content or has been touched (blurred)
      if (
        touched.email &&
        formData.email.trim() &&
        !validateEmail(formData.email)
      )
        newErrors.email = "Enter a valid email.";
      else if (touched.email && !formData.email.trim())
        newErrors.email = "Email is required.";
      if (touched.phone && !validatePhone(formData.phone))
        newErrors.phone = "Enter a valid phone number (7-15 digits).";
    }
    setErrors(newErrors);
  }, [formData, step, touched]);

  // Sanitize input
  const sanitize = (str) => str.replace(/[<>]/g, "");

  const handleNext = () => {
    if (step === 1 && !deliveryPref) {
      setErrors({ delivery: "Please select a delivery method." });
      if (analytics)
        logEvent(analytics, "interest_validation_failed", {
          reason: "no_delivery",
          product_id: product.id,
        });
      return;
    }
    if (step === 2 && Object.keys(errors).length > 0) {
      if (analytics)
        logEvent(analytics, "interest_validation_failed", {
          reason: "invalid_fields",
          product_id: product.id,
        });
      return;
    }
    setStep((prev) => prev + 1);
    setErrors({});
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleFinalSubmit = async () => {
    // Final validation
    const sanitized = {
      name: sanitize(formData.name),
      email: sanitize(formData.email),
      phone: sanitize(formData.phone),
      message: sanitize(formData.message),
    };
    setTouched((prev) => ({ ...prev, name: true, email: true, phone: true }));
    if (
      !validateName(sanitized.name) ||
      !validateEmail(sanitized.email) ||
      !validatePhone(sanitized.phone)
    ) {
      setErrors({ submit: "Please fill all fields correctly." });
      if (analytics)
        logEvent(analytics, "interest_validation_failed", {
          reason: "invalid_submit",
          product_id: product.id,
        });
      return;
    }
    setLoading(true);
    try {
      // Send email to user and admin
      await emailjs.send(
        "service_kff4yqy",
        "template_dt1bpdu",
        {
          name: sanitized.name,
          email: sanitized.email,
          message: sanitized.phone,
          title: product.title,
          available_from: product.available_from,
          image: product.image,
          time: new Date().toLocaleString(),
        },
        "hjrAAqHXUVuBPn-AD"
      );
      // Simulate network request
      await new Promise((res) => setTimeout(res, 1000));
      // Set success and step BEFORE calling onSubmit to ensure confirmation is shown
      setSuccess(true);
      setStep(3);
      // Parent onSubmit should NOT close the modal immediately!
      // Add a small delay to ensure the confirmation step is rendered
      setTimeout(() => {
        onSubmit({
          ...sanitized,
          delivery_preferences: [deliveryPref],
          productId: product.id,
          timestamp: Date.now(),
        });
      }, 5000);
      if (analytics)
        logEvent(analytics, "interest_submit_success", {
          product_id: product.id,
        });
      // Admin notification stub
      console.log(
        "[ADMIN NOTIFY] New interest submitted for product:",
        product.id
      );
    } catch (e) {
      showToast("❌ Could not submit. Please try again.");
      if (analytics)
        logEvent(analytics, "interest_submit_failed", {
          product_id: product.id,
        });
    } finally {
      setLoading(false);
    }
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
    <div className="relative mb-6 mt-6">
      <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-200" />
      <div
        className="absolute top-4 left-0 h-0.5 bg-blue-600 transition-all duration-300"
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
      className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl font-bold focus:outline-none"
      onClick={onClose}
    >
      &times;
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl p-6 relative">
        <div className="absolute top-2 right-2 z-20">{closeIcon}</div>
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
                    if (navigator.share) {
                      navigator
                        .share({
                          title: product.title,
                          text: `Check out this product: ${product.title}`,
                          url,
                        })
                        .then(() => showToast("✅ Shared successfully!"))
                        .catch(() =>
                          showToast("❌ Could not share. Please try again.")
                        );
                    } else {
                      navigator.clipboard.writeText(url);
                      showToast("Product link copied!");
                    }
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
                      : errors.delivery
                      ? "border-red-500 bg-red-50 hover:border-red-600"
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

          {errors.delivery && (
            <div className="mb-4">
              <p
                className="text-red-500 text-sm text-center"
                aria-live="polite"
              >
                {errors.delivery}
              </p>
            </div>
          )}

          <div className="mt-6 text-right">
            <button
              onClick={handleNext}
              className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={
                loading || (step === 2 && Object.keys(errors).length > 0)
              }
              aria-disabled={
                loading || (step === 2 && Object.keys(errors).length > 0)
              }
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
                onBlur={handleBlur}
                className={`w-full p-2 border rounded focus:outline-none text-left transition-colors ${
                  errors.name
                    ? "border-red-500 bg-red-50 focus:ring-1 focus:ring-red-300"
                    : "border-gray-300 focus:ring-1 focus:ring-blue-300"
                }`}
                placeholder="Enter your full name"
                required
                ref={nameRef}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
              />
              <div style={{ minHeight: 20 }}>
                {touched.name && errors.name && (
                  <p
                    id="name-error"
                    className="text-red-500 text-xs mt-1"
                    aria-live="polite"
                  >
                    {errors.name}
                  </p>
                )}
              </div>
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
                onBlur={handleBlur}
                className={`w-full p-2 border rounded focus:outline-none text-left transition-colors ${
                  errors.email
                    ? "border-red-500 bg-red-50 focus:ring-1 focus:ring-red-300"
                    : "border-gray-300 focus:ring-1 focus:ring-blue-300"
                }`}
                placeholder="you@email.com"
                required
                ref={emailRef}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              <div style={{ minHeight: 20 }}>
                {touched.email && errors.email && (
                  <p
                    id="email-error"
                    className="text-red-500 text-xs mt-1"
                    aria-live="polite"
                  >
                    {errors.email}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-left">
                Phone
              </label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full p-2 border rounded focus:outline-none text-left transition-colors ${
                  errors.phone
                    ? "border-red-500 bg-red-50 focus:ring-1 focus:ring-red-300"
                    : "border-gray-300 focus:ring-1 focus:ring-blue-300"
                }`}
                placeholder="Enter your phone number"
                required
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "phone-error" : undefined}
              />
              <div style={{ minHeight: 20 }}>
                {touched.phone && errors.phone && (
                  <p
                    id="phone-error"
                    className="text-red-500 text-xs mt-1"
                    aria-live="polite"
                  >
                    {errors.phone}
                  </p>
                )}
              </div>
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

          <div className="mt-6 flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleBack}
              className="bg-gray-200 text-gray-700 px-5 py-2 rounded hover:bg-gray-300 transition-colors focus:outline-none w-full sm:w-1/2"
              type="button"
              disabled={loading}
            >
              ← Back
            </button>
            <button
              onClick={handleFinalSubmit}
              className={`px-5 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors w-full sm:w-1/2 ${
                loading || Object.keys(errors).length > 0
                  ? "bg-gray-300 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
              disabled={loading || Object.keys(errors).length > 0}
              aria-disabled={loading || Object.keys(errors).length > 0}
              type="button"
            >
              {loading ? (
                <span
                  className="inline-block w-5 h-5 border-2 border-t-2 border-t-blue-500 border-gray-200 rounded-full animate-spin"
                  aria-label="Loading"
                ></span>
              ) : (
                "Submit"
              )}
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
          {success && (
            <div className="text-center py-8 animate-bounceIn">
              <FaCheckCircle className="text-green-500 text-5xl mx-auto mb-3 animate-pulse" />
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
              <div className="w-full h-2 bg-gray-200 rounded mt-6 mb-2 overflow-hidden">
                <div
                  className="h-2 bg-blue-500 transition-all duration-100 linear"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <button
                onClick={onClose}
                className="mt-2 bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition-colors focus:outline-none"
              >
                Close Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductInterestModal;
