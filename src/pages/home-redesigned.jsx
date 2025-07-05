import React, { useEffect, useState, useMemo } from "react";
import { ref, push, onValue } from "firebase/database";
import { db, analytics } from "../firebase";
import ProductCardRedesigned from "../components/product/ProductCardRedesigned";
import ProductInterestModal from "../components/product/ProductInterestModal";
import { showToast } from "../utils/showToast";
import { useNavigate } from "react-router-dom";
import { logEvent } from "firebase/analytics";
import FeedbackButton from "../components/FeedbackButton";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import ThemeToggle from "../components/ui/ThemeToggle";
import AnimatedButton from "../components/ui/AnimatedButton";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import {
  FaShoppingCart,
  FaHeart,
  FaSearch,
  FaTags,
  FaShieldAlt,
  FaPlus,
  FaFilter,
  FaSort,
  FaTh,
  FaList,
  FaStore,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaRocket,
  FaAward,
  FaHeadset,
  FaTruck,
  FaUsers,
  FaGlobe
} from "react-icons/fa";

const HomeRedesigned = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInterestForm, setShowInterestForm] = useState(null);
  const [interestData, setInterestData] = useState({});
  const [interestedItems, setInterestedItems] = useState([]);
  const [pulseId, setPulseId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [priceSort, setPriceSort] = useState("latest");
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const dbRef = ref(db, "products");
    const interestsRef = ref(db, "interests");

    const productListener = onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();

        const productList = Object.entries(data)
          .filter(
            ([, value]) =>
              value &&
              typeof value === "object" &&
              !Array.isArray(value) &&
              value.title
          )
          .map(([id, item]) => ({ id, ...item }))
          .filter((p) => p.visible !== false);

        setItems(productList);
      }
      setLoading(false);
    });

    const interestListener = onValue(interestsRef, (snapshot) => {
      if (snapshot.exists()) {
        setInterestData(snapshot.val());
      }
    });

    // Log home view
    if (analytics) logEvent(analytics, "view_home");

    return () => {
      productListener();
      interestListener();
    };
  }, []);

  // Memoize expensive filtering and sorting operations
  const filteredItems = useMemo(() => {
    return (
      items
        // 1. Search filter
        .filter((item) =>
          item.title.toLowerCase().includes(searchTerm.toLowerCase())
        )
        // 2. Status filter
        .filter((item) => (statusFilter ? item.status === statusFilter : true))
        // 3. Condition filter
        .filter((item) =>
          conditionFilter ? item.condition === conditionFilter : true
        )
        // Sorting logic
        .sort((a, b) => {
          if (priceSort === "price-low") return a.price - b.price;
          if (priceSort === "price-high") return b.price - a.price;
          // 'latest' - sort by timestamp descending (latest first)
          return (b.timestamp || 0) - (a.timestamp || 0);
        })
    );
  }, [items, searchTerm, statusFilter, conditionFilter, priceSort]);

  const handleInterestSubmit = async ({
    name,
    email,
    phone,
    delivery_preferences,
  }) => {
    const product = showInterestForm;
    try {
      await push(ref(db, `interests/${product.id}`), {
        name,
        email,
        phone,
        delivery_preferences,
        timestamp: Date.now(),
      });
      if (analytics)
        logEvent(analytics, "submit_interest", { product_id: product.id });
      setInterestedItems((prev) => [...prev, product.id]);
      setShowInterestForm(null);
      showToast("✅ Thanks! Your interest was submitted.");
    } catch (err) {
      console.error("Submission failed:", err);
      showToast("❌ Could not save your interest. Please try again.");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setConditionFilter("");
    setPriceSort("latest");
  };

  const hasActiveFilters = searchTerm || statusFilter || conditionFilter || priceSort !== "latest";

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <LoadingSpinner text="Initializing..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Animated Background */}
      <div className="fixed inset-0 animated-bg opacity-5 pointer-events-none" />

      {/* Enhanced Header */}
      <header className="glass-card sticky top-0 z-50 border-b" style={{ borderColor: 'var(--border-glass)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <FaShoppingCart className="text-white text-xl" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    MarketSpace
                  </h1>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Premium Marketplace
                  </p>
                </div>
              </button>

              {/* Navigation */}
              <nav className="hidden lg:flex items-center gap-6">
                <a href="#products" className="text-sm font-medium hover:text-blue-600 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                  Products
                </a>
                <a href="#categories" className="text-sm font-medium hover:text-blue-600 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                  Categories
                </a>
                <a href="#deals" className="text-sm font-medium hover:text-blue-600 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                  Deals
                </a>
                <a href="#about" className="text-sm font-medium hover:text-blue-600 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                  About
                </a>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              {currentUser ? (
                <AnimatedButton
                  variant="primary"
                  onClick={() => navigate("/admin")}
                  className="hidden sm:flex"
                >
                  Dashboard
                </AnimatedButton>
              ) : (
                <AnimatedButton
                  variant="primary"
                  onClick={() => navigate("/login")}
                  className="hidden sm:flex"
                >
                  <FaPlus className="mr-2" />
                  Sell Items
                </AnimatedButton>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="glass-card p-12 rounded-3xl">
            <h2 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight" style={{ color: 'var(--text-primary)' }}>
              Discover Amazing
              <span className="text-gradient block">Products</span>
            </h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Your trusted marketplace for premium products. Find unique items, great deals, 
              and connect with sellers in a secure, modern platform.
            </p>

            {/* Enhanced Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <FaSearch className="absolute left-6 top-1/2 transform -translate-y-1/2 text-xl" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search for amazing products..."
                  className="glass-input w-full pl-16 pr-6 py-4 text-lg rounded-2xl"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2" style={{ color: 'var(--accent-primary)' }}>
                  {items.length}+
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Premium Products
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2" style={{ color: 'var(--accent-primary)' }}>
                  10k+
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Happy Customers
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2" style={{ color: 'var(--accent-primary)' }}>
                  99%
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Satisfaction Rate
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="max-w-7xl mx-auto px-4 mb-8" id="products">
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Featured Products
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                {filteredItems.length} of {items.length} products
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-glass)' }}>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FaTh />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FaList />
                </button>
              </div>

              {/* Filter Toggle */}
              <AnimatedButton
                variant="secondary"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={hasActiveFilters ? 'ring-2 ring-blue-500' : ''}
              >
                <FaFilter />
                Filters
                {hasActiveFilters && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-500 text-white">
                    Active
                  </span>
                )}
              </AnimatedButton>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <FaSort style={{ color: 'var(--text-muted)' }} />
                <select
                  value={priceSort}
                  onChange={(e) => setPriceSort(e.target.value)}
                  className="glass-input py-2 px-3 text-sm min-w-[160px] rounded-lg"
                >
                  <option value="latest">Latest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-opacity-20" 
                 style={{ borderColor: 'var(--text-muted)' }}>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="glass-input py-2 px-3 text-sm w-full rounded-lg"
                >
                  <option value="">All Status</option>
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Condition
                </label>
                <select
                  value={conditionFilter}
                  onChange={(e) => setConditionFilter(e.target.value)}
                  className="glass-input py-2 px-3 text-sm w-full rounded-lg"
                >
                  <option value="">All Conditions</option>
                  <option value="new">New</option>
                  <option value="very good">Very Good</option>
                  <option value="good">Good</option>
                  <option value="used">Used</option>
                </select>
              </div>

              <div className="flex items-end">
                {hasActiveFilters && (
                  <AnimatedButton
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="w-full text-red-500"
                  >
                    Clear All Filters
                  </AnimatedButton>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Products Grid */}
      <section className="max-w-7xl mx-auto px-4 mb-16">
        {loading ? (
          <LoadingSpinner text="Loading amazing products..." />
        ) : filteredItems.length === 0 ? (
          <div className="glass-card p-12 text-center rounded-3xl">
            <div className="text-6xl mb-6">🔍</div>
            <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              No products found
            </h3>
            <p className="text-lg mb-8" style={{ color: 'var(--text-secondary)' }}>
              {items.length === 0 
                ? "We're adding amazing products soon!"
                : "Try adjusting your search or filters to find what you're looking for."
              }
            </p>
            {hasActiveFilters && (
              <AnimatedButton variant="primary" onClick={clearFilters}>
                Clear Filters
              </AnimatedButton>
            )}
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
              : "space-y-6"
          }>
            {filteredItems.map((product) => (
              <ProductCardRedesigned
                key={product.id}
                product={product}
                isInterested={interestedItems.includes(product.id)}
                pulse={pulseId === product.id}
                interestCount={
                  interestData[product.id]
                    ? Object.keys(interestData[product.id]).length
                    : 0
                }
                onHeartClick={() => {
                  setTimeout(() => setShowInterestForm(product), 400);
                  setPulseId(product.id);
                  setTimeout(() => setPulseId(null), 400);

                  setInterestedItems((prev) =>
                    prev.includes(product.id)
                      ? prev.filter((id) => id !== product.id)
                      : [...prev, product.id]
                  );
                }}
                onShowInterest={() => {
                  if (analytics)
                    logEvent(analytics, "open_interest_form", {
                      product_id: product.id,
                    });
                  setTimeout(() => setShowInterestForm(product), 400);
                }}
                onImageClick={() => {
                  if (analytics)
                    logEvent(analytics, "view_product", {
                      product_id: product.id,
                    });
                  navigate(`/product/${product.id}`);
                }}
                onTitleClick={() => {
                  if (analytics)
                    logEvent(analytics, "view_product", {
                      product_id: product.id,
                    });
                  navigate(`/product/${product.id}`);
                }}
              />
            ))}
          </div>
        )}

        {/* Interest Modal */}
        {showInterestForm && (
          <ProductInterestModal
            product={showInterestForm}
            onClose={() => setShowInterestForm(null)}
            onSubmit={handleInterestSubmit}
          />
        )}
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 mb-16">
        <div className="glass-card p-12 rounded-3xl text-center">
          <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            How It Works
          </h2>
          <p className="text-lg mb-12 max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Simple, secure, and straightforward process to get your products
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto">
                <FaHeart className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                1. Show Interest
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Browse our curated collection and click the heart on products you love. 
                No payment required upfront.
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto">
                <FaUsers className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                2. Connect Directly
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Share your contact details and we'll connect you directly with the seller 
                for personalized service.
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto">
                <FaTruck className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                3. Get Your Product
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Choose delivery or pickup options. Secure payment and fast delivery 
                ensure you get your product quickly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Why Choose MarketSpace?
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            We make buying and selling easy, safe, and convenient for everyone
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card p-6 text-center rounded-2xl">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FaShieldAlt className="text-2xl text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Safe & Secure
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              All transactions protected with advanced security measures
            </p>
          </div>

          <div className="glass-card p-6 text-center rounded-2xl">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FaHeart className="text-2xl text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Express Interest
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Show interest in items and connect directly with sellers
            </p>
          </div>

          <div className="glass-card p-6 text-center rounded-2xl">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FaTags className="text-2xl text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Best Prices
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Find great deals from trusted sellers in your area
            </p>
          </div>

          <div className="glass-card p-6 text-center rounded-2xl">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FaHeadset className="text-2xl text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              24/7 Support
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Always here to help with any questions or concerns
            </p>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="glass-card mt-16 rounded-none border-t" style={{ borderColor: 'var(--border-glass)' }}>
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <FaShoppingCart className="text-white text-xl" />
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
                    <a 
                      href="#" 
                      className="text-sm hover:text-blue-600 transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {link}
                    </a>
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
                    <a 
                      href="#" 
                      className="text-sm hover:text-blue-600 transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {link}
                    </a>
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
          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4" 
               style={{ borderColor: 'var(--border-glass)' }}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              © {new Date().getFullYear()} MarketSpace. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="hover:text-blue-600 transition-colors" style={{ color: 'var(--text-muted)' }}>
                Privacy Policy
              </a>
              <a href="#" className="hover:text-blue-600 transition-colors" style={{ color: 'var(--text-muted)' }}>
                Terms of Service
              </a>
              <a href="#" className="hover:text-blue-600 transition-colors" style={{ color: 'var(--text-muted)' }}>
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </footer>

      <FeedbackButton />
    </div>
  );
};

export default HomeRedesigned;