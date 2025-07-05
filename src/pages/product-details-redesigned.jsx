import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ref, get } from "firebase/database";
import { db, analytics } from "../firebase";
import ProductInterestModal from "../components/product/ProductInterestModal";
import { shareProduct } from "../utils/shareUtils";
import { showToast } from "../utils/showToast";
import {
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
  FaShareAlt,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaArrowLeft,
  FaEye,
  FaUsers,
  FaAward,
  FaHeadset,
  FaLock,
  FaRocket,
  FaGlobe
} from "react-icons/fa";
import { logEvent } from "firebase/analytics";
import { currencySymbols } from "../utils/utils";
import ThemeToggle from "../components/ui/ThemeToggle";
import AnimatedButton from "../components/ui/AnimatedButton";

const ProductDetailsRedesigned = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInterestForm, setShowInterestForm] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');

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
      return Math.round(((product.original_price - product.price) / product.original_price) * 100);
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

  const formatPrice = (price, currency = 'EUR') => {
    return `${currencySymbols[currency] || '€'}${price}`;
  };

  // Mock data for enhanced features
  const mockImages = product?.image ? [product.image, product.image, product.image] : [];
  const mockReviews = {
    average: 4.5,
    count: 127,
    breakdown: { 5: 78, 4: 32, 3: 12, 2: 3, 1: 2 }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="glass-card p-8 text-center">
          <div className="loading-dots mb-4">
            <div></div><div></div><div></div><div></div>
          </div>
          <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
            Loading product details...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="glass-card p-8 text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--accent-error)' }}>
            {error}
          </h2>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            The product you're looking for might have been removed or doesn't exist.
          </p>
          <AnimatedButton variant="primary" onClick={() => navigate('/')}>
            <FaHome className="mr-2" />
            Back to Home
          </AnimatedButton>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Enhanced Header */}
      <header className="glass-card sticky top-0 z-50 border-b" style={{ borderColor: 'var(--border-glass)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <FaStore className="text-white text-lg" />
                </div>
                <div>
                  <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    MarketSpace
                  </h1>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Premium Marketplace
                  </p>
                </div>
              </Link>

              {/* Navigation */}
              <nav className="hidden md:flex items-center gap-6">
                <Link to="/" className="text-sm font-medium hover:text-blue-600 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                  Products
                </Link>
                <Link to="/categories" className="text-sm font-medium hover:text-blue-600 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                  Categories
                </Link>
                <Link to="/deals" className="text-sm font-medium hover:text-blue-600 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                  Deals
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              <AnimatedButton variant="secondary" size="sm" onClick={() => navigate('/login')}>
                Sell Items
              </AnimatedButton>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          <Link to="/" className="hover:text-blue-600 transition-colors flex items-center gap-1">
            <FaHome />
            Home
          </Link>
          <FaChevronRight className="text-xs" />
          <Link to="/" className="hover:text-blue-600 transition-colors">
            Products
          </Link>
          <FaChevronRight className="text-xs" />
          <span style={{ color: 'var(--text-primary)' }} className="font-medium truncate max-w-xs">
            {product.title}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="glass-card p-6 rounded-2xl">
              <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden mb-4 relative group">
                <img
                  src={mockImages[selectedImage] || product.image}
                  alt={product.title}
                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Image overlay with actions */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className={`p-3 rounded-full backdrop-blur-md transition-all ${
                      isWishlisted 
                        ? 'bg-red-500 text-white' 
                        : 'bg-white/20 text-gray-700 hover:bg-white/30'
                    }`}
                  >
                    <FaHeart />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-3 rounded-full bg-white/20 backdrop-blur-md text-gray-700 hover:bg-white/30 transition-all"
                  >
                    <FaShareAlt />
                  </button>
                </div>

                {/* Discount badge */}
                {calculateDiscount() > 0 && (
                  <div className="absolute top-4 left-4">
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      -{calculateDiscount()}% OFF
                    </span>
                  </div>
                )}
              </div>

              {/* Image thumbnails */}
              {mockImages.length > 1 && (
                <div className="flex gap-2">
                  {mockImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === index 
                          ? 'border-blue-500' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Trust indicators */}
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Why Choose Us?
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <FaShieldAlt className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      Secure Payment
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      100% Protected
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FaTruck className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      Fast Delivery
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      2-3 Business Days
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FaHeadset className="text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      24/7 Support
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Always Here
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <FaAward className="text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      Quality Assured
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Verified Products
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div className="glass-card p-8 rounded-2xl">
              {/* Product title and rating */}
              <div className="mb-6">
                {product.sold_out && (
                  <div className="mb-3">
                    <span className="inline-block bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-full">
                      SOLD OUT
                    </span>
                  </div>
                )}
                
                <h1 className="text-3xl lg:text-4xl font-bold mb-3 leading-tight" style={{ color: 'var(--text-primary)' }}>
                  {product.title}
                </h1>

                {/* Rating and reviews */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar 
                        key={star} 
                        className={star <= Math.floor(mockReviews.average) ? 'text-yellow-400' : 'text-gray-300'} 
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {mockReviews.average} ({mockReviews.count} reviews)
                  </span>
                  <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                    <FaEye />
                    <span>2.3k views</span>
                  </div>
                </div>

                {/* Status badges */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${
                    product.status === "available"
                      ? "bg-green-100 text-green-800"
                      : "bg-orange-100 text-orange-800"
                  }`}>
                    <FaCheckCircle className="text-xs" />
                    {product.status === "available" ? "In Stock" : "Reserved"}
                  </span>

                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {product.condition || product.age || "New"}
                  </span>

                  {product.source && (
                    <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-semibold">
                      From {product.source}
                    </span>
                  )}
                </div>
              </div>

              {/* Pricing */}
              <div className="mb-8 p-6 rounded-xl" style={{ background: 'var(--bg-glass)' }}>
                <div className="flex items-baseline gap-4 mb-2">
                  <span className="text-4xl font-bold" style={{ color: 'var(--accent-primary)' }}>
                    {formatPrice(product.price, product.currency)}
                  </span>
                  {product.original_price && product.original_price > product.price && (
                    <span className="text-xl line-through" style={{ color: 'var(--text-muted)' }}>
                      {formatPrice(product.original_price, product.currency)}
                    </span>
                  )}
                </div>
                
                {calculateSavings() > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-600 font-semibold">
                      You save {formatPrice(calculateSavings(), product.currency)}
                    </span>
                    <span className="bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
                      {calculateDiscount()}% OFF
                    </span>
                  </div>
                )}
                
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Inclusive of all taxes • Free shipping on orders over €50
                </p>
              </div>

              {/* Quantity and Actions */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Quantity:
                  </label>
                  <div className="flex items-center border rounded-lg" style={{ borderColor: 'var(--border-glass)' }}>
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 hover:bg-gray-100 transition-colors"
                    >
                      -
                    </button>
                    <span className="px-4 py-2 border-x" style={{ borderColor: 'var(--border-glass)' }}>
                      {quantity}
                    </span>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-2 hover:bg-gray-100 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <AnimatedButton
                    variant="primary"
                    size="lg"
                    onClick={() => setShowInterestForm(true)}
                    disabled={product.sold_out}
                    className="w-full"
                  >
                    {product.sold_out ? 'Sold Out' : 'I\'m Interested'}
                  </AnimatedButton>
                  
                  {product.url && (
                    <AnimatedButton
                      variant="secondary"
                      size="lg"
                      onClick={() => window.open(product.url, '_blank')}
                      className="w-full"
                    >
                      <FaGlobe className="mr-2" />
                      View Original
                    </AnimatedButton>
                  )}
                </div>
              </div>

              {/* Delivery Options */}
              {product.delivery_options && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                    Delivery Options
                  </h3>
                  <div className="space-y-3">
                    {product.delivery_options.map((option, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-4 rounded-xl border"
                        style={{ 
                          background: 'var(--bg-glass)',
                          borderColor: 'var(--border-glass)'
                        }}
                      >
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          {getDeliveryIcon(option)}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                            {option}
                          </div>
                          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {option.toLowerCase() === "shipping"
                              ? "Free delivery in 2-3 business days"
                              : "Available for pickup in Berlin"}
                          </div>
                        </div>
                        <div className="text-sm font-semibold" style={{ color: 'var(--accent-success)' }}>
                          {option.toLowerCase() === "shipping" ? "Free" : "Available"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Product Details Tabs */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="flex border-b" style={{ borderColor: 'var(--border-glass)' }}>
                {['description', 'specifications', 'reviews'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 px-6 py-4 text-sm font-medium capitalize transition-colors ${
                      activeTab === tab
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === 'description' && (
                  <div className="prose max-w-none">
                    <p style={{ color: 'var(--text-secondary)' }} className="leading-relaxed">
                      {product.description || "No description available for this product."}
                    </p>
                  </div>
                )}

                {activeTab === 'specifications' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {product.source && (
                        <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border-glass)' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Source</span>
                          <span style={{ color: 'var(--text-primary)' }} className="font-medium">{product.source}</span>
                        </div>
                      )}
                      {product.available_from && (
                        <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border-glass)' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Available From</span>
                          <span style={{ color: 'var(--text-primary)' }} className="font-medium">{product.available_from}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border-glass)' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Currency</span>
                        <span style={{ color: 'var(--text-primary)' }} className="font-medium">{product.currency || "EUR"}</span>
                      </div>
                      {product.timestamp && (
                        <div className="flex justify-between py-2">
                          <span style={{ color: 'var(--text-muted)' }}>Listed On</span>
                          <span style={{ color: 'var(--text-primary)' }} className="font-medium">
                            {new Date(product.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-4xl font-bold mb-1" style={{ color: 'var(--accent-primary)' }}>
                          {mockReviews.average}
                        </div>
                        <div className="flex items-center justify-center mb-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FaStar 
                              key={star} 
                              className={star <= Math.floor(mockReviews.average) ? 'text-yellow-400' : 'text-gray-300'} 
                            />
                          ))}
                        </div>
                        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                          {mockReviews.count} reviews
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        {Object.entries(mockReviews.breakdown).reverse().map(([stars, count]) => (
                          <div key={stars} className="flex items-center gap-2 mb-1">
                            <span className="text-sm w-8">{stars}★</span>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-yellow-400 rounded-full"
                                style={{ width: `${(count / mockReviews.count) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm w-8 text-right">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                      <FaUsers className="text-4xl mb-4 mx-auto" />
                      <p>Customer reviews will appear here once available.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Footer */}
      <footer className="glass-card mt-16 rounded-none border-t" style={{ borderColor: 'var(--border-glass)' }}>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <FaStore className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    MarketSpace
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Premium Marketplace
                  </p>
                </div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Your trusted marketplace for premium products. We connect buyers and sellers 
                in a secure, modern platform designed for the digital age.
              </p>
              <div className="flex gap-3">
                {[FaFacebook, FaTwitter, FaInstagram, FaLinkedin].map((Icon, index) => (
                  <button
                    key={index}
                    className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <Icon className="text-gray-600" />
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Quick Links
              </h4>
              <ul className="space-y-2">
                {['Browse Products', 'Categories', 'Deals & Offers', 'New Arrivals', 'Best Sellers'].map((link) => (
                  <li key={link}>
                    <Link 
                      to="/" 
                      className="text-sm hover:text-blue-600 transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Customer Service */}
            <div>
              <h4 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Customer Service
              </h4>
              <ul className="space-y-2">
                {['Help Center', 'Contact Us', 'Shipping Info', 'Returns', 'Size Guide'].map((link) => (
                  <li key={link}>
                    <Link 
                      to="/" 
                      className="text-sm hover:text-blue-600 transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Get in Touch
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <FaMapMarkerAlt style={{ color: 'var(--text-muted)' }} />
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Berlin, Germany
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <FaPhone style={{ color: 'var(--text-muted)' }} />
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    +49 (0) 123 456 789
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <FaEnvelope style={{ color: 'var(--text-muted)' }} />
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    hello@marketspace.com
                  </span>
                </div>
              </div>
              
              <div className="mt-6">
                <h5 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Newsletter
                </h5>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Your email"
                    className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ 
                      background: 'var(--bg-glass)',
                      borderColor: 'var(--border-glass)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <AnimatedButton variant="primary" size="sm">
                    <FaRocket />
                  </AnimatedButton>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4" 
               style={{ borderColor: 'var(--border-glass)' }}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              © {new Date().getFullYear()} MarketSpace. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link to="/privacy" className="hover:text-blue-600 transition-colors" style={{ color: 'var(--text-muted)' }}>
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-blue-600 transition-colors" style={{ color: 'var(--text-muted)' }}>
                Terms of Service
              </Link>
              <Link to="/cookies" className="hover:text-blue-600 transition-colors" style={{ color: 'var(--text-muted)' }}>
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
          onSubmit={() => {
            if (analytics)
              logEvent(analytics, "submit_interest", {
                product_id: product.id,
              });
            setShowInterestForm(false);
          }}
        />
      )}
    </div>
  );
};

export default ProductDetailsRedesigned;