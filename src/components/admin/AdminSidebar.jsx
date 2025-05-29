// src/components/AdminSidebar.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FaTimes, FaHome, FaBox, FaUsers, FaCommentDots } from "react-icons/fa";

function AdminSidebar({ onClose }) {
  const location = useLocation();

  const links = [
    { to: "/admin", label: "Dashboard", icon: <FaHome /> },
    { to: "/admin/products", label: "Products", icon: <FaBox /> },
    { to: "/admin/users", label: "Users", icon: <FaUsers /> },
    { to: "/admin/feedback", label: "Feedback", icon: <FaCommentDots /> },
  ];

  const handleLinkClick = () => {
    // Only close on mobile (when onClose is provided and screen is small)
    if (onClose && window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <div className="w-80 lg:w-64 bg-white shadow-lg flex flex-col h-full border-r border-gray-200">
      {/* Sidebar header */}
      <div className="bg-blue-600 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div>
              <span className="font-bold text-lg text-white">Admin Panel</span>
              <p className="text-blue-100 text-xs">Management Console</p>
            </div>
          </div>
          {onClose && (
            <button
              className="lg:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              onClick={onClose}
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {links.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              onClick={handleLinkClick}
              className={`flex items-center p-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-3 text-lg">
                {link.icon}
              </span>
              <span className="font-medium">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-center">
          <p className="text-xs text-gray-500">Admin Panel v2.0</p>
          <p className="text-xs text-gray-400">{new Date().getFullYear()} • Marketplace</p>
        </div>
      </div>
    </div>
  );
}

export default AdminSidebar;
