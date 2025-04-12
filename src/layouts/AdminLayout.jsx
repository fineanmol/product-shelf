// src/layouts/AdminLayout.jsx
import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate, Link, Outlet } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import AdminSidebar from "../components/admin/AdminSidebar";

function AdminLayout() {
  const [currentUser, setCurrentUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
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

  const handleLogout = async () => {
    await signOut(getAuth());
    navigate("/login");
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Loading or not authenticated...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800">
      {/* Sidebar (collapsible) */}
      {sidebarOpen && <AdminSidebar onClose={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top navbar */}
        <header className="flex items-center justify-between bg-white px-4 py-2 shadow">
          <div className="flex items-center gap-2">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded hover:bg-gray-100 transition"
              >
                <FaBars />
              </button>
            )}

            <Link
              to="/admin"
              className="text-xl font-bold text-blue-600 hover:text-blue-700 transition"
            >
              Admin Dashboard
            </Link>
          </div>

          {/* User avatar + dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 hover:bg-gray-100 px-2 py-1 rounded transition"
            >
              <img
                src={
                  currentUser.photoURL ||
                  "https://cdn2.vectorstock.com/i/1000x1000/44/01/default-avatar-photo-placeholder-icon-grey-vector-38594401.jpg"
                }
                alt="User"
                className="w-8 h-8 rounded-full object-cover"
              />
              <span className="hidden sm:inline-block font-medium">
                {currentUser.displayName || currentUser.email}
              </span>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-white border rounded shadow py-2 z-50">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Inner content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
