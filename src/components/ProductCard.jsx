// src/components/ProductCard.jsx

import React from "react";
import { currencySymbols, getConditionLabel } from "../utils/utils";
import HowItWorksHint from "./hint/HowItWorksHint";
import { FaTruck, FaMapMarkerAlt, FaEye } from "react-icons/fa";
import { PiLinkSimpleBold } from "react-icons/pi";
import { BsSuitHeartFill } from "react-icons/bs";

// Helper to return a random integer between min and max (inclusive)
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const ProductCard = ({
  product,
  isInterested,
  pulse,
  onHeartClick,
  onShowInterest,
  interestCount,
}) => {
  const statusColors = {
    available: "bg-green-500",
    reserved: "bg-red-500",
    unknown: "bg-gray-500",
    soldOut: "bg-gray-600",
  };

  // If "sold_out" is true in the DB
  const isSoldOut = product.sold_out === true;

  let statusLabel = "Status";
  let badgeColor = statusColors["unknown"];

  if (isSoldOut) {
    statusLabel = "SOLD OUT";
    badgeColor = statusColors["soldOut"];
  } else {
    if (product.status === "available") {
      statusLabel = "Available";
      badgeColor = statusColors["available"];
    } else if (product.status === "reserved") {
      statusLabel = "Reserved";
      badgeColor = statusColors["reserved"];
    }
  }

  const conditionTag = (age) => (
    <span className="px-3 py-1 rounded-full border text-xs font-medium flex items-center gap-1 bg-blue-50 border-blue-100 text-blue-600">
      {getConditionLabel(age)}
    </span>
  );

  const shippingTag = (
    <span
      title="+ Shipping from 4.89 €"
      className="px-3 py-1 rounded-full border text-xs font-medium flex items-center gap-1 bg-green-50 border-green-100 text-green-600"
    >
      <FaTruck className="text-green-500" /> Shipping
    </span>
  );

  const pickupTag = (
    <span
      title="Pickup from 10317, Berlin"
      className="px-3 py-1 rounded-full border text-xs font-medium flex items-center gap-1 bg-orange-50 border-orange-100 text-orange-600"
    >
      <FaMapMarkerAlt className="text-orange-500" /> Pickup
    </span>
  );

  // Determine displayed visitor count
  // If product.visitors is a positive number, use it; otherwise generate a random large number.
  const displayedVisitors =
    typeof product.visitors === "number" && product.visitors > 0
      ? product.visitors
      : getRandomInt(5000, 15000);

  // Price display (check if price == 0 => "Freebie / Giveaway")
  const renderPrice = () => {
    if (product.price === 0) {
      return (
        <span className="text-xl font-bold text-green-600">
          Freebie / Giveaway
        </span>
      );
    }
    return (
      <>
        <span className="text-xl font-bold text-green-900">
          {currencySymbols[product.currency]}
          {product.price}
        </span>
        {product.original_price && (
          <span className="text-gray-500 line-through ml-2">
            {currencySymbols[product.currency]}
            {product.original_price}
          </span>
        )}
        {product.discount && (
          <span className="text-red-500 ml-2 text-md">
            -{product.discount}% OFF
          </span>
        )}
      </>
    );
  };

  return (
    <div
      className="
        relative border rounded-2xl p-4 bg-white max-w-sm
        shadow-xl transition-transform transform
      "
    >
      {/* Status Badge */}
      <div className="absolute top-2 left-2 z-10">
        <span
          className={`text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${badgeColor}`}
        >
          {statusLabel}
        </span>
      </div>

      {/* Heart Icon */}
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={onHeartClick}
          className="transition-transform duration-300 transform hover:scale-110"
          title="Add to Favorites"
          disabled={isSoldOut}
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
      <div
        className="w-full flex items-center justify-center bg-white mb-2"
        style={{
          perspective: "1200px",
          minHeight: "200px",
        }}
      >
        <div className="relative p-2">
          <img
            src={product.image}
            alt={product.title}
            className="
              transition-transform duration-500 ease-in-out transform-gpu
              object-contain max-w-full max-h-48
              hover:scale-110 hover:-rotate-x-2 hover:rotate-y-2 hover:translate-z-10
            "
          />
          {/* 3D-ish Shadow/Reflection */}
          <div
            className="absolute inset-x-0 bottom-0 h-5 mx-auto bg-black rounded-full opacity-30"
            style={{
              width: "80%",
              filter: "blur(8px)",
              transform: "translateY(100%) scale(0.8)",
            }}
          />
        </div>
      </div>

      {/* Title & Description */}
      <h4 className="text-lg text-left font-semibold line-clamp-2 text-gray-800">
        {product.title}
      </h4>
      <p className="text-sm text-gray-500 text-left line-clamp-2 mt-1">
        {product.description}
      </p>

      <div className="mt-3">{renderPrice()}</div>

      {/* Condition & Delivery */}
      <div className="flex flex-wrap gap-2 mt-4">
        {product.age && conditionTag(product.age)}
        {product.delivery_options?.includes("Shipping") && shippingTag}
        {product.delivery_options?.includes("Pick Up") && pickupTag}
      </div>

      {/* Link / Visitors / Interested */}

      <div className="flex justify-between items-center mt-3 text-sm">
        {/* Visitors (actual or random large number) */}
        <div className="flex items-center gap-1 text-gray-700">
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 flex items-center gap-1 hover:underline"
          >
            <PiLinkSimpleBold /> View on {product.source}
          </a>
        </div>

        {/* Interested */}
        {interestCount > 0 && (
          <span className="flex items-center gap-1 text-gray-700">
            <BsSuitHeartFill className="text-red-500 text-sm" />
            {interestCount || 0} interested
          </span>
        )}
      </div>

      {/* Interested to Buy Button */}
      <button
        onClick={onShowInterest}
        className="
          mt-4 w-full bg-blue-600 text-white py-2 rounded-xl
          hover:bg-blue-700 transition-colors
          focus:outline-none focus:ring-2 focus:ring-blue-400
          disabled:opacity-70 disabled:cursor-not-allowed
        "
        disabled={isSoldOut}
      >
        {isSoldOut ? "Sold Out" : "Interested to Buy"}
      </button>
      <p className="text-center text-xs text-gray-400 mt-2">
        No payment now. You'll be contacted to confirm.
      </p>
      <div className="flex justify-between items-center mt-3 text-sm">
        {/* Visitors (actual or random large number) */}
        <div className="flex items-center gap-1 text-gray-700">
          <FaEye className="text-gray-500" />
          {displayedVisitors}
        </div>

        {/* Interested */}
        <span className="flex items-center gap-1 text-gray-700">
          <HowItWorksHint />
        </span>
      </div>
    </div>
  );
};

export default ProductCard;
