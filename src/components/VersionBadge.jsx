import React from "react";

const version = process.env.REACT_APP_VERSION;

const VersionBadge = () => {
  if (!version) return null;
  return (
    <div style={{
      position: 'fixed',
      bottom: 8,
      right: 8,
      background: '#eee',
      color: '#333',
      borderRadius: 4,
      padding: '2px 8px',
      fontSize: 12,
      zIndex: 9999,
      opacity: 0.7
    }}>
      v{version}
    </div>
  );
};

export default VersionBadge; 