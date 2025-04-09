import React, { useEffect, useState } from "react";
import { ref, push, onValue } from "firebase/database";
import { db } from "../firebase";
import ProductCard from "../components/ProductCard";
import InterestFormModal from "../components/InterestFormModal";
import emailjs from "emailjs-com";
import { showToast } from "../utils/showToast";

const ItemsForSale = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInterestForm, setShowInterestForm] = useState(null);
  const [interestData, setInterestData] = useState({});
  const [interestedItems, setInterestedItems] = useState([]);
  const [pulseId, setPulseId] = useState(null);

  useEffect(() => {
    const dbRef = ref(db, "/");
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
          ) // exclude interests or malformed data
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

  const handleInterestSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const { name, email, phone } = Object.fromEntries(new FormData(form));
    const product = showInterestForm;

    try {
      await push(ref(db, `interests/${product.id}`), {
        name,
        email,
        phone,
        timestamp: Date.now(),
      });

      // await emailjs.send(
      //   "service_kff4yqy",
      //   "template_dt1bpdu",
      //   {
      //     name,
      //     email,
      //     message: phone,
      //     title: product.title,
      //     available_from: product.available_from,
      //     image: product.image,
      //     time: new Date().toLocaleString(),
      //   },
      //   "hjrAAqHXUVuBPn-AD"
      // );

      setInterestedItems((prev) => [...prev, product.id]);
      setShowInterestForm(null);
      showToast(
        "✅ Thanks! Your interest was submitted and a confirmation was sent."
      );
    } catch (err) {
      console.error("Email or submission failed:", err);
      showToast("❌ Could not save your interest. Please try again.");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold">Items for Sale</h1>
      <p className="font-semibold mb-4">
        Check if items are available before messaging.
      </p>

      {loading ? (
        <p className="text-center text-gray-500 mt-4">Loading products...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left items-stretch">
          {items.map((product, index) => (
            <ProductCard
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
            />
          ))}
        </div>
      )}

      {/* Interest Form */}
      {showInterestForm && (
        <InterestFormModal
          product={showInterestForm}
          onClose={() => setShowInterestForm(null)}
          onSubmit={handleInterestSubmit}
        />
      )}
    </div>
  );
};

export default ItemsForSale;
