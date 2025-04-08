import React, { useState, useEffect } from "react";

const ItemsForSale = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data from local products.json in the public folder
    const loadProducts = async () => {
      try {
        const response = await fetch("/products.json");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setItems(data);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold">Items for Sale</h1>
      <p className="font-semibold">
        Check if items are available before messaging.
      </p>
      {/* <p className="text-gray-600 mt-1">
        Current last day (might change):{" "}
        <strong>{new Date().toLocaleDateString()}</strong>
      </p> */}

      {loading ? (
        <p className="text-center text-gray-500 mt-4">Loading products...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 text-left ">
          {items.map((product, index) => (
            <div
              key={index}
              className="relative border rounded-xl p-4 shadow-lg bg-white max-w-[392px]"
            >
              <span
                className={`absolute top-4 right-4 px-2 py-1 text-xs font-bold rounded-lg ${
                  product.status === "available"
                    ? "bg-green-600 text-white"
                    : "bg-red-600 text-white"
                }`}
              >
                {product.status}
              </span>

              <div className="w-full h-48 overflow-hidden rounded flex items-center justify-center bg-white">
                <img
                  src={product.image}
                  alt={product.title}
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              <h3 className="text-lg font-semibold mt-4">{product.title}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {product.description}
              </p>

              <div className="mt-4 space-y-1">
                <p className="text-gray-500 flex justify-between items-center">
                  <span className="font-medium text-gray-700">Price:</span>
                  <span>
                    <span className="text-base font-semibold text-black">
                      {product.price}
                    </span>
                    {product.original_price && (
                      <span className="text-gray-400 line-through ml-2">
                        {product.original_price}
                      </span>
                    )}
                  </span>
                </p>

                <p className="text-gray-500 flex justify-between items-center">
                  <span className="font-medium text-gray-700">Age:</span>
                  <span>{product.age}</span>
                </p>
                <p className="text-gray-500 flex justify-between items-center">
                  <span className="font-medium text-gray-700">
                    Available From:
                  </span>
                  <span>{product.available_from}</span>
                </p>
              </div>

              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-4 text-blue-600 hover:underline"
              >
                View on {product.source} &rarr;
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ItemsForSale;
