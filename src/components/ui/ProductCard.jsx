import React, { useState } from 'react';
import { FaEdit, FaTrash, FaEye, FaEyeSlash, FaHeart } from 'react-icons/fa';
import StatusBadge from './StatusBadge';
import AnimatedButton from './AnimatedButton';

const ProductCard = ({ 
  product, 
  onEdit, 
  onDelete, 
  onToggleVisibility,
  onToggleStatus,
  canEdit = true 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const formatPrice = (price, currency = 'EUR') => {
    const symbols = { EUR: '€', USD: '$', GBP: '£' };
    return `${symbols[currency] || '€'}${price}`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div 
      className={`glass-card p-6 transition-all duration-300 ${
        isHovered ? 'transform -translate-y-2' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image */}
      <div className="relative mb-4 overflow-hidden rounded-xl bg-gray-100">
        <div className="aspect-square">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <img
            src={product.image}
            alt={product.title}
            className={`w-full h-full object-cover transition-all duration-500 ${
              imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
            } ${isHovered ? 'scale-110' : ''}`}
            onLoad={handleImageLoad}
            onError={(e) => {
              e.target.src = '/api/placeholder/300/300';
              setImageLoaded(true);
            }}
          />
        </div>
        
        {/* Overlay with actions */}
        <div className={`absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center gap-2 transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          {canEdit && (
            <>
              <AnimatedButton
                variant="ghost"
                size="sm"
                onClick={() => onEdit(product)}
                className="text-white bg-white bg-opacity-20"
              >
                <FaEdit />
              </AnimatedButton>
              <AnimatedButton
                variant="ghost"
                size="sm"
                onClick={() => onToggleVisibility(product)}
                className="text-white bg-white bg-opacity-20"
              >
                {product.visible !== false ? <FaEyeSlash /> : <FaEye />}
              </AnimatedButton>
              <AnimatedButton
                variant="ghost"
                size="sm"
                onClick={() => onDelete(product)}
                className="text-white bg-red-500 bg-opacity-60"
              >
                <FaTrash />
              </AnimatedButton>
            </>
          )}
        </div>

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <StatusBadge status={product.status} visible={product.visible} />
        </div>

        {/* Favorite indicator */}
        {product.interestCount > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-red-500 text-white text-xs font-semibold">
            <FaHeart className="text-xs" />
            {product.interestCount}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-3">
        <h3 
          className="font-semibold text-lg leading-tight line-clamp-2"
          style={{ color: 'var(--text-primary)' }}
          title={product.title}
        >
          {product.title}
        </h3>

        <p 
          className="text-sm line-clamp-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          {product.description || 'No description available'}
        </p>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span 
            className="text-2xl font-bold"
            style={{ color: 'var(--accent-primary)' }}
          >
            {formatPrice(product.price, product.currency)}
          </span>
          {product.original_price && product.original_price > product.price && (
            <span 
              className="text-sm line-through"
              style={{ color: 'var(--text-muted)' }}
            >
              {formatPrice(product.original_price, product.currency)}
            </span>
          )}
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>Added {formatDate(product.timestamp)}</span>
          {product.source && (
            <span className="px-2 py-1 rounded-full bg-opacity-10" style={{ background: 'var(--accent-primary)' }}>
              {product.source}
            </span>
          )}
        </div>

        {/* Actions */}
        {canEdit && (
          <div className="flex gap-2 pt-2">
            <AnimatedButton
              variant="primary"
              size="sm"
              onClick={() => onEdit(product)}
              className="flex-1"
            >
              <FaEdit className="text-xs" />
              Edit
            </AnimatedButton>
            <AnimatedButton
              variant="secondary"
              size="sm"
              onClick={() => onToggleStatus(product)}
              className="flex-1"
            >
              {product.status === 'available' ? 'Reserve' : 'Make Available'}
            </AnimatedButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;