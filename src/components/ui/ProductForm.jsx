import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaImage, FaEye } from 'react-icons/fa';
import AnimatedButton from './AnimatedButton';
import GlassModal from './GlassModal';
import StatusBadge from './StatusBadge';

const ProductForm = ({ 
  product = null, 
  isOpen, 
  onClose, 
  onSave, 
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    original_price: '',
    currency: 'EUR',
    status: 'available',
    visible: true,
    image: '',
    source: '',
    condition: 'new',
    delivery_options: ['pickup', 'shipping']
  });

  const [errors, setErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        title: product.title || '',
        description: product.description || '',
        price: product.price || '',
        original_price: product.original_price || '',
        currency: product.currency || 'EUR',
        status: product.status || 'available',
        visible: product.visible !== false,
        image: product.image || '',
        source: product.source || '',
        condition: product.condition || 'new',
        delivery_options: product.delivery_options || ['pickup', 'shipping']
      });
    } else {
      setFormData({
        title: '',
        description: '',
        price: '',
        original_price: '',
        currency: 'EUR',
        status: 'available',
        visible: true,
        image: '',
        source: '',
        condition: 'new',
        delivery_options: ['pickup', 'shipping']
      });
    }
    setErrors({});
  }, [product, isOpen]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleDeliveryOptionChange = (option, checked) => {
    setFormData(prev => ({
      ...prev,
      delivery_options: checked 
        ? [...prev.delivery_options, option]
        : prev.delivery_options.filter(opt => opt !== option)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Valid price is required';
    }
    
    if (!formData.image.trim()) {
      newErrors.image = 'Image URL is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    await onSave(formData);
  };

  const currencyOptions = [
    { value: 'EUR', label: '€ Euro' },
    { value: 'USD', label: '$ US Dollar' },
    { value: 'GBP', label: '£ British Pound' }
  ];

  const conditionOptions = [
    { value: 'new', label: 'New' },
    { value: 'very good', label: 'Very Good' },
    { value: 'good', label: 'Good' },
    { value: 'used', label: 'Used' }
  ];

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Edit Product' : 'Add New Product'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Basic Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Product Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className={`glass-input ${errors.title ? 'border-red-500' : ''}`}
                placeholder="Enter product title"
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Source
              </label>
              <input
                type="text"
                value={formData.source}
                onChange={(e) => handleChange('source', e.target.value)}
                className="glass-input"
                placeholder="e.g., Amazon, eBay"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="glass-input min-h-[100px] resize-none"
              placeholder="Describe your product..."
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Image URL *
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={formData.image}
                onChange={(e) => handleChange('image', e.target.value)}
                className={`glass-input flex-1 ${errors.image ? 'border-red-500' : ''}`}
                placeholder="https://example.com/image.jpg"
              />
              {formData.image && (
                <AnimatedButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowPreview(true)}
                >
                  <FaEye />
                </AnimatedButton>
              )}
            </div>
            {errors.image && (
              <p className="text-red-500 text-xs mt-1">{errors.image}</p>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Pricing
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Current Price *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                className={`glass-input ${errors.price ? 'border-red-500' : ''}`}
                placeholder="0.00"
              />
              {errors.price && (
                <p className="text-red-500 text-xs mt-1">{errors.price}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Original Price
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.original_price}
                onChange={(e) => handleChange('original_price', e.target.value)}
                className="glass-input"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="glass-input"
              >
                {currencyOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Product Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Condition
              </label>
              <select
                value={formData.condition}
                onChange={(e) => handleChange('condition', e.target.value)}
                className="glass-input"
              >
                {conditionOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="glass-input"
              >
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="sold">Sold Out</option>
              </select>
            </div>
          </div>

          {/* Delivery Options */}
          <div>
            <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
              Delivery Options
            </label>
            <div className="flex gap-4">
              {['pickup', 'shipping'].map(option => (
                <label key={option} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.delivery_options.includes(option)}
                    onChange={(e) => handleDeliveryOptionChange(option, e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm capitalize" style={{ color: 'var(--text-secondary)' }}>
                    {option}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Visibility Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--bg-glass)' }}>
            <div>
              <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                Product Visibility
              </h4>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Control whether this product is visible to customers
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.visible}
                onChange={(e) => handleChange('visible', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Preview */}
        {formData.title && formData.price && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Preview
            </h3>
            <div className="p-4 rounded-xl border-2 border-dashed" style={{ borderColor: 'var(--text-muted)' }}>
              <div className="flex items-start gap-4">
                {formData.image && (
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {formData.title}
                  </h4>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {formData.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg font-bold" style={{ color: 'var(--accent-primary)' }}>
                      {formData.currency === 'EUR' ? '€' : formData.currency === 'USD' ? '$' : '£'}{formData.price}
                    </span>
                    <StatusBadge status={formData.status} visible={formData.visible} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-opacity-20" style={{ borderColor: 'var(--text-muted)' }}>
          <AnimatedButton
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            <FaTimes />
            Cancel
          </AnimatedButton>
          <AnimatedButton
            type="submit"
            variant="primary"
            loading={loading}
            className="flex-1"
          >
            <FaSave />
            {product ? 'Update Product' : 'Create Product'}
          </AnimatedButton>
        </div>
      </form>

      {/* Image Preview Modal */}
      {showPreview && formData.image && (
        <GlassModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          title="Image Preview"
          size="md"
        >
          <div className="p-6">
            <img
              src={formData.image}
              alt="Product preview"
              className="w-full max-h-96 object-contain rounded-lg"
              onError={(e) => {
                e.target.src = '/api/placeholder/400/400';
              }}
            />
          </div>
        </GlassModal>
      )}
    </GlassModal>
  );
};

export default ProductForm;