// src/layouts/AdminLayout.jsx
import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate, Link, Outlet, useLocation } from "react-router-dom";
import {
  FaBars,
  FaGlobe,
  FaSignOutAlt,
  FaUser,
  FaSearch,
} from "react-icons/fa";
import { getDatabase, ref, onValue } from "firebase/database";
import AdminSidebar from "../components/admin/AdminSidebar";
import NotificationsDropdown from "../components/admin/NotificationsDropdown";
import { getCurrentUserRole } from "../utils/permissions";

function AdminLayout() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default open on desktop
  const [showMenu, setShowMenu] = useState(false);
  const [newInterestsCount, setNewInterestsCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login");
      } else {
        setCurrentUser(user);
        // Get user role
        try {
          const roleData = await getCurrentUserRole();
          setUserRole(roleData);

          // If not super admin and trying to access admin-only routes
          if (
            !roleData.isSuperAdmin &&
            (location.pathname.startsWith("/admin/users") ||
              location.pathname.startsWith("/admin/feedback"))
          ) {
            navigate("/admin");
          }
        } catch (error) {
          console.error("Error checking user role:", error);
          navigate("/login");
        }
      }
    });
    return unsubscribe;
  }, [navigate, location.pathname]);

  // Listen for new interests
  useEffect(() => {
    const db = getDatabase();
    const interestsRef = ref(db, "interests");

    const unsubscribe = onValue(interestsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        let newCount = 0;

        // Count unviewed interests
        Object.values(data).forEach((productInterests) => {
          Object.values(productInterests).forEach((interest) => {
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

  if (!currentUser || !userRole) {
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
      <div
        className={`hidden lg:block transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-0"
        }`}
      >
        {sidebarOpen && (
          <AdminSidebar
            onClose={() => setSidebarOpen(false)}
            userRole={userRole}
          />
        )}
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
          <div className="fixed inset-y-0 left-0 z-50 w-full lg:hidden">
            <AdminSidebar
              onClose={() => setSidebarOpen(false)}
              userRole={userRole}
            />
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
              <div className="relative">
                <NotificationsDropdown userRole={userRole} />
              </div>

              {/* User Avatar + Dropdown */}
              <div className="relative ml-2">
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
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="hidden sm:block text-left min-w-[120px]">
                    <div className="font-medium text-gray-800 text-sm truncate">
                      {currentUser.displayName || "Admin"}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {userRole.isSuperAdmin ? "Super Admin" : "Editor"}
                    </div>
                  </div>
                  <svg
                    className="w-4 h-4 text-gray-400 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b">
                      <div className="font-medium text-gray-800 text-sm truncate">
                        {currentUser.displayName || currentUser.email}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {currentUser.email}
                      </div>
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
