import React from "react";

const FilterBar = ({
  statusFilter,
  conditionFilter,
  sortBy,
  onStatusChange,
  onConditionChange,
  onSortChange,
  onClearFilters,
  hasActiveFilters,
  showClearButton = true,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      <div>
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-sky focus:border-brand-sky hover:border-brand-sky transition-all"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-sky focus:border-brand-sky hover:border-brand-sky transition-all"
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
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-sky focus:border-brand-sky hover:border-brand-sky transition-all"
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
            className="w-full px-3 py-2 border-2 border-brand-coral text-brand-coral hover:bg-brand-coral hover:text-white rounded-lg transition-all font-medium shadow-sm hover:shadow-md"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterBar;

