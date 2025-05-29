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
  const navigate = useNavigate();

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
      if (analytics) logEvent(analytics, "submit_interest", { product_id: product.id });
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header title="Welcome to Marketplace" />

      {/* SEARCH & FILTERS */}
      <div className="max-w-[80%] w-full mx-auto mt-6">
        <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-4">
          {/* Row 1: Search, brand, discount toggle */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <input
              type="text"
              placeholder="Search products..."
              className="border rounded px-3 py-2 flex-1 focus:outline-none focus:ring focus:ring-blue-100 transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Row 2: Condition, Status, Price Sort */}
          <div className="flex flex-wrap gap-4">
            <select
              className="border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-100 transition"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
            </select>

            <select
              className="border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-100 transition"
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
              className="border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-100 transition"
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

      {/* PRODUCTS SECTION */}
      <div className="max-w-[80%] w-full mx-auto mt-8 flex-1">
        {loading ? (
          <p className="text-center text-gray-500">Loading products...</p>
        ) : filteredItems.length === 0 ? (
          <p className="text-center text-gray-600 mt-6">No products found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
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
                  if (analytics) logEvent(analytics, "open_interest_form", { product_id: product.id });
                  setTimeout(() => setShowInterestForm(product), 400);
                }}
                onImageClick={() => {
                  if (analytics) logEvent(analytics, "view_product", { product_id: product.id });
                  navigate(`/product/${product.id}`);
                }}
                onTitleClick={() => {
                  if (analytics) logEvent(analytics, "view_product", { product_id: product.id });
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
      <div className="bg-white pt-6 pb-8 mt-4 shadow-inner">
        <div className="max-w-[80%] w-full mx-auto">
          <StepsToBuy />
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-white text-center text-gray-500 text-sm py-4 mt-auto">
        © {new Date().getFullYear()} Marketplace. All rights reserved.
      </footer>
    </div>
  );
};

export default Home;
