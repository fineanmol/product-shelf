import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ref, get, push, set } from "firebase/database";
import { db, analytics } from "../firebase";
import { getProduct, incrementInterestCount } from "../services/productsService";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import ProductInterestModal from "../components/product/ProductInterestModal";
import PageHeader from "../components/shared/PageHeader";
import { shareProduct } from "../utils/shareUtils";
import { showToast } from "../utils/showToast";
import {
  FaHome,
  FaChevronRight,
  FaTruck,
  FaStore,
  FaCheckCircle,
  FaHeart,
  FaShieldAlt,
  FaShareAlt,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaUsers,
  FaAward,
  FaHeadset,
  FaRocket,
  FaGlobe,
  FaWhatsapp,
} from "react-icons/fa";
import { logEvent } from "firebase/analytics";
import { currencySymbols } from "../utils/utils";
import AnimatedButton from "../components/ui/AnimatedButton";
import LoadingSpinner from "../components/ui/LoadingSpinner";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInterestForm, setShowInterestForm] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [currentUser, setCurrentUser] = useState(null);
  const [sellerPhone, setSellerPhone] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const productData = await getProduct(id);
        if (productData) {
          setProduct(productData);

          if (productData.added_by) {
            // Best-effort only: anonymous/non-owner visitors are not
            // permitted to read another user's record (database.rules.json
            // restricts users/$uid reads to that user or a superAdmin), so a
            // permission-denied here is expected for most shoppers and must
            // not fail the whole product page -- it should just mean no
            // WhatsApp contact button, which is already how a missing phone
            // number is handled below.
            try {
              const sellerSnap = await get(ref(db, `users/${productData.added_by}`));
              if (sellerSnap.exists()) {
                const sellerData = sellerSnap.val();
                if (sellerData.phone) {
                  setSellerPhone(sellerData.phone);
                }
              }
            } catch (sellerErr) {
              console.error("Could not load seller contact info:", sellerErr);
            }
          }
        } else {
          setError("Product not found.");
        }
      } catch (err) {
        console.error("Failed to load product:", err);
        setError("Failed to load product.");
      }
      setLoading(false);
    };
    fetchProduct();
    if (analytics) logEvent(analytics, "view_product_page", { product_id: id });
  }, [id]);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleShare = async () => {
    if (analytics) {
      logEvent(analytics, "share_product", { product_id: product?.id });
    }

    const result = await shareProduct(product);

    if (result.success) {
      if (result.message) {
        showToast(result.message);
      }
    } else {
      showToast("❌ Could not share product. Please try again.");
    }
  };

  const calculateSavings = () => {
    if (product.original_price && product.price) {
      return (product.original_price - product.price).toFixed(2);
    }
    return 0;
  };

  const calculateDiscount = () => {
    if (product.original_price && product.price) {
      return Math.round(
        ((product.original_price - product.price) / product.original_price) *
          100
      );
    }
    return 0;
  };

  const getDeliveryIcon = (option) => {
    const icons = {
      shipping: <FaTruck className="text-brand-sky" />,
      "pick up": <FaStore className="text-brand-mint" />,
      pickup: <FaStore className="text-brand-mint" />,
    };
    return icons[option.toLowerCase()] || <FaTruck className="text-brand-sky" />;
  };

  const formatPrice = (price, currency = "EUR") => {
    return `${currencySymbols[currency] || "€"}${price}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="bg-white border border-stone-200 rounded-xl shadow-soft p-8 text-center">
          <LoadingSpinner text="Loading product details..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="bg-white border border-stone-200 rounded-xl shadow-soft p-8 text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-title-lg text-brand-coral mb-2">{error}</h2>
          <p className="text-body text-stone-700 mb-6">
            The product you're looking for might have been removed or doesn't
            exist.
          </p>
          <AnimatedButton variant="primary" onClick={() => navigate("/")}>
            <FaHome className="mr-2" />
            Back to Home
          </AnimatedButton>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <PageHeader
        siteName="SkyMarket"
        searchValue=""
        onSearchChange={() => {}}
        currentUser={currentUser}
        rightActions={
          <button
            onClick={() => navigate("/")}
            aria-label="Back to Home"
            className="flex items-center gap-2 bg-white border-2 border-brand-navy text-brand-navy hover:bg-brand-navy hover:text-white px-4 py-2.5 rounded-lg transition-colors font-medium shadow-sm"
          >
            <FaHome className="text-sm" />
            <span className="hidden sm:inline">Back to Home</span>
          </button>
        }
      />

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-caption text-stone-500">
          <Link
            to="/"
            className="hover:text-brand-sky transition-colors flex items-center gap-1"
          >
            <FaHome />
            Home
          </Link>
          <FaChevronRight className="text-xs" />
          <Link to="/" className="hover:text-brand-sky transition-colors">
            Products
          </Link>
          <FaChevronRight className="text-xs" />
          <span className="text-brand-navy font-medium truncate max-w-xs">
            {product.title}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="bg-white border border-stone-200 rounded-xl shadow-soft p-6">
              <div className="aspect-square bg-stone-50 rounded-xl overflow-hidden mb-4 relative group">
                <img
                  src={product.image || null}
                  alt={product.title}
                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                />

                {/* Image overlay with actions */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    aria-label={
                      isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                    }
                    aria-pressed={isWishlisted}
                    className={`p-3 rounded-full shadow-soft transition-all ${
                      isWishlisted
                        ? "bg-brand-coral text-white"
                        : "bg-white/80 text-stone-700 hover:bg-white"
                    }`}
                  >
                    <FaHeart />
                  </button>
                  <button
                    onClick={handleShare}
                    aria-label="Share this product"
                    className="p-3 rounded-full bg-white/80 text-stone-700 hover:bg-white shadow-soft transition-all"
                  >
                    <FaShareAlt />
                  </button>
                </div>

                {/* Discount badge */}
                {calculateDiscount() > 0 && (
                  <div className="absolute top-4 left-4">
                    <span className="bg-brand-coral text-white px-3 py-1 rounded-full text-caption font-bold">
                      -{calculateDiscount()}% OFF
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Trust indicators */}
            <div className="bg-white border border-stone-200 rounded-xl shadow-soft p-6">
              <h2 className="text-title text-brand-navy mb-4">
                Why Choose Us?
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-mint/20 rounded-lg flex items-center justify-center">
                    <FaShieldAlt className="text-brand-mint" />
                  </div>
                  <div>
                    <p className="text-body font-medium text-brand-navy">
                      Secure Payment
                    </p>
                    <p className="text-caption text-stone-500">
                      100% Protected
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-sky/20 rounded-lg flex items-center justify-center">
                    <FaTruck className="text-brand-sky" />
                  </div>
                  <div>
                    <p className="text-body font-medium text-brand-navy">
                      Fast Delivery
                    </p>
                    <p className="text-caption text-stone-500">
                      2-3 Business Days
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-stone-200 rounded-lg flex items-center justify-center">
                    <FaHeadset className="text-stone-600" />
                  </div>
                  <div>
                    <p className="text-body font-medium text-brand-navy">
                      24/7 Support
                    </p>
                    <p className="text-caption text-stone-500">Always Here</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-sunshine/20 rounded-lg flex items-center justify-center">
                    <FaAward className="text-brand-navy" />
                  </div>
                  <div>
                    <p className="text-body font-medium text-brand-navy">
                      Quality Assured
                    </p>
                    <p className="text-caption text-stone-500">
                      Verified Products
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div className="bg-white border border-stone-200 rounded-xl shadow-soft p-8">
              {/* Product title and rating */}
              <div className="mb-6">
                {product.sold_out && (
                  <div className="mb-3">
                    <span className="inline-block bg-brand-coral text-white text-body font-bold px-4 py-2 rounded-full">
                      SOLD OUT
                    </span>
                  </div>
                )}

                <h1 className="text-display text-brand-navy mb-3">
                  {product.title}
                </h1>

                {/* Status badges */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <span
                    className={`px-3 py-1 rounded-full text-caption font-semibold flex items-center gap-1 ${
                      product.status === "available"
                        ? "bg-brand-mint/20 text-brand-navy"
                        : "bg-brand-sunshine/30 text-brand-navy"
                    }`}
                  >
                    <FaCheckCircle className="text-xs" />
                    {product.status === "available" ? "In Stock" : "Reserved"}
                  </span>

                  <span className="bg-brand-sky/20 text-brand-navy px-3 py-1 rounded-full text-caption font-semibold">
                    {product.condition || product.age || "New"}
                  </span>

                  {product.source && (
                    <span className="bg-stone-200 text-stone-700 px-3 py-1 rounded-full text-caption font-semibold">
                      From {product.source}
                    </span>
                  )}
                </div>
              </div>

              {/* Pricing */}
              <div className="mb-8 p-6 rounded-xl bg-stone-50">
                <div className="flex items-baseline gap-4 mb-2">
                  <span className="text-display text-brand-navy">
                    {formatPrice(product.price, product.currency)}
                  </span>
                  {product.original_price &&
                    product.original_price > product.price && (
                      <span className="text-title-lg line-through text-stone-500">
                        {formatPrice(product.original_price, product.currency)}
                      </span>
                    )}
                </div>

                {calculateSavings() > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-body font-semibold text-brand-mint">
                      You save{" "}
                      {formatPrice(calculateSavings(), product.currency)}
                    </span>
                    <span className="bg-brand-coral text-white px-2 py-1 rounded text-caption font-bold">
                      {calculateDiscount()}% OFF
                    </span>
                  </div>
                )}

                <p className="text-caption text-stone-500">
                  Inclusive of all taxes • Free shipping on orders over €50
                </p>
              </div>

              {/* Quantity and Actions */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4">
                  <label className="text-body font-medium text-stone-700">
                    Quantity:
                  </label>
                  <div className="flex items-center border border-stone-200 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      aria-label="Decrease quantity"
                      className="px-3 py-2 hover:bg-stone-100 transition-colors"
                    >
                      -
                    </button>
                    <span className="px-4 py-2 border-x border-stone-200 text-stone-700">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      aria-label="Increase quantity"
                      className="px-3 py-2 hover:bg-stone-100 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <AnimatedButton
                      variant="primary"
                      size="lg"
                      onClick={() => setShowInterestForm(true)}
                      disabled={product.sold_out}
                      className="w-full"
                    >
                      {product.sold_out ? "Sold Out" : "I'm Interested"}
                    </AnimatedButton>

                    {product.url && (
                      <AnimatedButton
                        variant="secondary"
                        size="lg"
                        onClick={() => window.open(product.url, "_blank")}
                        className="w-full"
                      >
                        <FaGlobe className="mr-2" />
                        View Original
                      </AnimatedButton>
                    )}
                  </div>

                  {sellerPhone && !product.sold_out && (
                    <a
                      href={`https://wa.me/${sellerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
                        `Hi, I'm interested in your product "${product.title}" listed on SkyMarket!`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-soft hover:shadow-soft-md text-center text-body-lg"
                    >
                      <FaWhatsapp className="text-xl" />
                      <span>Chat on WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Delivery Options */}
              {product.delivery_options && (
                <div className="mb-8">
                  <h2 className="text-title text-brand-navy mb-4">
                    Delivery Options
                  </h2>
                  <div className="space-y-3">
                    {product.delivery_options.map((option, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-4 rounded-xl border border-stone-200 bg-stone-50"
                      >
                        <div className="w-10 h-10 bg-brand-sky/20 rounded-lg flex items-center justify-center">
                          {getDeliveryIcon(option)}
                        </div>
                        <div className="flex-1">
                          <div className="text-body font-medium text-brand-navy">
                            {option}
                          </div>
                          <div className="text-caption text-stone-700">
                            {option.toLowerCase() === "shipping"
                              ? "Free delivery in 2-3 business days"
                              : "Available for pickup in Berlin"}
                          </div>
                        </div>
                        <div className="text-caption font-semibold text-brand-mint-text">
                          {option.toLowerCase() === "shipping"
                            ? "Free"
                            : "Available"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Product Details Tabs */}
            <div className="bg-white border border-stone-200 rounded-xl shadow-soft overflow-hidden">
              <div className="flex border-b border-stone-200">
                {["description", "specifications", "reviews"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 px-6 py-4 text-body font-medium capitalize transition-colors ${
                      activeTab === tab
                        ? "border-b-2 border-brand-sky text-brand-sky-text"
                        : "text-stone-500 hover:text-stone-700"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === "description" && (
                  <div className="prose max-w-none">
                    <p className="text-body text-stone-700 leading-relaxed">
                      {product.description ||
                        "No description available for this product."}
                    </p>
                  </div>
                )}

                {activeTab === "specifications" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {product.source && (
                        <div className="flex justify-between py-2 border-b border-stone-200">
                          <span className="text-body text-stone-500">
                            Source
                          </span>
                          <span className="text-body font-medium text-brand-navy">
                            {product.source}
                          </span>
                        </div>
                      )}
                      {product.available_from && (
                        <div className="flex justify-between py-2 border-b border-stone-200">
                          <span className="text-body text-stone-500">
                            Available From
                          </span>
                          <span className="text-body font-medium text-brand-navy">
                            {product.available_from}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between py-2 border-b border-stone-200">
                        <span className="text-body text-stone-500">
                          Currency
                        </span>
                        <span className="text-body font-medium text-brand-navy">
                          {product.currency || "EUR"}
                        </span>
                      </div>
                      {product.timestamp && (
                        <div className="flex justify-between py-2">
                          <span className="text-body text-stone-500">
                            Listed On
                          </span>
                          <span className="text-body font-medium text-brand-navy">
                            {new Date(product.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "reviews" && (
                  <div className="text-center py-8 text-stone-500">
                    <FaUsers className="text-4xl mb-4 mx-auto" />
                    <p className="text-body">
                      Customer reviews will appear here once available.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Enhanced Footer */}
      <footer className="bg-white mt-16 rounded-none border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-navy rounded-xl flex items-center justify-center">
                  <FaStore className="text-white text-lg" />
                </div>
                <div>
                  <h2 className="text-title text-brand-navy">SkyMarket</h2>
                  <p className="text-caption text-stone-500">
                    Premium Marketplace
                  </p>
                </div>
              </div>
              <p className="text-body text-stone-700 leading-relaxed">
                Your trusted marketplace for premium products. We connect buyers
                and sellers in a secure, modern platform designed for the
                digital age.
              </p>
              <div className="flex gap-3">
                {[
                  { Icon: FaFacebook, label: "Facebook" },
                  { Icon: FaTwitter, label: "Twitter" },
                  { Icon: FaInstagram, label: "Instagram" },
                  { Icon: FaLinkedin, label: "LinkedIn" },
                ].map(({ Icon, label }) => (
                  <button
                    key={label}
                    aria-label={`Visit our ${label} page`}
                    className="w-10 h-10 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors"
                  >
                    <Icon className="text-stone-600" />
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-title text-brand-navy mb-4">Quick Links</h3>
              <ul className="space-y-2">
                {[
                  "Browse Products",
                  "Categories",
                  "Deals & Offers",
                  "New Arrivals",
                  "Best Sellers",
                ].map((link) => (
                  <li key={link}>
                    <Link
                      to="/"
                      className="text-body text-stone-700 hover:text-brand-sky transition-colors"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Customer Service */}
            <div>
              <h3 className="text-title text-brand-navy mb-4">
                Customer Service
              </h3>
              <ul className="space-y-2">
                {[
                  "Help Center",
                  "Contact Us",
                  "Shipping Info",
                  "Returns",
                  "Size Guide",
                ].map((link) => (
                  <li key={link}>
                    <Link
                      to="/"
                      className="text-body text-stone-700 hover:text-brand-sky transition-colors"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-title text-brand-navy mb-4">
                Get in Touch
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <FaMapMarkerAlt className="text-stone-500" />
                  <span className="text-body text-stone-700">
                    Berlin, Germany
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <FaPhone className="text-stone-500" />
                  <span className="text-body text-stone-700">
                    +49 (0) 123 456 789
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <FaEnvelope className="text-stone-500" />
                  <span className="text-body text-stone-700">
                    hello@skymarket.com
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-body font-medium text-brand-navy mb-2">
                  Newsletter
                </h4>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Your email"
                    aria-label="Email address for newsletter"
                    className="flex-1 px-3 py-2 text-body border border-stone-200 bg-stone-50 text-brand-navy rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-sky"
                  />
                  <AnimatedButton
                    variant="primary"
                    size="sm"
                    aria-label="Subscribe to newsletter"
                  >
                    <FaRocket />
                  </AnimatedButton>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-stone-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-caption text-stone-500">
              © {new Date().getFullYear()} SkyMarket. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-caption">
              <Link
                to="/privacy"
                className="text-stone-500 hover:text-brand-sky transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="text-stone-500 hover:text-brand-sky transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                to="/cookies"
                className="text-stone-500 hover:text-brand-sky transition-colors"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Interest Modal */}
      {showInterestForm && (
        <ProductInterestModal
          product={product}
          onClose={() => setShowInterestForm(false)}
          onSubmit={async (interestData) => {
            try {
              const newInterestRef = push(ref(db, `interests/${product.id}`));

              // Two independent writes, same reasoning as Home.jsx's
              // handleInterestSubmit: the interest record is create-only
              // and needs no auth; the counter uses its own transaction
              // so it can't block or be blocked by the interest write.
              await set(newInterestRef, {
                name: interestData.name,
                email: interestData.email,
                phone: interestData.phone,
                message: interestData.message,
                delivery_preferences: interestData.delivery_preferences,
                timestamp: interestData.timestamp,
                resolved: false,
              });

              try {
                await incrementInterestCount(product.id);
                setProduct((prev) => {
                  if (!prev) return null;
                  return {
                    ...prev,
                    interestCount: (prev.interestCount || 0) + 1,
                  };
                });
              } catch (countErr) {
                console.error("Failed to increment interestCount:", countErr);
              }

              if (analytics) {
                logEvent(analytics, "submit_interest", {
                  product_id: product.id,
                });
              }
            } catch (err) {
              console.error("Database update failed for interest submission:", err);
            }
          }}
        />
      )}
    </div>
  );
};

export default ProductDetails;
