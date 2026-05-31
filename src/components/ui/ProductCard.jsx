import React, { useState } from 'react';
import { FaEdit, FaTrash, FaEye, FaEyeSlash, FaHeart, FaExternalLinkAlt, FaCheck } from 'react-icons/fa';
import StatusBadge from './StatusBadge';
import AnimatedButton from './AnimatedButton';

const PLACEHOLDER = '/placeholder.png';

const ProductCard = ({ 
  product, 
  onEdit, 
  onDelete, 
  onToggleVisibility,
  onToggleStatus,
  canEdit = true,
  isSuperAdmin = false,
  onAssignUser = null,
  // Bulk selection
  selected = false,
  onSelect = null,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageLoad = () => setImageLoaded(true);

  const formatPrice = (price, currency = 'EUR') => {
    const symbols = { EUR: '€', USD: '$', GBP: '£', INR: '₹' };
    return `${symbols[currency] || '€'}${price}`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const isValidUrl = (u) => {
    try { return /^https?:\/\//i.test(u); } catch { return false; }
  };

  const hasUrl = product.url && isValidUrl(product.url);
  const selectable = typeof onSelect === 'function';

  return (
    <div 
      className={`glass-card p-6 transition-all duration-300 relative ${
        isHovered ? 'transform -translate-y-2' : ''
      } ${selected ? 'ring-2 ring-brand-sky ring-offset-2' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Checkbox overlay — top-left, shown when selectable */}
      {selectable && (
        <button
          type="button"
          aria-label="Select product"
          onClick={(e) => { e.stopPropagation(); onSelect(product.id); }}
          className={`absolute top-3 left-3 z-20 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
            selected
              ? 'bg-brand-sky border-brand-sky text-white shadow-md'
              : 'bg-white/80 border-gray-300 hover:border-brand-sky'
          }`}
        >
          {selected && <FaCheck className="text-[10px]" />}
        </button>
      )}

      {/* Product Image */}
      <div className="relative mb-4 overflow-hidden rounded-xl bg-gray-100">
        <div className="aspect-square">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <img
            src={product.image || PLACEHOLDER}
            alt={product.title}
            loading="lazy"
            className={`w-full h-full object-cover transition-all duration-500 ${
              imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
            } ${isHovered ? 'scale-110' : ''}`}
            onLoad={handleImageLoad}
            onError={(e) => {
              e.target.src = PLACEHOLDER;
              setImageLoaded(true);
            }}
          />
        </div>
        
        {/* Hover overlay with actions */}
        <div className={`absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center gap-2 transition-opacity duration-300 ${
          isHovered && !selected ? 'opacity-100' : 'opacity-0'
        }`}>
          {canEdit && (
            <>
              <AnimatedButton variant="ghost" size="sm" onClick={() => onEdit(product)} className="text-white bg-white bg-opacity-20">
                <FaEdit />
              </AnimatedButton>
              <AnimatedButton variant="ghost" size="sm" onClick={() => onToggleVisibility(product)} className="text-white bg-white bg-opacity-20">
                {product.visible !== false ? <FaEyeSlash /> : <FaEye />}
              </AnimatedButton>
              <AnimatedButton variant="ghost" size="sm" onClick={() => onDelete(product)} className="text-white bg-red-500 bg-opacity-60">
                <FaTrash />
              </AnimatedButton>
            </>
          )}
        </div>

        {/* Status badge */}
        <div className="absolute top-3 left-3" style={{ marginLeft: selectable ? '28px' : '0' }}>
          <StatusBadge status={product.status} visible={product.visible} />
        </div>

        {/* Interest count */}
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

        <p className="text-sm line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
          {product.description || 'No description available'}
        </p>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>
            {formatPrice(product.price, product.currency)}
          </span>
          {product.original_price && product.original_price > product.price && (
            <span className="text-sm line-through" style={{ color: 'var(--text-muted)' }}>
              {formatPrice(product.original_price, product.currency)}
            </span>
          )}
        </div>

        {/* Metadata row */}
        <div className="flex flex-col gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          <div className="flex items-center justify-between">
            <span>Added {formatDate(product.timestamp)}</span>
            {product.source && (
              <span className="px-2 py-1 rounded-full bg-opacity-10" style={{ background: 'var(--accent-primary)' }}>
                {product.source}
              </span>
            )}
          </div>

          {isSuperAdmin && (
            <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 mt-1">
              <span className="truncate max-w-[150px]" title={product.added_email || 'System / Unassigned'}>
                Owner: <span className="font-semibold text-gray-700">{product.added_email || 'Unassigned'}</span>
              </span>
              {onAssignUser && (
                <button type="button" onClick={() => onAssignUser(product)} className="text-brand-sky hover:underline font-semibold">
                  Assign
                </button>
              )}
            </div>
          )}
        </div>

        {/* Visit link — only shown when url is a valid http(s) link */}
        {hasUrl && (
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-xs text-brand-sky hover:text-brand-navy font-medium transition-colors"
          >
            <FaExternalLinkAlt className="text-[10px]" />
            {product.source ? `View on ${product.source}` : 'Visit Website'}
          </a>
        )}

        {/* Actions */}
        {canEdit && (
          <div className="flex gap-2 pt-2">
            <AnimatedButton variant="primary" size="sm" onClick={() => onEdit(product)} className="flex-1">
              <FaEdit className="text-xs" /> Edit
            </AnimatedButton>
            <AnimatedButton variant="secondary" size="sm" onClick={() => onToggleStatus(product)} className="flex-1">
              {product.status === 'available' ? 'Reserve' : 'Make Available'}
            </AnimatedButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;