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

  return (
    <div className="w-64 bg-white shadow flex flex-col">
      {/* Sidebar header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <span className="font-bold text-lg">Menu</span>
        <button
          className="p-2 rounded hover:bg-gray-100 transition"
          onClick={onClose}
        >
          <FaTimes />
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto">
        {links.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center px-4 py-2 hover:bg-gray-100 transition ${
                isActive ? "bg-gray-200 font-medium" : ""
              }`}
            >
              <span className="mr-2">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default AdminSidebar;
