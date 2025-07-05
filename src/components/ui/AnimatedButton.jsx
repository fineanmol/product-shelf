import React, { useState } from 'react';

const AnimatedButton = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  disabled = false,
  className = '',
  ...props 
}) => {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = async (e) => {
    if (disabled || loading) return;
    
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 200);
    
    if (onClick) {
      await onClick(e);
    }
  };

  const baseClasses = "relative overflow-hidden font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variantClasses = {
    primary: "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 focus:ring-blue-500",
    secondary: "neuro-button",
    success: "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 focus:ring-green-500",
    danger: "bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 focus:ring-red-500",
    ghost: "glass-card hover:bg-opacity-20"
  };

  const sizeClasses = {
    sm: "px-3 py-2 text-sm rounded-lg",
    md: "px-6 py-3 text-base rounded-xl",
    lg: "px-8 py-4 text-lg rounded-xl"
  };

  const classes = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${isClicked ? 'scale-95' : 'hover:scale-105'}
    ${className}
  `;

  return (
    <button
      className={classes}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {/* Ripple effect */}
      <span className="absolute inset-0 overflow-hidden rounded-inherit">
        <span 
          className={`absolute inset-0 bg-white opacity-0 transition-opacity duration-300 ${
            isClicked ? 'opacity-20' : ''
          }`}
        />
      </span>
      
      {/* Content */}
      <span className="relative flex items-center justify-center gap-2">
        {loading && (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </span>
    </button>
  );
};

export default AnimatedButton;