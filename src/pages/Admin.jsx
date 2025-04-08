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

  if (!user) return <p className="text-center mt-10">Loading or not authenticated...</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Admin Panel</h1>
      <p className="mb-4">Welcome, {user.email}</p>
      <button
        onClick={handleLogout}
        className="mb-6 bg-red-500 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
          <ProductForm />
          <ProductAdminList />
    </div>
  );
};

export default Admin;
