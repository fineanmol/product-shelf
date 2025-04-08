// src/pages/Login.jsx
import React, { useState } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async (e) => {
    e.preventDefault();
    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate("/admin"); 
    } catch (err) {
      alert("Login failed. Check credentials.");
      console.error(err);
    }
  };

  return (
    <form onSubmit={login} className="max-w-sm mx-auto p-4 bg-white shadow-md mt-10 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Admin Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-2 mb-2 border rounded"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-2 mb-4 border rounded"
        required
      />
      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
        Login
      </button>
    </form>
  );
};


export default Login;
