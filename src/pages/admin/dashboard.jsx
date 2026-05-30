// src/pages/admin/dashboard.jsx
import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate, Link, useOutletContext } from "react-router-dom";
import { getDatabase, ref, get } from "firebase/database";
import SummaryCards from "../../components/admin/SummaryCards";
import InterestsTable from "../../components/admin/InterestsTable";
import DashboardProducts from "../../components/admin/DashboardProducts";
import { analytics } from "../../firebase";
import { logEvent } from "firebase/analytics";
import { 
  FaPlus, 
  FaBox, 
  FaHeart, 
  FaRocket, 
  FaPlusCircle, 
  FaTruck, 
  FaCopy,
  FaCheckCircle 
} from "react-icons/fa";
import { getCurrentUserRole, filterDataByUserRole } from "../../utils/permissions";
import { showToast } from "../../utils/showToast";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { openProfileModal } = useOutletContext() || {};
  const [currentUser, setCurrentUser] = useState(null);
  const [productCount, setProductCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login");
      } else {
        setCurrentUser(user);
        if (analytics) {
          logEvent(analytics, "view_admin_dashboard", { user_id: user.uid });
        }

        try {
          const db = getDatabase();
          const roleData = await getCurrentUserRole();

          // Fetch products to determine onboarding state
          const snapshot = await get(ref(db, "products"));
          let count = 0;
          if (snapshot.exists()) {
            const data = snapshot.val();
            let productsList = Object.entries(data).map(([id, val]) => ({ id, ...val }));
            productsList = filterDataByUserRole(
              productsList,
              roleData.role,
              user.uid,
              roleData.isSuperAdmin
            );
            count = productsList.length;
          }
          setProductCount(count);
        } catch (error) {
          console.error("Error setting up dashboard:", error);
        } finally {
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleCopyLink = () => {
    const shopUrl = window.location.origin;
    navigator.clipboard.writeText(shopUrl);
    setLinkCopied(true);
    showToast("📋 Shop link copied to clipboard!");
    setTimeout(() => setLinkCopied(false), 3000);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-sky mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Seller Onboarding View for new sellers with 0 products
  if (productCount === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Welcome Banner */}
          <div className="bg-brand-navy rounded-2xl shadow-sm border p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#5cc3e8_1px,transparent_1px)] [background-size:16px_16px]"></div>
            <div className="relative z-10 space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-sky/20 text-brand-sky text-xs font-bold uppercase tracking-wider">
                <FaRocket /> Get Started
              </span>
              <h1 className="text-3xl font-bold">
                {getGreeting()}, {currentUser?.displayName?.split(" ")[0] || "Seller"}!
              </h1>
              <p className="text-blue-100/80 leading-relaxed max-w-xl">
                Welcome to your SkyMarket management console. Let's list your first item and launch your digital store!
              </p>
            </div>
          </div>

          {/* Onboarding Checklist */}
          <div className="glass-card p-8 rounded-2xl">
            <h2 className="text-xl font-bold text-brand-navy mb-6 flex items-center gap-2">
              <span>🚀</span> Your Store Checklist
            </h2>

            <div className="space-y-8">
              {/* Step 1 */}
              <div className="flex gap-4 items-start pb-6 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-brand-sky flex-shrink-0 font-bold border border-brand-sky/20">
                  1
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      List Your First Product
                      <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-brand-coral font-bold uppercase">
                        Required
                      </span>
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Enter product specifications, set a price, and add photos to showcase your items.
                    </p>
                  </div>
                  <Link
                    to="/admin/products/add"
                    className="inline-flex items-center gap-2 bg-brand-sky hover:bg-brand-navy text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
                  >
                    <FaPlusCircle /> Add a Product
                  </Link>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4 items-start pb-6 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-brand-mint flex-shrink-0 font-bold border border-brand-mint/20">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    Specify Delivery Methods
                    <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-brand-mint font-bold uppercase">
                      Ready
                    </span>
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Buyers can opt for shipping or pickup. Set these settings directly when listing products to coordinate exchange.
                  </p>
                  <div className="flex gap-4 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <FaTruck className="text-brand-sky" /> Home Shipping
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span>📍</span> Local Pickup
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4 items-start pb-6 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-brand-navy flex-shrink-0 font-bold border border-brand-sunshine/20">
                  3
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      Share Your Marketplace Link
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-brand-sky font-bold uppercase">
                        Promote
                      </span>
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Promote your listed inventory with customers on WhatsApp, email, or social media pages.
                    </p>
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-lg transition-all shadow-sm"
                  >
                    {linkCopied ? (
                      <>
                        <FaCheckCircle className="text-brand-mint" /> Copied!
                      </>
                    ) : (
                      <>
                        <FaCopy className="text-gray-500" /> Copy Shop Link
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4 items-start pb-6 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-brand-navy flex-shrink-0 font-bold border border-brand-navy/10">
                  4
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      Complete Your Profile
                      <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-brand-navy font-bold uppercase">
                        Recommended
                      </span>
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Check your seller name, avatar, and contact options so buyers can recognize you.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (openProfileModal) openProfileModal();
                      else {
                        const button = document.querySelector('button[className*="ProfileImage"]');
                        if (button) button.click();
                        else showToast("ℹ️ Click on your profile name at the top right to view details.");
                      }
                    }}
                    className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-lg transition-all shadow-sm"
                  >
                    Go to Profile
                  </button>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-brand-coral flex-shrink-0 font-bold border border-brand-coral/20">
                  5
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      Get Help & Submit Feedback
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-brand-sky font-bold uppercase">
                        Support
                      </span>
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Encountered an issue or have a suggestion? Let us know directly through our feedback system.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const feedbackBtn = document.querySelector('button[className*="feedback"]');
                      if (feedbackBtn) {
                        feedbackBtn.click();
                      } else {
                        // fallback trigger via click event on document or simulate it
                        const customEvent = new CustomEvent('open-feedback');
                        window.dispatchEvent(customEvent);
                        showToast("ℹ️ Click on the floating Feedback button in the bottom corner to share your thoughts!");
                      }
                    }}
                    className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-lg transition-all shadow-sm"
                  >
                    Send Feedback
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard Analytical Dashboard view for sellers with 1+ products
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {getGreeting()},{" "}
                {currentUser?.displayName?.split(" ")[0] || "Admin"}!
              </h1>
              <p className="text-gray-600 mt-1">
                Welcome to your admin dashboard. Monitor and manage your
                marketplace.
              </p>
            </div>
          </div>
        </div>

        {/* Analytics Overview */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Analytics Overview
          </h2>
          <SummaryCards />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Products Section */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="bg-gray-50 border-b p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FaBox className="text-brand-sky" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Products</h3>
                    <p className="text-sm text-gray-600">Recent products</p>
                  </div>
                </div>
                <Link
                  to="/admin/products/add"
                  className="flex items-center gap-2 bg-brand-sky hover:bg-brand-navy text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  <FaPlus className="text-xs" />
                  Add Product
                </Link>
              </div>
            </div>
            <div className="p-4">
              <DashboardProducts />
            </div>
          </div>

          {/* Interests Section */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="bg-gray-50 border-b p-4">
              <div className="flex items-center gap-3">
                <FaHeart className="text-red-500" />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Customer Interests
                  </h3>
                  <p className="text-sm text-gray-600">
                    Recent customer engagement
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <InterestsTable />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
