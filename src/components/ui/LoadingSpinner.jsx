import React from 'react';

const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="loading-dots">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
      {text && (
        <p className="mt-4 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;