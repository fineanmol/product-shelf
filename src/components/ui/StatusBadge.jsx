import React from 'react';
import { FaCheckCircle, FaClock, FaTimesCircle } from 'react-icons/fa';

const StatusBadge = ({ status, visible = true }) => {
  const getStatusConfig = (status, visible) => {
    if (!visible) {
      return {
        icon: <FaTimesCircle />,
        text: 'Hidden',
        className: 'status-badge bg-gray-100 text-gray-600 border-gray-200'
      };
    }

    switch (status?.toLowerCase()) {
      case 'available':
        return {
          icon: <FaCheckCircle />,
          text: 'Available',
          className: 'status-badge status-available'
        };
      case 'reserved':
        return {
          icon: <FaClock />,
          text: 'Reserved',
          className: 'status-badge status-reserved'
        };
      case 'sold':
        return {
          icon: <FaTimesCircle />,
          text: 'Sold Out',
          className: 'status-badge status-sold'
        };
      default:
        return {
          icon: <FaCheckCircle />,
          text: 'Available',
          className: 'status-badge status-available'
        };
    }
  };

  const config = getStatusConfig(status, visible);

  return (
    <span className={config.className}>
      {config.icon}
      {config.text}
    </span>
  );
};

export default StatusBadge;