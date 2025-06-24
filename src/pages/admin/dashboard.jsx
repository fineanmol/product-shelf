import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import SummaryCards from "../../components/admin/SummaryCards";
import { Link } from "react-router-dom";
import InterestsTable from "../../components/admin/InterestsTable";
import DashboardProducts from "../../components/admin/DashboardProducts";
import { analytics } from "../../firebase";
import { logEvent } from "firebase/analytics";
import { FaPlus, FaBox, FaHeart } from "react-icons/fa";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/login");
      } else {
        setCurrentUser(user);
        if (analytics)
          logEvent(analytics, "view_admin_dashboard", { user_id: user.uid });
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

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

        {/* Quick Actions */}
        {/* <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <AddAmazonProduct />
        </div> */}

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
                  <FaBox className="text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Products</h3>
                    <p className="text-sm text-gray-600">Recent products</p>
                  </div>
                </div>
                <Link
                  to="/admin/products/add"
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
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
