import React from "react";
import { currencySymbols, getConditionLabel } from "../utils/utils";
import HowItWorksHint from "./hint/HowItWorksHint";
import { FaTruck, FaMapMarkerAlt } from "react-icons/fa";
import { PiLinkSimpleBold } from "react-icons/pi";
import { BsSuitHeartFill } from "react-icons/bs";

const ProductCard = ({
  product,
  isInterested,
  pulse,
  onHeartClick,
  onShowInterest,
  interestCount,
}) => {
  return (
    <div className="relative border rounded-2xl p-4 shadow-xl bg-white max-w-sm">
      {/* Status Badge */}
      <div className="absolute top-2 left-2 z-10">
        <span
          className={`text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
            product.status === "available" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {product.status?.charAt(0).toUpperCase() + product.status?.slice(1)}
        </span>
      </div>

      {/* Heart Icon */}
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

      {/* Title & Description */}
      <h4 className="text-lg font-semibold mt-2 line-clamp-2">
        {product.title}
      </h4>
      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
        {product.description}
      </p>

      {/* Price */}
      <div className="mt-2">
        <span className="text-xl font-bold text-black">
          {currencySymbols[product.currency]}
          {product.price}
        </span>
        {product.original_price && (
          <span className="text-gray-400 line-through ml-2">
            {currencySymbols[product.currency]}
            {product.original_price}
          </span>
        )}
      </div>

      {/* Tags: Condition, Delivery Options */}
      <div className="flex flex-wrap gap-2 mt-4 text-sm">
        {product.age && (
          <span className="bg-gray-100 px-3 py-1 rounded-full">
            {getConditionLabel(product.age)}
          </span>
        )}
        {product.delivery_options?.includes("Shipping") && (
          <span className="bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1">
            <FaTruck className="text-gray-500" /> Shipping
          </span>
        )}
        {product.delivery_options?.includes("Pick Up") && (
          <span className="bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1">
            <FaMapMarkerAlt className="text-gray-500" /> Pickup
          </span>
        )}
      </div>

      <div className="flex justify-between items-center mt-4 text-sm">
        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 flex items-center gap-1 hover:underline"
        >
          <PiLinkSimpleBold /> View on {product.source}
        </a>
        <span className="flex items-center gap-1 text-gray-700">
          <BsSuitHeartFill className="text-red-500 text-sm" />
          {interestCount || 0} interested
        </span>
      </div>

      <button
        onClick={onShowInterest}
        className="mt-4 w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition"
      >
        Interested to Buy
      </button>

      <p className="text-center text-xs text-gray-400 mt-2">
        No payment now. You'll be contacted to confirm.
      </p>

      <HowItWorksHint />
    </div>
  );
};

export default ProductCard;
