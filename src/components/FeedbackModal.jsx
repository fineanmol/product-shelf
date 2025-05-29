import React, { useState, useRef, useEffect } from "react";
import { ref, push } from "firebase/database";
import { db, analytics } from "../firebase";
import { showToast } from "../utils/showToast";
import { logEvent } from "firebase/analytics";
import {
  FaBug,
  FaLightbulb,
  FaTimes,
  FaCheckCircle,
  FaPaperPlane,
} from "react-icons/fa";

const FeedbackModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    type: "feature", // feature or bug
    title: "",
    description: "",
    email: "",
    priority: "medium",
    category: "general",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState(100);
  const titleRef = useRef();
  const timerRef = useRef();

  // Auto-focus title on modal open
  useEffect(() => {
    if (isOpen && titleRef.current) {
      titleRef.current.focus();
    }
  }, [isOpen]);

  // Close modal on Esc
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
      return () => window.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, onClose]);

  // Progress bar for auto-close after success
  useEffect(() => {
    if (success) {
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
  }, [success, onClose]);

  // Validation
  const validateTitle = (title) => title.trim().length >= 3;
  const validateDescription = (desc) => desc.trim().length >= 10;
  const validateEmail = (email) => !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  // Real-time validation
  useEffect(() => {
    const newErrors = {};
    if (touched.title && !validateTitle(formData.title)) {
      newErrors.title = "Title must be at least 3 characters";
    }
    if (touched.description && !validateDescription(formData.description)) {
      newErrors.description = "Description must be at least 10 characters";
    }
    if (touched.email && !validateEmail(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }
    setErrors(newErrors);
  }, [formData, touched]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched for validation
    setTouched({ title: true, description: true, email: true });
    
    // Final validation
    if (!validateTitle(formData.title) || !validateDescription(formData.description) || !validateEmail(formData.email)) {
      if (analytics) logEvent(analytics, "feedback_validation_failed");
      return;
    }

    setLoading(true);
    
    try {
      const feedbackData = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        email: formData.email.trim(),
        status: "todo",
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      await push(ref(db, "feedback"), feedbackData);
      
      setSuccess(true);
      if (analytics) logEvent(analytics, "feedback_submitted", { type: formData.type });
      
      // Reset form
      setFormData({
        type: "feature",
        title: "",
        description: "",
        email: "",
        priority: "medium",
        category: "general",
      });
      setTouched({});
      setErrors({});
      
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      showToast("❌ Failed to submit feedback. Please try again.");
      if (analytics) logEvent(analytics, "feedback_submit_failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
          aria-label="Close"
        >
          <FaTimes />
        </button>

        {!success ? (
          <>
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Share Your Feedback</h2>
              <p className="text-gray-600">Help us improve by sharing your ideas or reporting issues</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Feedback Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Feedback Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    formData.type === 'feature' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="type"
                      value="feature"
                      checked={formData.type === 'feature'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <FaLightbulb className="text-yellow-500 text-xl" />
                      <div>
                        <div className="font-semibold">Feature Request</div>
                        <div className="text-sm text-gray-600">Suggest new features or improvements</div>
                      </div>
                    </div>
                  </label>
                  
                  <label className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    formData.type === 'bug' 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="type"
                      value="bug"
                      checked={formData.type === 'bug'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <FaBug className="text-red-500 text-xl" />
                      <div>
                        <div className="font-semibold">Bug Report</div>
                        <div className="text-sm text-gray-600">Report issues or problems</div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  ref={titleRef}
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={formData.type === 'feature' ? 'Brief feature description...' : 'Brief issue description...'}
                  aria-invalid={!!errors.title}
                  aria-describedby={errors.title ? "title-error" : undefined}
                />
                <div style={{ minHeight: 20 }}>
                  {touched.title && errors.title && (
                    <p id="title-error" className="text-red-500 text-sm mt-1" aria-live="polite">
                      {errors.title}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  rows={4}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={
                    formData.type === 'feature' 
                      ? 'Describe the feature you\'d like to see, how it would work, and why it would be useful...'
                      : 'Describe the issue, when it happens, and what you expected to happen instead...'
                  }
                  aria-invalid={!!errors.description}
                  aria-describedby={errors.description ? "description-error" : undefined}
                />
                <div style={{ minHeight: 20 }}>
                  {touched.description && errors.description && (
                    <p id="description-error" className="text-red-500 text-sm mt-1" aria-live="polite">
                      {errors.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Priority and Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="general">General</option>
                    <option value="ui-ux">UI/UX</option>
                    <option value="performance">Performance</option>
                    <option value="mobile">Mobile</option>
                    <option value="search">Search</option>
                    <option value="products">Products</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              {/* Email (optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (optional)
                </label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your@email.com (for updates on your feedback)"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                <div style={{ minHeight: 20 }}>
                  {touched.email && errors.email && (
                    <p id="email-error" className="text-red-500 text-sm mt-1" aria-live="polite">
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || Object.keys(errors).length > 0}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                  loading || Object.keys(errors).length > 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <FaPaperPlane />
                    Submit Feedback
                  </span>
                )}
              </button>
            </form>
          </>
        ) : (
          /* Success Message */
          <div className="text-center py-8">
            <FaCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-600 mb-3">Thank You!</h2>
            <p className="text-gray-700 mb-2">Your feedback has been submitted successfully.</p>
            <p className="text-sm text-gray-500 mb-6">We appreciate you taking the time to help us improve!</p>
            
            {/* Progress bar */}
            <div className="w-full h-2 bg-gray-200 rounded mb-4">
              <div
                className="h-2 bg-blue-500 rounded transition-all duration-100"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            
            <button
              onClick={onClose}
              className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal; 