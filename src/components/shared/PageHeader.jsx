import React from "react";
import { useNavigate } from "react-router-dom";
import { FaShoppingCart, FaHome, FaCog, FaPlus } from "react-icons/fa";
import SearchBar from "./SearchBar";
import ProfileImage from "./ProfileImage";

const PageHeader = ({
  siteName = "MarketSpace",
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search products...",
  showSearch = true,
  currentUser,
  rightActions,
  className = "",
}) => {
  const navigate = useNavigate();

  return (
    <header className={`bg-white shadow-sm sticky top-0 z-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 transition-all duration-200"
          >
            <div className="w-11 h-11 bg-brand-sky rounded-xl flex items-center justify-center shadow-sm">
              <FaShoppingCart className="text-white text-xl" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-2xl font-bold text-brand-navy">
                {siteName}
              </h1>
            </div>
          </button>

          {/* Search Bar */}
          {showSearch && (
            <div className="flex-1 max-w-2xl">
              <SearchBar
                value={searchValue}
                onChange={onSearchChange}
                placeholder={searchPlaceholder}
              />
            </div>
          )}

          {/* Right Actions */}
          {rightActions || (
            <div className="flex items-center gap-4">
              {/* Home Button */}
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 text-gray-600 hover:text-brand-sky transition-colors"
              >
                <FaHome className="text-sm" />
                <span className="hidden sm:inline">Home</span>
              </button>

              {/* User Section */}
              {currentUser ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <ProfileImage
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || "User"}
                      size={32}
                    />
                    <span className="text-gray-600 hidden sm:inline">
                      {currentUser.displayName?.split(" ")[0] || "User"}
                    </span>
                  </div>
                  <button
                    onClick={() => navigate("/admin")}
                    className="flex items-center gap-2 bg-brand-sky hover:bg-brand-navy text-white font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
                  >
                    <FaCog className="text-sm" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => navigate("/login")}
                  className="flex items-center gap-2 bg-brand-sky hover:bg-brand-navy text-white font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
                >
                  <FaPlus className="text-sm" />
                  <span className="hidden sm:inline">Sell</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default PageHeader;

