import React, { useState } from 'react';
import { FaSearch, FaFilter, FaTimes, FaSort } from 'react-icons/fa';
import AnimatedButton from './AnimatedButton';

const SearchAndFilter = ({ 
  searchTerm, 
  onSearchChange, 
  filters, 
  onFilterChange,
  sortBy,
  onSortChange,
  onClearFilters 
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const filterOptions = {
    status: [
      { value: '', label: 'All Status' },
      { value: 'available', label: 'Available' },
      { value: 'reserved', label: 'Reserved' },
      { value: 'sold', label: 'Sold Out' }
    ],
    condition: [
      { value: '', label: 'All Conditions' },
      { value: 'new', label: 'New' },
      { value: 'very good', label: 'Very Good' },
      { value: 'good', label: 'Good' },
      { value: 'used', label: 'Used' }
    ]
  };

  const sortOptions = [
    { value: 'latest', label: 'Latest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'title', label: 'Title A-Z' }
  ];

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className="glass-card p-6 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <FaSearch 
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-lg"
          style={{ color: 'var(--text-muted)' }}
        />
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="glass-input pl-12 pr-4"
          style={{ fontSize: '16px' }}
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-opacity-10"
            style={{ background: 'var(--bg-glass)' }}
          >
            <FaTimes style={{ color: 'var(--text-muted)' }} />
          </button>
        )}
      </div>

      {/* Filter Toggle and Sort */}
      <div className="flex items-center gap-3 flex-wrap">
        <AnimatedButton
          variant="secondary"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className={`${hasActiveFilters ? 'ring-2 ring-blue-500' : ''}`}
        >
          <FaFilter />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-blue-500 text-white">
              {Object.values(filters).filter(v => v !== '').length}
            </span>
          )}
        </AnimatedButton>

        <div className="flex items-center gap-2">
          <FaSort style={{ color: 'var(--text-muted)' }} />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="glass-input py-2 px-3 text-sm min-w-[160px]"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <AnimatedButton
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-red-500"
          >
            <FaTimes />
            Clear Filters
          </AnimatedButton>
        )}
      </div>

      {/* Expandable Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-opacity-20" 
             style={{ borderColor: 'var(--text-muted)' }}>
          {Object.entries(filterOptions).map(([key, options]) => (
            <div key={key}>
              <label 
                className="block text-sm font-medium mb-2 capitalize"
                style={{ color: 'var(--text-secondary)' }}
              >
                {key}
              </label>
              <select
                value={filters[key] || ''}
                onChange={(e) => onFilterChange(key, e.target.value)}
                className="glass-input py-2 px-3 text-sm w-full"
              >
                {options.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchAndFilter;