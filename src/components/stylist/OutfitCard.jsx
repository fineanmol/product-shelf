import React, { useState } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import TryOnButton from "./TryOnButton";
import { currencySymbols } from "../../utils/utils";

// Budget-aware outfit card: product thumbnails + running total (borrowed
// from the TanishaJain22 reference's budget-aware card pattern) + a short
// Gemini-generated rationale ("why this outfit") + optional try-on, matching
// product-shelf's existing card conventions (rounded-xl, shadow-soft, brand
// tokens) rather than the original repo's actual CSS.
const OutfitCard = ({ outfit, products, userPhotoUrl, onSave, isSaved }) => {
  const [tryOnImage, setTryOnImage] = useState(null);

  const items = outfit.productIds
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean);
  const total = items.reduce((sum, item) => sum + (item.price || 0), 0);
  const currency = items[0]?.currency || "EUR";

  return (
    <div className="bg-white border border-stone-200 rounded-xl shadow-soft hover:shadow-soft-md transition-shadow overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-title text-brand-navy">{outfit.title}</h3>
          {onSave && (
            <button
              onClick={() => onSave(outfit)}
              aria-label={isSaved ? "Remove from saved boards" : "Save this outfit"}
              aria-pressed={isSaved}
              className={`shrink-0 transition-colors ${isSaved ? "text-brand-coral" : "text-stone-400 hover:text-brand-coral"}`}
            >
              {isSaved ? <FaHeart /> : <FaRegHeart />}
            </button>
          )}
        </div>

        {tryOnImage ? (
          <div className="aspect-square bg-stone-50 rounded-lg overflow-hidden mb-4">
            <img src={tryOnImage} alt={`${outfit.title} try-on result`} className="w-full h-full object-contain" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {items.map((item) => (
              <div key={item.id} className="aspect-square bg-stone-50 rounded-lg overflow-hidden">
                <img src={item.image} alt={item.title} className="w-full h-full object-contain" />
              </div>
            ))}
          </div>
        )}

        <p className="text-body text-stone-700 mb-3 italic">"{outfit.rationale}"</p>

        <div className="flex items-center justify-between mb-4">
          <span className="text-caption text-stone-500">
            {items.length} item{items.length !== 1 ? "s" : ""}
          </span>
          <span className="text-title text-brand-navy font-semibold">
            {currencySymbols[currency] || "€"}{total.toFixed(2)}
          </span>
        </div>

        {userPhotoUrl && items[0]?.image && !tryOnImage && (
          <TryOnButton
            userPhotoUrl={userPhotoUrl}
            garmentImageUrl={items[0].image}
            onResult={setTryOnImage}
          />
        )}
      </div>
    </div>
  );
};

export default OutfitCard;
