import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import AdminProductTable from "../components/AdminProductTable";
import SummaryCards from "../components/admin/SummaryCards";
import InterestsTable from "../components/admin/InterestsTable";

const Admin = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        navigate("/login");
      }
    });
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(getAuth());
    navigate("/login");
  };

  if (!user)
    return <p className="text-center mt-10">Loading or not authenticated...</p>;

  return (
    <div className="p-2 md:p-6 mx-auto text-left">
      <div className="flex flex-col lg:flex-row lg:justify-between items-start lg:items-center gap-4 mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold">Dashboard Overview</h2>
        <p className="text-sm text-gray-500">
          Welcome back, {user.displayName || user.email}!
          <br />
        </p>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          {/* User Info */}
          <div className="flex items-center gap-2">
            <img
              src={
                user.photoURL ||
                "https://cdn2.vectorstock.com/i/1000x1000/44/01/default-avatar-photo-placeholder-icon-grey-vector-38594401.jpg"
              }
              alt="User Avatar"
              className="w-8 h-8 rounded-full object-cover"
            />
            <span className="text-sm font-medium text-gray-700 break-all">
              {user.displayName || user.email}
            </span>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600 w-full sm:w-auto"
          >
            Logout
          </button>
        </div>
      </div>
      <SummaryCards />
      <AdminProductTable />
      <InterestsTable />
    </div>
  );
};

export default Admin;
