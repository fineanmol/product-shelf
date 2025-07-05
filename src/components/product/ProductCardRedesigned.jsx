import React, { useState } from 'react';
import { FaHeart, FaEye, FaShare, FaTruck, FaStore, FaTag, FaStar, FaRegStar } from 'react-icons/fa';
import { currencySymbols, getConditionLabel } from '../../utils/utils';
import AnimatedButton from '../ui/AnimatedButton';

const ProductCardRedesigned = ({
  product,
  isInterested,
  pulse,
  onHeartClick,
  onShowInterest,
  interestCount,
  onImageClick,
  onTitleClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Helper to return a random integer between min and max (inclusive)
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  const isSoldOut = product.sold_out === true;

  const getStatusConfig = () => {
    if (isSoldOut) {
      return {
        label: "SOLD OUT",
        className: "bg-red-600 text-white"
      };
    }
    
    if (product.status === "available") {
      return {
        label: "Available",
        className: "bg-green-500 text-white"
      };
    } else if (product.status === "reserved") {
      return {
        label: "Reserved",
        className: "bg-orange-500 text-white"
      };
    }
    
    return {
      label: "Available",
      className: "bg-green-500 text-white"
    };
  };

  const statusConfig = getStatusConfig();

  const formatPrice = () => {
    if (product.price === 0) {
      return (
        <span className="text-2xl font-bold text-green-600">Free</span>
      );
    }
    return (
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>
          {currencySymbols[product.currency] || '€'}{product.price}
        </span>
        {product.original_price && product.original_price > product.price && (
          <span className="text-sm line-through" style={{ color: 'var(--text-muted)' }}>
            {currencySymbols[product.currency] || '€'}{product.original_price}
          </span>
        )}
      </div>
    );
  };

  const calculateDiscount = () => {
    if (product.original_price && product.price && product.original_price > product.price) {
      return Math.round(((product.original_price - product.price) / product.original_price) * 100);
    }
    return 0;
  };

  const displayedVisitors = typeof product.visitors === "number" && product.visitors > 0
    ? product.visitors
    : getRandomInt(1200, 5000);

  const mockRating = 4.2 + Math.random() * 0.6; // Random rating between 4.2-4.8

  return (
    <div 
      className={`glass-card p-0 overflow-hidden transition-all duration-500 cursor-pointer group ${
        isHovered ? 'transform -translate-y-3 shadow-strong' : ''
      } ${isSoldOut ? 'opacity-75' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ borderRadius: 'var(--border-radius-lg)' }}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden" style={{ borderRadius: 'var(--border-radius) var(--border-radius) 0 0' }}>
        <div className="aspect-square bg-gray-100 relative">
          {/* Loading skeleton */}
          {!imageLoaded && (
            <div className="absolute inset-0 skeleton" />
          )}
          
          <img
            src={product.image}
            alt={product.title}
            className={`w-full h-full object-cover transition-all duration-700 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            } ${isHovered ? 'scale-110' : 'scale-100'}`}
            onLoad={() => setImageLoaded(true)}
            onClick={onImageClick}
            onError={(e) => {
              e.target.src = '/api/placeholder/400/400';
              setImageLoaded(true);
            }}
          />

          {/* Overlay with gradient */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`} />

          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg ${statusConfig.className}`}>
              {statusConfig.label}
            </span>
          </div>

          {/* Discount Badge */}
          {calculateDiscount() > 0 && (
            <div className="absolute top-3 right-3">
              <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                -{calculateDiscount()}% OFF
              </span>
            </div>
          )}

          {/* Heart Button */}
          <div className="absolute top-3 right-3" style={{ marginTop: calculateDiscount() > 0 ? '32px' : '0' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onHeartClick();
              }}
              className={`w-10 h-10 rounded-full backdrop-blur-md transition-all duration-300 flex items-center justify-center ${
                isInterested
                  ? 'bg-red-500 text-white scale-110'
                  : 'bg-white/20 text-white hover:bg-white/30 hover:scale-110'
              } ${pulse ? 'animate-pulse' : ''}`}
              disabled={isSoldOut}
            >
              <FaHeart className={`transition-all duration-300 ${isInterested ? 'scale-110' : ''}`} />
            </button>
          </div>

          {/* Quick Actions (visible on hover) */}
          <div className={`absolute bottom-3 left-3 right-3 flex gap-2 transition-all duration-300 ${
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Share functionality
              }}
              className="flex-1 bg-white/20 backdrop-blur-md text-white py-2 px-3 rounded-lg hover:bg-white/30 transition-all text-sm font-medium flex items-center justify-center gap-1"
            >
              <FaShare className="text-xs" />
              Share
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onImageClick();
              }}
              className="flex-1 bg-white/20 backdrop-blur-md text-white py-2 px-3 rounded-lg hover:bg-white/30 transition-all text-sm font-medium flex items-center justify-center gap-1"
            >
              <FaEye className="text-xs" />
              View
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Title and Rating */}
        <div>
          <h3 
            className="font-semibold text-lg leading-tight line-clamp-2 mb-2 cursor-pointer hover:text-blue-600 transition-colors"
            style={{ color: 'var(--text-primary)' }}
            onClick={onTitleClick}
            title={product.title}
          >
            {product.title}
          </h3>
          
          {/* Rating */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star}>
                  {star <= Math.floor(mockRating) ? (
                    <FaStar className="text-yellow-400 text-sm" />
                  ) : (
                    <FaRegStar className="text-gray-300 text-sm" />
                  )}
                </span>
              ))}
            </div>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              ({mockRating.toFixed(1)})
            </span>
          </div>

          <p 
            className="text-sm line-clamp-2 leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            {product.description || 'High-quality product with excellent features and great value for money.'}
          </p>
        </div>

        {/* Price */}
        <div className="space-y-2">
          {formatPrice()}
          {calculateDiscount() > 0 && (
            <div className="text-sm font-medium text-green-600">
              Save {currencySymbols[product.currency] || '€'}{(product.original_price - product.price).toFixed(2)}
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {product.age && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
              {getConditionLabel(product.age)}
            </span>
          )}
          
          {product.delivery_options?.includes("Shipping") && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200 flex items-center gap-1">
              <FaTruck className="text-xs" />
              Shipping
            </span>
          )}
          
          {product.delivery_options?.includes("Pick Up") && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200 flex items-center gap-1">
              <FaStore className="text-xs" />
              Pickup
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <FaEye />
              {displayedVisitors.toLocaleString()}
            </span>
            {interestCount > 0 && (
              <span className="flex items-center gap-1 text-red-500">
                <FaHeart />
                {interestCount}
              </span>
            )}
          </div>
          
          {product.source && (
            <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
              {product.source}
            </span>
          )}
        </div>

        {/* Action Button */}
        <AnimatedButton
          variant={isSoldOut ? "secondary" : "primary"}
          size="md"
          onClick={(e) => {
            e.stopPropagation();
            if (!isSoldOut) {
              onShowInterest();
            }
          }}
          disabled={isSoldOut}
          className="w-full"
        >
          {isSoldOut ? "Sold Out" : "I'm Interested"}
        </AnimatedButton>

        {/* Additional Info */}
        <div className="text-center">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            No payment required • Contact seller directly
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductCardRedesigned;