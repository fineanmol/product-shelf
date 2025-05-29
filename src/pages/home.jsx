// src/pages/ItemsForSale.tsx
import React, { useEffect, useState } from "react";
import { ref, push, onValue } from "firebase/database";
import { db, analytics } from "../firebase";
import ProductCard from "../components/product/ProductCard";
import ProductInterestModal from "../components/product/ProductInterestModal";
import emailjs from "emailjs-com";
import { showToast } from "../utils/showToast";
import StepsToBuy from "../components/StepsToBuy";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { logEvent } from "firebase/analytics";
import FeedbackButton from "../components/FeedbackButton";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  FaUser,
  FaShoppingCart,
  FaHeart,
  FaSearch,
  FaTags,
  FaRocket,
  FaArrowRight,
} from "react-icons/fa";

const Home = () => {
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

  /** FILTER & SORT LOGIC **/
  const filteredItems = items
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
    });

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* HERO SECTION */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white">
        {/* Navigation - Made sticky */}
        <nav className="sticky top-0 z-50 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <FaShoppingCart className="text-white text-xl" />
                </div>
                <h1 className="text-2xl font-bold">Marketplace</h1>
              </div>

              <div className="flex items-center gap-4">
                {currentUser ? (
                  <div className="flex items-center gap-4">
                    <span className="text-blue-100">
                      Welcome,{" "}
                      {currentUser.displayName?.split(" ")[0] || "User"}!
                    </span>
                    <button
                      onClick={() => navigate("/admin")}
                      className="bg-white/20 hover:bg-white/30 text-white font-medium px-6 py-2.5 rounded-lg transition-all duration-200 backdrop-blur-sm"
                    >
                      Dashboard
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => navigate("/login")}
                    className="bg-white/20 hover:bg-white/30 text-white font-medium px-6 py-2.5 rounded-lg transition-all duration-200 backdrop-blur-sm flex items-center gap-2"
                  >
                    <FaUser className="text-sm" />
                    Sell on Marketplace
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 py-16">
          {/* Hero Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Your Local <br />
                <span className="text-blue-200">Marketplace</span>
              </h2>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Browse and express interest in local products. Connect with
                sellers for a seamless marketplace experience.
              </p>

              {!currentUser && (
                <div className="space-y-4">
                  <button
                    onClick={() => navigate("/login")}
                    className="w-full sm:w-auto bg-white hover:bg-gray-100 text-blue-600 font-semibold px-8 py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 text-lg"
                  >
                    <FaRocket className="text-xl" />
                    Start Selling
                    <FaArrowRight className="text-sm" />
                  </button>
                  <p className="text-blue-200 text-sm">
                    Join our community of trusted sellers
                  </p>
                </div>
              )}
            </div>

            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold mb-6">Why Choose Us?</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-lg">Secure & Trusted Platform</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <FaHeart className="text-pink-300 text-xl" />
                    <span className="text-lg">Express Interest System</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <FaTags className="text-green-300 text-xl" />
                    <span className="text-lg">Best Prices in Market</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <FaSearch className="text-yellow-300 text-xl" />
                    <span className="text-lg">Advanced Search & Filters</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="w-full bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Find What You're Looking For
            </h3>

            {/* Row 1: Search */}
            <div className="mb-4">
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Row 2: Filters */}
            <div className="flex flex-wrap gap-4">
              <select
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
              </select>

              <select
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value)}
              >
                <option value="">All Conditions</option>
                <option value="new">New</option>
                <option value="very good">Very Good</option>
                <option value="good">Good</option>
                <option value="used">Used</option>
              </select>

              <select
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={priceSort}
                onChange={(e) => setPriceSort(e.target.value)}
              >
                <option value="latest">Sort by: Latest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* PRODUCTS SECTION */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600">Loading products...</p>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <FaSearch className="text-gray-400 text-4xl mx-auto mb-4" />
            <p className="text-gray-600 text-xl">No products found.</p>
            <p className="text-gray-500 mt-2">
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((product) => (
              <ProductCard
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
      </div>

      {/* STEPS TO BUY */}
      <div className="bg-white py-12 mt-8 border-t">
        <div className="max-w-7xl mx-auto px-4">
          <StepsToBuy />
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FaShoppingCart className="text-white" />
            </div>
            <span className="text-xl font-bold">Marketplace</span>
          </div>
          <p className="text-gray-400">
            © {new Date().getFullYear()} Marketplace. All rights reserved.
          </p>
        </div>
      </footer>

      <FeedbackButton />
    </div>
  );
};

export default Home;
