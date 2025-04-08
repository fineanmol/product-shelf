import React, { useEffect, useState } from "react";
import { ref, push, onValue } from "firebase/database";
import { db } from "../firebase";
import { currencySymbols } from "../utils/utils";

const ItemsForSale = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInterestForm, setShowInterestForm] = useState(null); // current product
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
      // cleanup listeners when component unmounts
      productListener();
      interestListener();
    };
  }, []);

  const handleInterestSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const { name, email, phone } = Object.fromEntries(new FormData(form));

    try {
      await push(ref(db, `interests/${showInterestForm.id}`), {
        name,
        email,
        phone,
        timestamp: Date.now(),
      });

      setInterestedItems((prev) => [...prev, showInterestForm.id]);
      setShowInterestForm(null);
    } catch (err) {
      alert("Could not save your interest.");
      console.error(err);
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
            <div
              key={index}
              className="relative border rounded-xl p-4 shadow-lg bg-white max-w-[392px]"
            >
              {/* Status badge */}
              <div className="absolute -top-[3px] -left-[1px] z-10">
                <span
                  className={` text-white px-3 py-1 rounded-tl-md rounded-br-md text-xs font-bold shadow-sm ${
                    product.status === "available"
                      ? "bg-green-600"
                      : "bg-red-600"
                  }`}
                >
                  {product.status?.toUpperCase()}
                </span>
              </div>

              {/* Interested heart */}
              <div className="absolute top-2 right-2 z-10">
                <button
                  onClick={() => {
                    setTimeout(() => setShowInterestForm(product), 400);
                    setPulseId(product.id);
                    setTimeout(() => setPulseId(null), 400);

                    setInterestedItems((prev) =>
                      prev.includes(product.id)
                        ? prev.filter((id) => id !== product.id)
                        : [...prev, product.id]
                    );
                  }}
                  className="absolute top-2 right-2 transition-transform duration-300 transform hover:scale-110"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 64 64"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`w-6 h-6 stroke-[3] transition-all ${
                      interestedItems.includes(product.id)
                        ? "fill-red-500 stroke-red-500"
                        : "fill-none stroke-gray-400"
                    } ${pulseId === product.id ? "heart-pulse" : ""}`}
                  >
                    <path d="M9.06,25C7.68,17.3,12.78,10.63,20.73,10c7-.55,10.47,7.93,11.17,9.55a.13.13,0,0,0,.25,0c3.25-8.91,9.17-9.29,11.25-9.5C49,9.45,56.51,13.78,55,23.87c-2.16,14-23.12,29.81-23.12,29.81S11.79,40.05,9.06,25Z" />
                  </svg>
                </button>
              </div>
              {/* 3D Hover Image */}
              <div className="w-full h-48 overflow-hidden rounded flex items-center justify-center bg-white transform transition-transform duration-300 hover:scale-105 hover:rotate-1">
                <img
                  src={product.image}
                  alt={product.title}
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              <h4 className="text-lg font-semibold mt-4 line-clamp-2">
                {product.title}
              </h4>
              <p className="text-sm text-gray-500 mt-1 line-clamp-3">
                {product.description}
              </p>

              <div className="mt-4 space-y-1">
                <p className="text-gray-500 flex justify-between items-center">
                  <span className="font-normal text-gray-700">Price:</span>
                  <span>
                    <span className="text-base font-semibold text-black">
                      {product.price} {currencySymbols[product.currency]}
                    </span>
                    {product.original_price && (
                      <span className="text-gray-400 line-through ml-2">
                        {product.original_price}{" "}
                        {currencySymbols[product.currency]}
                      </span>
                    )}
                  </span>
                </p>

                <p className="text-gray-500 flex justify-between items-center">
                  <span className="font-normal text-gray-700">Age:</span>
                  <span className="text-black">{product.age}</span>
                </p>
                <p className="text-gray-500 flex justify-between items-center">
                  <span className="font-normal text-gray-700">
                    Available From:
                  </span>
                  <span className="text-black">{product.available_from}</span>
                </p>

                {/* Show interest count */}
                {/* {interestData[product.id] && (
                  <p className="text-sm text-gray-500 italic">
                    {Object.keys(interestData[product.id]).length} interested
                  </p>
                )} */}
              </div>

              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-4 text-blue-600 hover:underline"
              >
                View on {product.source} &rarr;
              </a>
              {/* Delivery Modes */}
              {Array.isArray(product.delivery_options) &&
                product.delivery_options.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {product.delivery_options.map((option) => (
                      <span
                        key={option}
                        className="bg-gray-100 text-sm text-black px-3 py-1 rounded-full flex items-center gap-2"
                      >
                        <img
                          src="https://w7.pngwing.com/pngs/496/818/png-transparent-check-circle-heroicons-solid-icon.png"
                          alt="Checkmark"
                          className="w-4 h-4"
                        />
                        {option}
                      </span>
                    ))}
                  </div>
                )}

              <hr className="my-3 border-gray-200" />

              {interestData[product.id] && (
                <p className="text-sm text-gray-500 italic">
                  {Object.keys(interestData[product.id]).length} interested
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Interest Form */}
      {showInterestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
              onClick={() => setShowInterestForm(null)}
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-2">
              Interested in {showInterestForm.title}?
            </h2>
            <form onSubmit={handleInterestSubmit} className="space-y-3">
              <input
                required
                name="name"
                placeholder="Your Name"
                minLength={2}
                className="w-full p-2 border rounded"
              />
              <input
                required
                name="email"
                type="email"
                placeholder="Email"
                className="w-full p-2 border rounded"
              />
              <input
                required
                name="phone"
                placeholder="Phone Number"
                pattern="^\+?\d{7,15}$"
                title="Enter a valid phone number"
                className="w-full p-2 border rounded"
              />
              <button
                type="submit"
                className="bg-red-600 text-white w-full py-2 rounded hover:bg-red-700"
              >
                Submit Interest
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemsForSale;
