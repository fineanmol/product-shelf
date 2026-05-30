import React, { useState } from "react";

const AnimatedButton = ({
  children,
  onClick,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
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

  const baseClasses =
    "relative overflow-hidden font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variantClasses = {
    primary:
      "bg-brand-sky text-white hover:bg-brand-navy focus:ring-brand-sky shadow-sm",
    secondary:
      "bg-white border-2 border-brand-navy text-brand-navy hover:bg-brand-navy hover:text-white focus:ring-brand-navy shadow-sm",
    success:
      "bg-brand-mint text-brand-navy hover:bg-brand-navy hover:text-white focus:ring-brand-mint shadow-sm",
    danger:
      "bg-brand-coral text-white hover:bg-brand-navy focus:ring-brand-coral shadow-sm",
    ghost:
      "bg-transparent border border-brand-sky text-brand-sky hover:bg-brand-sky hover:text-white focus:ring-brand-sky",
  };

  const sizeClasses = {
    sm: "px-3 py-2 text-sm rounded-lg",
    md: "px-6 py-3 text-base rounded-xl",
    lg: "px-8 py-4 text-lg rounded-xl",
  };

  const classes = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
    ${isClicked ? "opacity-90" : ""}
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
          className={`absolute inset-0 bg-white opacity-0 transition-opacity duration-200 ${
            isClicked ? "opacity-20" : ""
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
