import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ref, get } from "firebase/database";
import { db, analytics } from "../firebase";
import ProductInterestModal from "../components/product/ProductInterestModal";
import FeedbackButton from "../components/FeedbackButton";
import Header from "../components/Header";
import { showToast } from "../utils/showToast";
import {
  FaShareAlt,
  FaHome,
  FaChevronRight,
  FaTruck,
  FaStore,
  FaCheckCircle,
  FaHeart,
  FaStar,
  FaRegStar,
  FaShieldAlt,
  FaTag,
  FaClock,
} from "react-icons/fa";
import { logEvent } from "firebase/analytics";
import { currencySymbols } from "../utils/utils";

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInterestForm, setShowInterestForm] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const snap = await get(ref(db, `products/${id}`));
        if (snap.exists()) {
          setProduct({ id, ...snap.val() });
        } else {
          setError("Product not found.");
        }
      } catch (err) {
        setError("Failed to load product.");
      }
      setLoading(false);
    };
    fetchProduct();
    if (analytics) logEvent(analytics, "view_product_page", { product_id: id });
  }, [id]);

  const handleShare = async () => {
    const url = window.location.href;
    if (analytics)
      logEvent(analytics, "share_product", { product_id: product?.id });
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: product.description,
          url,
        });
        showToast("✅ Link shared successfully!");
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
        showToast("✅ Link copied to clipboard!");
      } catch {
        showToast("❌ Failed to copy link.");
      }
    }
  };

  const calculateSavings = () => {
    if (product.original_price && product.price) {
      return (product.original_price - product.price).toFixed(2);
    }
    return 0;
  };

  const getDeliveryIcon = (option) => {
    const icons = {
      shipping: <FaTruck className="text-blue-600" />,
      "pick up": <FaStore className="text-green-600" />,
      pickup: <FaStore className="text-green-600" />,
    };
    return icons[option.toLowerCase()] || <FaTruck className="text-blue-600" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-lg text-gray-600">
            Loading product details...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl text-red-500 mb-4">⚠️</div>
          <div className="text-xl text-red-600 font-semibold mb-2">{error}</div>
          <Link to="/" className="text-blue-600 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title={product.title}
        subtitle={`Product Details - ${product.condition || "Available"}`}
        variant="simple"
      />

      {/* Breadcrumb Navigation */}
      <div className="bg-white  shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Link
                to="/"
                className="flex items-center gap-1 hover:text-blue-600 transition-colors"
              >
                <FaHome /> Home
              </Link>
              <FaChevronRight className="text-xs" />
              <span className="text-gray-900 font-medium truncate max-w-xs">
                {product.title}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={`p-2 rounded-full transition-colors ${
                  isWishlisted
                    ? "text-red-500 bg-red-50"
                    : "text-gray-400 hover:text-red-500"
                }`}
              >
                <FaHeart />
              </button>
              <button
                onClick={handleShare}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              >
                <FaShareAlt />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                />
              </div>
              {/* Image thumbnails placeholder */}
              <div className="flex gap-2">
                <div className="w-16 h-16 bg-gray-100 rounded border-2 border-blue-500">
                  <img
                    src={product.image}
                    alt=""
                    className="w-full h-full object-cover rounded"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Title and Rating */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-start justify-between mb-3">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight flex-1">
                  {product.title}
                </h1>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className={`p-2 rounded-full transition-colors ${
                      isWishlisted
                        ? "text-red-500 bg-red-50"
                        : "text-gray-400 hover:text-red-500"
                    }`}
                  >
                    <FaHeart />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-full hover:bg-blue-50"
                  >
                    <FaShareAlt />
                  </button>
                </div>
              </div>

              {/* Rating placeholder */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center">
                  {[1, 2, 3, 4].map((i) => (
                    <FaStar key={i} className="text-yellow-400 text-sm" />
                  ))}
                  <FaRegStar className="text-gray-300 text-sm" />
                </div>
                <span className="text-sm text-gray-600">(4.2) 127 reviews</span>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    product.status === "available"
                      ? "bg-green-100 text-green-800"
                      : "bg-orange-100 text-orange-800"
                  }`}
                >
                  <FaCheckCircle className="inline mr-1" />
                  {product.status || "Available"}
                </span>

                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {product.condition || product.age || "New"}
                </span>

                {product.discount && (
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                    <FaTag className="inline mr-1" />
                    {product.discount}% OFF
                  </span>
                )}
              </div>

              {/* Pricing */}
              <div className="space-y-2 mb-6">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-gray-900">
                    {currencySymbols[product.currency] || "€"}
                    {product.price}
                  </span>
                  {product.original_price && (
                    <span className="text-xl text-gray-500 line-through">
                      {currencySymbols[product.currency] || "€"}
                      {product.original_price}
                    </span>
                  )}
                </div>
                {calculateSavings() > 0 && (
                  <div className="text-green-600 font-semibold">
                    You save {currencySymbols[product.currency] || "€"}
                    {calculateSavings()} ({product.discount}%)
                  </div>
                )}
                <div className="text-sm text-gray-600">
                  Inclusive of all taxes
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <button
                  onClick={() => setShowInterestForm(true)}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  I'm Interested
                </button>
                {product.url && (
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-6 rounded-lg text-center transition-colors"
                  >
                    View Original
                  </a>
                )}
              </div>
            </div>

            {/* Delivery Options */}
            {product.delivery_options && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Delivery Options
                </h3>
                <div className="space-y-3">
                  {product.delivery_options.map((option, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      {getDeliveryIcon(option)}
                      <div>
                        <div className="font-medium text-gray-900">
                          {option}
                        </div>
                        <div className="text-sm text-gray-600">
                          {option.toLowerCase() === "shipping"
                            ? "Free delivery in 2-3 business days"
                            : "Available for pickup"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Product Details */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Product Details
              </h3>
              <div className="space-y-3">
                {product.source && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Source</span>
                    <span className="font-medium">{product.source}</span>
                  </div>
                )}
                {product.available_from && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Available From</span>
                    <span className="font-medium">
                      {product.available_from}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Currency</span>
                  <span className="font-medium">
                    {product.currency || "EUR"}
                  </span>
                </div>
                {product.timestamp && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Listed On</span>
                    <span className="font-medium">
                      {new Date(product.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Product Description
          </h3>
          <div className="prose max-w-none text-gray-700 whitespace-pre-line">
            {product.description || "No description available."}
          </div>
        </div>

        {/* Trust & Security */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Why Choose Us?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <FaShieldAlt className="text-3xl text-blue-600 mx-auto mb-2" />
              <h4 className="font-semibold mb-1">Secure Shopping</h4>
              <p className="text-sm text-gray-600">
                Your information is protected
              </p>
            </div>
            <div className="text-center">
              <FaTruck className="text-3xl text-green-600 mx-auto mb-2" />
              <h4 className="font-semibold mb-1">Fast Delivery</h4>
              <p className="text-sm text-gray-600">
                Quick and reliable shipping
              </p>
            </div>
            <div className="text-center">
              <FaClock className="text-3xl text-orange-600 mx-auto mb-2" />
              <h4 className="font-semibold mb-1">24/7 Support</h4>
              <p className="text-sm text-gray-600">
                We're here to help anytime
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interest Modal */}
      {showInterestForm && (
        <ProductInterestModal
          product={product}
          onClose={() => setShowInterestForm(false)}
          onSubmit={() => {
            if (analytics)
              logEvent(analytics, "submit_interest", {
                product_id: product.id,
              });
            setShowInterestForm(false);
          }}
        />
      )}

      {/* Feedback Button */}
      <FeedbackButton />
    </div>
  );
};

export default ProductDetails;
