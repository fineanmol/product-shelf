// src/pages/admin/dashboard.jsx
import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate, Link, useOutletContext } from "react-router-dom";
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
import { getCurrentUserRole } from "../../utils/permissions";
import { getAllProducts, getOwnedProducts } from "../../services/productsService";
import { showToast } from "../../utils/showToast";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { openProfileModal, openFeedbackModal } = useOutletContext() || {};
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
          const roleData = await getCurrentUserRole();

          // Fetch products to determine onboarding state
          let count = 0;
          if (roleData.isSuperAdmin) {
            const productsList = await getAllProducts();
            count = productsList.length;
          } else {
            const ownedProducts = await getOwnedProducts(user.uid);
            count = ownedProducts.length;
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
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-sky mx-auto mb-4"></div>
          <p className="text-body text-stone-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Onboarding step-number circle scheme: cycles through brand colors so no
  // unbranded yellow-50/purple-50 workarounds are needed.
  const stepCircleClasses = [
    "bg-brand-sky/15 text-brand-sky border border-brand-sky/20",
    "bg-brand-mint/15 text-brand-mint border border-brand-mint/20",
    "bg-brand-sunshine/20 text-brand-navy border border-brand-sunshine/30",
    "bg-stone-200 text-brand-navy border border-stone-300",
    "bg-brand-coral/15 text-brand-coral border border-brand-coral/20",
  ];

  // Seller Onboarding View for new sellers with 0 products
  if (productCount === 0) {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Welcome Banner */}
          <div className="bg-brand-navy rounded-2xl shadow-soft p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#5cc3e8_1px,transparent_1px)] [background-size:16px_16px]"></div>
            <div className="relative z-10 space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-sky/20 text-brand-sky text-xs font-bold uppercase tracking-wider">
                <FaRocket /> Get Started
              </span>
              <h1 className="text-title-lg">
                {getGreeting()}, {currentUser?.displayName?.split(" ")[0] || "Seller"}!
              </h1>
              <p className="text-body-lg text-stone-100/80 max-w-xl">
                Welcome to your SkyMarket management console. Let's list your first item and launch your digital store!
              </p>
            </div>
          </div>

          {/* Onboarding Checklist */}
          <div className="bg-white border border-stone-200 rounded-xl shadow-soft p-8">
            <h2 className="text-title text-brand-navy mb-6 flex items-center gap-2">
              <span>🚀</span> Your Store Checklist
            </h2>

            <div className="space-y-8">
              {/* Step 1 */}
              <div className="flex gap-4 items-start pb-6 border-b border-stone-100">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold ${stepCircleClasses[0]}`}>
                  1
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-body font-semibold text-stone-900 flex items-center gap-2">
                      List Your First Product
                      <span className="text-xs px-2 py-0.5 rounded bg-brand-coral/10 text-brand-coral font-bold uppercase">
                        Required
                      </span>
                    </h3>
                    <p className="text-body text-stone-600 mt-1">
                      Enter product specifications, set a price, and add photos to showcase your items.
                    </p>
                  </div>
                  <Link
                    to="/admin/products/add"
                    className="inline-flex items-center gap-2 bg-brand-sky hover:bg-brand-navy text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-soft"
                  >
                    <FaPlusCircle /> Add a Product
                  </Link>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4 items-start pb-6 border-b border-stone-100">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold ${stepCircleClasses[1]}`}>
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-body font-semibold text-stone-900 flex items-center gap-2">
                    Specify Delivery Methods
                    <span className="text-xs px-2 py-0.5 rounded bg-brand-mint/10 text-brand-mint font-bold uppercase">
                      Ready
                    </span>
                  </h3>
                  <p className="text-body text-stone-600 mt-1">
                    Buyers can opt for shipping or pickup. Set these settings directly when listing products to coordinate exchange.
                  </p>
                  <div className="flex gap-4 mt-3 text-caption text-stone-500">
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
              <div className="flex gap-4 items-start pb-6 border-b border-stone-100">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold ${stepCircleClasses[2]}`}>
                  3
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-body font-semibold text-stone-900 flex items-center gap-2">
                      Share Your Marketplace Link
                      <span className="text-xs px-2 py-0.5 rounded bg-brand-sky/10 text-brand-sky font-bold uppercase">
                        Promote
                      </span>
                    </h3>
                    <p className="text-body text-stone-600 mt-1">
                      Promote your listed inventory with customers on WhatsApp, email, or social media pages.
                    </p>
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-2 bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 text-sm font-semibold px-4 py-2.5 rounded-lg transition-all shadow-soft"
                  >
                    {linkCopied ? (
                      <>
                        <FaCheckCircle className="text-brand-mint" /> Copied!
                      </>
                    ) : (
                      <>
                        <FaCopy className="text-stone-500" /> Copy Shop Link
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4 items-start pb-6 border-b border-stone-100">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold ${stepCircleClasses[3]}`}>
                  4
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-body font-semibold text-stone-900 flex items-center gap-2">
                      Complete Your Profile
                      <span className="text-xs px-2 py-0.5 rounded bg-stone-200 text-brand-navy font-bold uppercase">
                        Recommended
                      </span>
                    </h3>
                    <p className="text-body text-stone-600 mt-1">
                      Check your seller name, avatar, and contact options so buyers can recognize you.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (openProfileModal) openProfileModal();
                      else showToast("ℹ️ Click on your profile name at the top right to view details.");
                    }}
                    className="inline-flex items-center gap-2 bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 text-sm font-semibold px-4 py-2.5 rounded-lg transition-all shadow-soft"
                  >
                    Go to Profile
                  </button>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-4 items-start">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold ${stepCircleClasses[4]}`}>
                  5
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-body font-semibold text-stone-900 flex items-center gap-2">
                      Get Help & Submit Feedback
                      <span className="text-xs px-2 py-0.5 rounded bg-brand-sky/10 text-brand-sky font-bold uppercase">
                        Support
                      </span>
                    </h3>
                    <p className="text-body text-stone-600 mt-1">
                      Encountered an issue or have a suggestion? Let us know directly through our feedback system.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (openFeedbackModal) openFeedbackModal();
                      else showToast("ℹ️ Feedback is currently unavailable. Please try again shortly.");
                    }}
                    className="inline-flex items-center gap-2 bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 text-sm font-semibold px-4 py-2.5 rounded-lg transition-all shadow-soft"
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
    <div className="min-h-screen bg-stone-50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-soft border border-stone-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-title-lg text-stone-900">
                {getGreeting()},{" "}
                {currentUser?.displayName?.split(" ")[0] || "Admin"}!
              </h1>
              <p className="text-body text-stone-600 mt-1">
                Welcome to your admin dashboard. Monitor and manage your
                marketplace.
              </p>
            </div>
          </div>
        </div>

        {/* Analytics Overview */}
        <div className="bg-white rounded-xl shadow-soft border border-stone-200 p-6">
          <h2 className="text-title text-stone-900 mb-6">
            Analytics Overview
          </h2>
          <SummaryCards />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Products Section */}
          <div className="bg-white rounded-xl shadow-soft border border-stone-200 overflow-hidden">
            <div className="bg-stone-50 border-b border-stone-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FaBox className="text-brand-sky" />
                  <div>
                    <h3 className="text-body font-semibold text-stone-900">Products</h3>
                    <p className="text-caption text-stone-600">Recent products</p>
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
          <div className="bg-white rounded-xl shadow-soft border border-stone-200 overflow-hidden">
            <div className="bg-stone-50 border-b border-stone-200 p-4">
              <div className="flex items-center gap-3">
                <FaHeart className="text-brand-coral" />
                <div>
                  <h3 className="text-body font-semibold text-stone-900">
                    Customer Interests
                  </h3>
                  <p className="text-caption text-stone-600">
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
