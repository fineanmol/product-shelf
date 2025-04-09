// src/pages/ItemsForSale.tsx
import React, { useEffect, useState } from "react";
import { ref, push, onValue } from "firebase/database";
import { db } from "../firebase";
import ProductCard from "../components/ProductCard";
import InterestFormModal from "../components/InterestFormModal";
import emailjs from "emailjs-com";
import { showToast } from "../utils/showToast";
import StepsToBuy from "../components/StepsToBuy";

const ItemsForSale = () => {
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

  useEffect(() => {
    const dbRef = ref(db, "products");
    const interestsRef = ref(db, "interests/");

    const productListener = onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const productList = Object.entries(data)
          .filter(
            ([key, value]) =>
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

      setInterestedItems((prev) => [...prev, product.id]);
      setShowInterestForm(null);
      showToast("✅ Thanks! Your interest was submitted.");
    } catch (err) {
      console.error("Submission failed:", err);
      showToast("❌ Could not save your interest. Please try again.");
    }
  };

  const filteredItems = items
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
      return 0;
    });

  return (
    <div className="min-h-screen bg-gray-50 ">
      {/* Header */}
      <header className="bg-white shadow p-4 flex justify-center items-center h-20 sticky top-0 z-50 w-full">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 text-center">
          MarketPlace
        </h1>
      </header>

      <div className="relative">
        <div className="">
          <input
            type="text"
            placeholder="Search products..."
            className="px-3 py-2 rounded border w-full mt-4 max-w-[1500px] mx-auto h-14"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className=" container mx-auto p-4">
        {/* Filters */}
        <div className="p-4 flex flex-wrap gap-4">
          <select
            className="border rounded px-3 py-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
          </select>

          <select
            className="border rounded px-3 py-2"
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
            className="border rounded px-3 py-2"
            value={priceSort}
            onChange={(e) => setPriceSort(e.target.value)}
          >
            <option value="latest">Sort by: Latest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>

        {/* Products */}
        {loading ? (
          <p className="text-center text-gray-500 mt-4">Loading products...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left items-stretch">
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
                  setTimeout(() => setShowInterestForm(product), 400);
                }}
              />
            ))}
          </div>
        )}

        {/* Interest Modal */}
        {showInterestForm && (
          <InterestFormModal
            product={showInterestForm}
            onClose={() => setShowInterestForm(null)}
            onSubmit={handleInterestSubmit}
          />
        )}

        {/* Steps to Buy */}
        <StepsToBuy />

        {/* Footer */}
        <footer className="bg-white text-center text-gray-500 text-sm py-4 mt-10">
          © 2025 Marketplace. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default ItemsForSale;
