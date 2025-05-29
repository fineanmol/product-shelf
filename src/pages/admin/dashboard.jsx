import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import SummaryCards from "../../components/admin/SummaryCards";
import { Link } from "react-router-dom";
import InterestsTable from "../../components/admin/InterestsTable";
import DashboardProducts from "../../components/admin/DashboardProducts";
import AddAmazonProduct from "./add-amazon-product";
import { analytics } from "../../firebase";
import { logEvent } from "firebase/analytics";
import { FaPlus } from "react-icons/fa";

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
        if (analytics) logEvent(analytics, "view_admin_dashboard", { user_id: user.uid });
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col gap-6">
      {/* Header Section */}
      <div className="bg-white p-4 sm:p-6 shadow-md rounded-lg">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
        <p className="text-md text-gray-500 mt-1">
          Welcome back {currentUser?.displayName || "Admin"}
        </p>
      </div>

      <AddAmazonProduct />

      {/* Summary Cards */}
      <div className="bg-white p-4 sm:p-6 shadow-md rounded-lg">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Overview</h2>
        <SummaryCards />
      </div>

      {/* Products Section */}
      <div className="bg-white p-4 sm:p-6 shadow-md rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Your Products</h2>
          <Link
            to="/admin/products/add"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaPlus />
            Add Product
          </Link>
        </div>
        <DashboardProducts />
      </div>

      {/* Interests Section */}
      <div className="bg-white p-4 sm:p-6 shadow-md rounded-lg">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Interests</h2>
        <InterestsTable />
      </div>
    </div>
  );
};

export default AdminDashboard;
