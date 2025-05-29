// src/pages/ItemsForSale.tsx
import React, { useEffect, useState } from "react";
import { ref, push, onValue } from "firebase/database";
import { db, analytics } from "../firebase";
import ProductCard from "../components/product/ProductCard";
import ProductInterestModal from "../components/product/ProductInterestModal";
import { showToast } from "../utils/showToast";
import StepsToBuy from "../components/StepsToBuy";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { logEvent } from "firebase/analytics";
import FeedbackButton from "../components/FeedbackButton";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  FaShoppingCart,
  FaHeart,
  FaSearch,
  FaTags,
  FaShieldAlt,
  FaPlus,
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
      {/* Compact Hero with Integrated Search & Filters */}
      <Header 
        title="MarketSpace"
        subtitle="Your trusted local marketplace"
        variant="simple"
        currentUser={currentUser}
      />

      {/* Integrated Search & Filters Section */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative max-w-2xl mx-auto">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search for products..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Compact Filters Row */}
          <div className="flex flex-wrap gap-3 justify-center">
            <select
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
            </select>

            <select
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-sm"
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
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-sm"
              value={priceSort}
              onChange={(e) => setPriceSort(e.target.value)}
            >
              <option value="latest">Sort: Latest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* PRODUCTS SECTION */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {filteredItems.length > 0 
                ? `${filteredItems.length} Products Available` 
                : 'No Products Found'
              }
            </h2>
            {searchTerm && (
              <p className="text-sm text-gray-600 mt-1">
                Results for "{searchTerm}"
              </p>
            )}
          </div>
          
          {!currentUser && (
            <button
              onClick={() => navigate("/login")}
              className="hidden sm:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <FaPlus className="text-sm" />
              Sell Items
            </button>
          )}
        </div>

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

      {/* FEATURES SECTION - Moved to Footer */}
      <div className="bg-gray-50 py-16 border-t">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose MarketSpace?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We make buying and selling easy, safe, and convenient for
              everyone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaShieldAlt className="text-2xl text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Safe & Secure</h3>
              <p className="text-gray-600">
                All transactions are protected with advanced security measures
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaHeart className="text-2xl text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Express Interest</h3>
              <p className="text-gray-600">
                Show interest in items and connect directly with sellers
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaTags className="text-2xl text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Best Prices</h3>
              <p className="text-gray-600">
                Find great deals from trusted sellers in your area
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FaShoppingCart className="text-white" />
                </div>
                <span className="text-xl font-bold">MarketSpace</span>
              </div>
              <p className="text-gray-400">
                Your trusted local marketplace for buying and selling quality
                items.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <button
                    onClick={() => navigate("/")}
                    className="hover:text-white transition-colors"
                  >
                    Browse Items
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate("/login")}
                    className="hover:text-white transition-colors"
                  >
                    Start Selling
                  </button>
                </li>
                <li>
                  <span className="hover:text-white transition-colors cursor-pointer">
                    How it Works
                  </span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <span className="hover:text-white transition-colors cursor-pointer">
                    Help Center
                  </span>
                </li>
                <li>
                  <span className="hover:text-white transition-colors cursor-pointer">
                    Contact Us
                  </span>
                </li>
                <li>
                  <span className="hover:text-white transition-colors cursor-pointer">
                    Safety Tips
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>
              © {new Date().getFullYear()} MarketSpace. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <FeedbackButton />
    </div>
  );
};

export default Home;
