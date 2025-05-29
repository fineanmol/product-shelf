// src/layouts/AdminLayout.jsx
import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate, Link, Outlet } from "react-router-dom";
import { FaBars, FaGlobe, FaSignOutAlt, FaUser, FaBell, FaSearch, FaTimes } from "react-icons/fa";
import { getDatabase, ref, onValue } from "firebase/database";
import AdminSidebar from "../components/admin/AdminSidebar";

function AdminLayout() {
  const [currentUser, setCurrentUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default open on desktop
  const [showMenu, setShowMenu] = useState(false);
  const [newInterestsCount, setNewInterestsCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/login");
      } else {
        setCurrentUser(user);
      }
    });
    return unsubscribe;
  }, [navigate]);

  // Listen for new interests
  useEffect(() => {
    const db = getDatabase();
    const interestsRef = ref(db, "interests");
    
    const unsubscribe = onValue(interestsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        let newCount = 0;
        
        // Count unviewed interests
        Object.values(data).forEach(productInterests => {
          Object.values(productInterests).forEach(interest => {
            if (!interest.viewed) {
              newCount++;
            }
          });
        });
        
        setNewInterestsCount(newCount);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(getAuth());
    navigate("/login");
  };

  const handleNotificationClick = () => {
    // Navigate to interests/dashboard and mark as viewed
    navigate("/admin");
    // You can add logic here to mark interests as viewed
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="bg-white rounded-xl p-8 shadow-lg border">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600">Authenticating...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar - Collapsible */}
      <div className={`hidden lg:block transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0'}`}>
        {sidebarOpen && <AdminSidebar onClose={() => setSidebarOpen(false)} />}
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
            onClick={() => setSidebarOpen(false)}
          ></div>
          <div className="fixed inset-y-0 left-0 z-50 w-full lg:hidden">
            <AdminSidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Navbar */}
        <header className="bg-white border-b border-gray-200 shadow-sm z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              {/* Menu button - works for both mobile and desktop */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <FaBars className="text-gray-600" />
              </button>

              <div className="flex items-center gap-4">
                <Link
                  to="/admin"
                  className="flex items-center gap-3 text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">A</span>
                  </div>
                  Admin Panel
                </Link>

                {/* Search Bar */}
                <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-4 py-2 w-80">
                  <FaSearch className="text-gray-400 mr-3" />
                  <input
                    type="text"
                    placeholder="Search products, users, feedback..."
                    className="bg-transparent flex-1 outline-none text-gray-700 placeholder-gray-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Visit Website Link */}
              <a
                href={
                  process.env.NODE_ENV === "development"
                    ? "http://localhost:3000/"
                    : "https://product-shelf-inventory.web.app/"
                }
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors"
              >
                <FaGlobe className="text-sm" />
                <span>Visit Website</span>
              </a>

              {/* Notifications */}
              <button 
                onClick={handleNotificationClick}
                className="relative p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <FaBell className="text-gray-600" />
                {newInterestsCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">
                      {newInterestsCount > 99 ? '99+' : newInterestsCount}
                    </span>
                  </div>
                )}
              </button>

              {/* User Avatar + Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-3 bg-white hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors border"
                >
                  <img
                    src={
                      currentUser.photoURL ||
                      "https://cdn2.vectorstock.com/i/1000x1000/44/01/default-avatar-photo-placeholder-icon-grey-vector-38594401.jpg"
                    }
                    alt="User"
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <div className="hidden sm:block text-left">
                    <div className="font-medium text-gray-800 text-sm">
                      {currentUser.displayName || "Admin"}
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b">
                      <div className="font-medium text-gray-800 text-sm">
                        {currentUser.displayName || currentUser.email}
                      </div>
                      <div className="text-xs text-gray-500">{currentUser.email}</div>
                    </div>
                    
                    <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left">
                      <FaUser className="text-gray-500" />
                      <span className="text-gray-700">Profile</span>
                    </button>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left border-t"
                    >
                      <FaSignOutAlt className="text-red-500" />
                      <span className="text-red-600">Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
