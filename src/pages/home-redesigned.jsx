import React, { useEffect, useState, useMemo } from "react";
import { ref, push, onValue, limitToLast, query } from "firebase/database";
import { db, analytics } from "../firebase";
import ProductCardRedesigned from "../components/product/ProductCardRedesigned";
import ProductInterestModal from "../components/product/ProductInterestModal";
import { showToast } from "../utils/showToast";
import { useNavigate } from "react-router-dom";
import { logEvent } from "firebase/analytics";
import FeedbackButton from "../components/FeedbackButton";
import StepsToBuy from "../components/StepsToBuy";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { FaSearch, FaFilter, FaPlus } from "react-icons/fa";
import PageHeader from "../components/shared/PageHeader";
import FilterBar from "../components/shared/FilterBar";

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
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Optimized: Only fetch last 100 products initially
    const productsQuery = query(ref(db, "products"), limitToLast(100));

    const productListener = onValue(productsQuery, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const productList = Object.entries(data)
          .filter(
            ([, value]) => value && typeof value === "object" && value.title
          )
          .map(([id, item]) => ({ id, ...item }))
          .filter((p) => p.visible !== false);
        setItems(productList);
      }
      setLoading(false);
    });

    // Don't fetch all interests upfront - only when needed
    const interestsRef = ref(db, "interests");
    const interestListener = onValue(interestsRef, (snapshot) => {
      if (snapshot.exists()) {
        setInterestData(snapshot.val());
      }
    });

    if (analytics) logEvent(analytics, "view_home");

    return () => {
      productListener();
      interestListener();
    };
  }, []);

  const filteredItems = useMemo(() => {
    return items
      .filter((item) =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter((item) => (statusFilter ? item.status === statusFilter : true))
      .filter((item) =>
        conditionFilter ? item.condition === conditionFilter : true
      )
      .sort((a, b) => {
        if (priceSort === "price-low") return a.price - b.price;
        if (priceSort === "price-high") return b.price - a.price;
        return (b.timestamp || 0) - (a.timestamp || 0);
      });
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

  const hasActiveFilters =
    searchTerm || statusFilter || conditionFilter || priceSort !== "latest";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-sky border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Search - Using Reusable Component */}
      <PageHeader
        siteName="SkyMarket"
        searchValue={searchTerm}
        onSearchChange={(e) => setSearchTerm(e.target.value)}
        searchPlaceholder="Search products..."
        currentUser={currentUser}
        rightActions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors font-medium shadow-sm ${
                hasActiveFilters
                  ? "bg-brand-sky text-white border-brand-sky"
                  : "bg-white text-gray-700 border-gray-300 hover:border-brand-sky hover:text-brand-sky"
              }`}
            >
              <FaFilter className="text-sm" />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters && (
                <span className="bg-white text-brand-sky rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  !
                </span>
              )}
            </button>

            {currentUser ? (
              <button
                onClick={() => navigate("/admin")}
                className="hidden sm:flex items-center gap-2 bg-brand-sky hover:bg-brand-mint text-white px-4 py-2.5 rounded-lg transition-colors font-medium shadow-sm"
              >
                Dashboard
              </button>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="hidden sm:flex items-center gap-2 bg-brand-sky hover:bg-brand-mint text-white px-4 py-2.5 rounded-lg transition-colors font-medium shadow-sm"
              >
                <FaPlus className="text-sm" />
                Sell
              </button>
            )}
          </div>
        }
      />

      {/* Expandable Filters - Using Reusable Component */}
      {showFilters && (
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <FilterBar
              statusFilter={statusFilter}
              conditionFilter={conditionFilter}
              sortBy={priceSort}
              onStatusChange={setStatusFilter}
              onConditionChange={setConditionFilter}
              onSortChange={setPriceSort}
              onClearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters}
            />
          </div>
        </div>
      )}

      {/* Products Grid */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-gray-600">
            {filteredItems.length}{" "}
            {filteredItems.length === 1 ? "product" : "products"}
          </p>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <FaSearch className="text-gray-400 text-5xl mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No products found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                  setPulseId(product.id);
                  setInterestedItems((prev) =>
                    prev.includes(product.id)
                      ? prev.filter((id) => id !== product.id)
                      : [...prev, product.id]
                  );
                  // Delay opening modal to show animation
                  setTimeout(() => {
                    setPulseId(null);
                    setShowInterestForm(product);
                  }, 800);
                }}
                onShowInterest={() => {
                  if (analytics)
                    logEvent(analytics, "open_interest_form", {
                      product_id: product.id,
                    });
                  setShowInterestForm(product);
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
      </main>

      {/* Interest Modal */}
      {showInterestForm && (
        <ProductInterestModal
          product={showInterestForm}
          onSubmit={handleInterestSubmit}
          onClose={() => setShowInterestForm(null)}
        />
      )}

      {/* Steps to Buy Section */}
      <StepsToBuy />

      <FeedbackButton />
    </div>
  );
};

export default HomeRedesigned;
