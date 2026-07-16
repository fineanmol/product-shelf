import React from "react";

// Seed list used only when the caller doesn't supply any real category
// values yet (e.g. a brand-new, empty catalog). Once products exist, the
// `categories` prop (derived from actual product data) takes over so any
// free-text category an admin enters is always filterable.
const DEFAULT_CATEGORIES = [
  { value: "Electronics", label: "Electronics" },
  { value: "Fashion", label: "Fashion & Apparel" },
  { value: "Home", label: "Home & Garden" },
  { value: "Books", label: "Books & Learning" },
  { value: "Toys", label: "Toys & Hobbies" },
  { value: "Sports", label: "Sports & Outdoors" },
  { value: "Other", label: "Other" },
];

const FilterBar = ({
  statusFilter,
  conditionFilter,
  categoryFilter,
  sortBy,
  categories,
  onStatusChange,
  onConditionChange,
  onCategoryChange,
  onSortChange,
  onClearFilters,
  hasActiveFilters,
  showClearButton = true,
}) => {
  const categoryOptions =
    categories && categories.length > 0
      ? categories.map((c) => ({ value: c, label: c }))
      : DEFAULT_CATEGORIES;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      <div>
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-sky focus:border-brand-sky hover:border-brand-sky transition-all text-sm"
        >
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="reserved">Reserved</option>
        </select>
      </div>

      <div>
        <select
          value={conditionFilter}
          onChange={(e) => onConditionChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-sky focus:border-brand-sky hover:border-brand-sky transition-all text-sm"
        >
          <option value="">All Conditions</option>
          <option value="new">New</option>
          <option value="very good">Very Good</option>
          <option value="good">Good</option>
          <option value="used">Used</option>
        </select>
      </div>

      <div>
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-sky focus:border-brand-sky hover:border-brand-sky transition-all text-sm"
        >
          <option value="">All Categories</option>
          {categoryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-sky focus:border-brand-sky hover:border-brand-sky transition-all text-sm"
        >
          <option value="latest">Latest First</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
        </select>
      </div>

      {showClearButton && hasActiveFilters && (
        <div>
          <button
            onClick={onClearFilters}
            className="w-full px-3 py-2 border-2 border-brand-coral text-brand-coral hover:bg-brand-coral hover:text-white rounded-lg transition-all font-medium shadow-sm hover:shadow-md text-sm"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterBar;


