// src/components/ProductCard.jsx
import React from "react";
import { currencySymbols, getConditionLabel } from "../utils/utils";

const ProductCard = ({
  product,
  isInterested,
  pulse,
  onHeartClick,
  onShowInterest,
  interestCount,
}) => {
  return (
    <div className="relative border rounded-xl p-4 shadow-lg bg-white max-w-[392px]">
      {/* Status Badge */}
      <div className="absolute -top-[3px] -left-[1px] z-10">
        <span
          className={`text-white px-3 py-1 rounded-tl-md rounded-br-md text-xs font-bold shadow-sm ${
            product.status === "available" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {product.status?.toUpperCase()}
        </span>
      </div>

      {/* Interested Heart */}
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={onHeartClick}
          className="absolute top-2 right-2 transition-transform duration-300 transform hover:scale-110"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 64 64"
            xmlns="http://www.w3.org/2000/svg"
            className={`w-6 h-6 stroke-[3] transition-all ${
              isInterested
                ? "fill-red-500 stroke-red-500"
                : "fill-none stroke-gray-400"
            } ${pulse ? "heart-pulse" : ""}`}
          >
            <path d="M9.06,25C7.68,17.3,12.78,10.63,20.73,10c7-.55,10.47,7.93,11.17,9.55a.13.13,0,0,0,.25,0c3.25-8.91,9.17-9.29,11.25-9.5C49,9.45,56.51,13.78,55,23.87c-2.16,14-23.12,29.81-23.12,29.81S11.79,40.05,9.06,25Z" />
          </svg>
        </button>
      </div>

      {/* Image */}
      {/* Image with 3D zoom and shadow effect */}
      <div
        className="w-full flex items-center justify-center bg-white"
        style={{
          perspective: "1200px",
          height: "192px",
          padding: "2rem",
          minHeight: "200px",
        }}
      >
        <div className="relative">
          <img
            src={product.image}
            alt={product.title}
            className="transition-transform duration-500 ease-in-out transform-gpu object-contain max-w-full max-h-48 hover:scale-110 hover:-rotate-x-2 hover:rotate-y-2 hover:translate-z-10"
          />
          {/* Shadow/Reflection */}
          <div
            className="absolute inset-x-0 bottom-0 h-5 mx-auto rounded-full blur-sm opacity-30 bg-black"
            style={{
              width: "80%",
              filter: "blur(8px)",
              transform: "translateY(100%) scale(0.8)",
            }}
          />
        </div>
      </div>

      {/* Details */}
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
                {product.original_price} {currencySymbols[product.currency]}
              </span>
            )}
          </span>
        </p>
        <p className="text-gray-500 flex justify-between items-center">
          <span className="font-normal text-gray-700">Condition:</span>
          <span className="text-black">{getConditionLabel(product.age)}</span>
        </p>

        <p className="text-gray-500 flex justify-between items-center">
          <span className="font-normal text-gray-700">Available From:</span>
          <span className="text-black">{product.available_from}</span>
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
                  alt="✓"
                  className="w-4 h-4"
                />
                {option}
              </span>
            ))}
          </div>
        )}

      {/* Interest count */}
      {interestCount !== undefined && (
        <p className="text-sm text-gray-500 italic mt-2">
          {interestCount} interested
        </p>
      )}
    </div>
  );
};

export default ProductCard;
