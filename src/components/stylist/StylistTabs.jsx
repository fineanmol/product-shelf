import React from "react";

// For You / Weather / Occasion / Wardrobe tab bar for the results dashboard,
// same active-tab-underline pattern as ProductDetails.jsx's description/
// specifications/reviews tabs.
const StylistTabs = ({ tabs, activeTab, onChange }) => (
  <div className="flex border-b border-stone-200 bg-white rounded-t-xl overflow-x-auto">
    {tabs.map((tab) => (
      <button
        key={tab.key}
        onClick={() => onChange(tab.key)}
        className={`flex-1 min-w-[7rem] px-6 py-4 text-body font-medium whitespace-nowrap transition-colors ${
          activeTab === tab.key
            ? "border-b-2 border-brand-sky text-brand-sky-text"
            : "text-stone-500 hover:text-stone-700"
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export default StylistTabs;
