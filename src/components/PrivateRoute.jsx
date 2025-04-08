// src/components/PrivateRoute.jsx
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const PrivateRoute = ({ children }) => {
  const [user, setUser] = useState(undefined); // `undefined` means loading

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (firebaseUser) => {
      setUser(firebaseUser || null);
    });
    return () => unsubscribe();
  }, []);

  if (user === undefined)
    return <p className="text-center mt-10">Checking authentication...</p>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
};

export default PrivateRoute;
