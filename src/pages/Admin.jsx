import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import ProductForm from "../components/ProductForm";
import ProductAdminList from "../components/ProductAdminList";

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
    <div className="p-6 max-w-6xl mx-auto text-left">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Panel</h1>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <img
              src={
                user.photoURL ||
                "https://cdn2.vectorstock.com/i/1000x1000/44/01/default-avatar-photo-placeholder-icon-grey-vector-38594401.jpg"
              } // fallback avatar
              alt="User Avatar"
              className="w-8 h-8 rounded-full object-cover"
            />
            <span className="text-sm font-medium text-gray-700">
              {user.displayName || user.email}
            </span>
            {/* <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg> */}
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>

      <ProductAdminList />
    </div>
  );
};

export default Admin;
