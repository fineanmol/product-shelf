import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ref, get } from "firebase/database";
import { db, analytics } from "../firebase";
import ProductInterestModal from "../components/product/ProductInterestModal";
import StepsToBuy from "../components/StepsToBuy";
import { showToast } from "../utils/showToast";
import { FaShareAlt, FaHome, FaChevronRight } from "react-icons/fa";
import { logEvent } from "firebase/analytics";
import Header from "../components/Header";

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInterestForm, setShowInterestForm] = useState(false);

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
    if (analytics) logEvent(analytics, "share_product", { product_id: product?.id });
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: product.description,
          url,
        });
        showToast("Link shared!");
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
        showToast("Link copied to clipboard!");
      } catch {
        showToast("Failed to copy link.");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-500">Loading product...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-red-500">{error}</div>
      </div>
    );
  }
  if (!product) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col">
      <Header title="Welcome to Marketplace" />

      {/* BREADCRUMB */}
      <div className="max-w-4xl w-full mx-auto mt-6 px-4">
        <nav className="flex items-center text-sm text-gray-500 gap-2">
          <Link
            to="/"
            className="flex items-center gap-1 hover:text-blue-600 transition"
          >
            <FaHome className="inline-block" /> Home
          </Link>
          <FaChevronRight className="inline-block text-xs mx-1" />
          <span className="truncate max-w-xs" title={product.title}>
            {product.title}
          </span>
        </nav>
      </div>

      {/* PRODUCT CARD */}
      <div className="max-w-4xl w-full mx-auto mt-4 bg-white rounded-xl shadow-lg p-6 flex flex-col md:flex-row gap-8">
        <div className="flex-1 flex flex-col items-center">
          <img
            src={product.image}
            alt={product.title}
            className="w-full max-w-xs rounded-lg shadow-lg object-cover mb-4 border border-gray-100"
          />
          <button
            className="mt-2 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            onClick={handleShare}
          >
            <FaShareAlt /> Share Product
          </button>
        </div>
        <div className="flex-1 flex flex-col gap-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {product.title}
          </h1>
          <div className="flex flex-wrap gap-2 items-center mb-2">
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold capitalize">
              {product.status || "Available"}
            </span>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold capitalize">
              {product.condition || product.age || "New"}
            </span>
            {product.discount && (
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                {product.discount}% OFF
              </span>
            )}
          </div>
          <div className="text-2xl font-bold text-blue-700 mb-2">
            €{product.price}
            {product.original_price && (
              <span className="text-lg text-gray-400 line-through ml-2">
                €{product.original_price}
              </span>
            )}
          </div>
          <div className="text-gray-700 mb-4 whitespace-pre-line">
            {product.description}
          </div>
          <div className="flex gap-4 mb-4">
            <button
              className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 transition"
              onClick={() => setShowInterestForm(true)}
            >
              I'm Interested
            </button>
            {product.url && (
              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded shadow hover:bg-gray-300 transition"
              >
                View on Source
              </a>
            )}
          </div>
          <div className="text-sm text-gray-500">
            Added:{" "}
            {product.timestamp
              ? new Date(product.timestamp).toLocaleString()
              : "-"}
          </div>
        </div>
      </div>
      <div className="max-w-4xl w-full mx-auto mt-8">
        <StepsToBuy />
      </div>
      {showInterestForm && (
        <ProductInterestModal
          product={product}
          onClose={() => setShowInterestForm(false)}
          onSubmit={() => {
            if (analytics) logEvent(analytics, "submit_interest", { product_id: product.id });
            setShowInterestForm(false);
          }}
        />
      )}
      {/* FOOTER */}
      <footer className="bg-white text-center text-gray-500 text-sm py-4 mt-12 shadow-inner">
        © {new Date().getFullYear()} Marketplace. All rights reserved.
      </footer>
    </div>
  );
};

export default ProductDetails;
