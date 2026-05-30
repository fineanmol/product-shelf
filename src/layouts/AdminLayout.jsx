// src/layouts/AdminLayout.jsx
import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import { getDatabase, ref, onValue, update } from "firebase/database";
import { useNavigate, Link, Outlet, useLocation } from "react-router-dom";
import {
  FaBars,
  FaGlobe,
  FaSignOutAlt,
  FaUser,
  FaSearch,
} from "react-icons/fa";
import AdminSidebar from "../components/admin/AdminSidebar";
import NotificationsDropdown from "../components/admin/NotificationsDropdown";
import { getCurrentUserRole } from "../utils/permissions";
import ProfileImage from "../components/shared/ProfileImage";
import GlassModal from "../components/ui/GlassModal";
import { showToast } from "../utils/showToast";

function AdminLayout() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default open on desktop
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [profileData, setProfileData] = useState({ name: "", photoURL: "", email: "", phone: "" });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhotoURL, setEditPhotoURL] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (showProfileModal) {
      setEditName(profileData.name || "");
      setEditPhotoURL(profileData.photoURL || "");
      setEditPhone(profileData.phone || "");
    }
  }, [showProfileModal, profileData]);

  useEffect(() => {
    const auth = getAuth();
    let dbUnsubscribe = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (dbUnsubscribe) dbUnsubscribe();
        navigate("/login");
      } else {
        setCurrentUser(user);

        // Listen to database user record in real-time
        const db = getDatabase();
        const userRef = ref(db, `users/${user.uid}`);
        dbUnsubscribe = onValue(userRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            setProfileData({
              name: data.name || user.displayName || "User",
              photoURL: data.photoURL || user.photoURL || "",
              email: data.email || user.email || "",
              phone: data.phone || "",
            });
          } else {
            setProfileData({
              name: user.displayName || "User",
              photoURL: user.photoURL || "",
              email: user.email || "",
              phone: "",
            });
          }
        });

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

    return () => {
      unsubscribe();
      if (dbUnsubscribe) dbUnsubscribe();
    };
  }, [navigate, location.pathname]);

  const handleLogout = async () => {
    await signOut(getAuth());
    navigate("/login");
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);

    try {
      const auth = getAuth();
      const db = getDatabase();

      // 1. Update Firebase Auth Profile
      await updateProfile(auth.currentUser, {
        displayName: editName,
        photoURL: editPhotoURL,
      });

      // 2. Force session reload
      await auth.currentUser.reload();
      const updatedUser = auth.currentUser;
      setCurrentUser(updatedUser);

      // 3. Update Realtime Database Record
      const userRef = ref(db, `users/${updatedUser.uid}`);
      await update(userRef, {
        name: editName,
        photoURL: editPhotoURL,
        phone: editPhone,
        updatedAt: Date.now(),
      });

      showToast("✅ Profile updated successfully");
      setShowProfileModal(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      showToast("❌ Failed to update profile: " + error.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (!currentUser || !userRole) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="bg-white rounded-xl p-8 shadow-lg border">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-brand-sky border-t-transparent rounded-full animate-spin"></div>
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
                  className="flex items-center gap-3 text-xl font-bold text-gray-800 hover:text-brand-sky transition-colors"
                >
                  <div className="w-8 h-8 bg-brand-sky rounded-lg flex items-center justify-center">
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
                className="hidden sm:flex items-center gap-2 bg-brand-sky hover:bg-brand-navy text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors"
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
                  <ProfileImage
                    src={profileData.photoURL}
                    alt={profileData.name || currentUser.displayName || currentUser.email || "User"}
                    className="w-8 h-8 rounded-full object-cover"
                    size={128}
                  />
                  <div className="hidden sm:block text-left min-w-[120px]">
                    <div className="font-medium text-gray-800 text-sm truncate">
                      {profileData.name || "Admin"}
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
                        {profileData.name || currentUser.displayName || currentUser.email}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {currentUser.email}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setShowProfileModal(true);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left text-sm"
                    >
                      <FaUser className="text-gray-500" />
                      <span className="text-gray-700">Profile</span>
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left border-t text-sm"
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
          <Outlet context={{ openProfileModal: () => setShowProfileModal(true) }} />
        </main>
      </div>

      {/* Profile Modal */}
      <GlassModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title="Your Seller Profile"
        size="sm"
      >
        <div className="p-6 space-y-6">
          <div className="flex flex-col items-center gap-4">
            <ProfileImage
              src={editPhotoURL}
              alt={editName || "User"}
              className="w-24 h-24 rounded-full border-4 border-brand-sky object-cover shadow-md"
              size={128}
            />
            <div className="text-center">
              <span className="inline-block text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded bg-brand-sky/10 text-brand-navy border border-brand-sky/20">
                {userRole?.isSuperAdmin ? "Super Admin" : "Seller"}
              </span>
              <p className="text-sm text-gray-500 mt-1">{profileData.email}</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-sky focus:border-transparent transition-all"
                required
                disabled={isSavingProfile}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Profile Photo URL
              </label>
              <input
                type="url"
                value={editPhotoURL}
                onChange={(e) => setEditPhotoURL(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-sky focus:border-transparent transition-all"
                disabled={isSavingProfile}
              />
              <p className="text-xs text-gray-400 mt-1">
                Provide a direct image link (e.g., from Unsplash or Imgur).
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                WhatsApp Phone Number
              </label>
              <input
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="e.g. +4917612345678"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-sky focus:border-transparent transition-all"
                disabled={isSavingProfile}
              />
              <p className="text-xs text-gray-400 mt-1">
                Enter phone number with country code (e.g. +4917612345678) for direct WhatsApp customer chats.
              </p>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                disabled={isSavingProfile}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-brand-sky hover:bg-brand-navy text-white py-2.5 px-4 rounded-lg font-semibold transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                disabled={isSavingProfile}
              >
                {isSavingProfile ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </GlassModal>
    </div>
  );
}

export default AdminLayout;
