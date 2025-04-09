// src/pages/Login.jsx
import React, { useState } from "react";
import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import { getDatabase, ref, get, set } from "firebase/database";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginWithEmail = async (e) => {
    e.preventDefault();
    try {
      const auth = getAuth();
      const result = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const user = result.user;

      const db = getDatabase();
      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        await set(userRef, {
          email: user.email,
          name: user.displayName || "User",
          photoURL: user.photoURL || "",
          password: password, // ⚠️ If required — store as-is (not recommended), or hash it if sensitive
        });
        // console.log("✅ Email user added to database");
      }

      navigate("/admin");
    } catch (err) {
      alert("Login failed. Check credentials.");
      console.error(err);
    }
  };

  const loginWithGoogle = async () => {
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const db = getDatabase();
      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        await set(userRef, {
          email: user.email,
          name: user.displayName || "Google User",
          photoURL: user.photoURL || "",
          password: "google-auth", // use placeholder for Google accounts
        });
        // console.log("✅ Google user added to database");
      }

      navigate("/admin");
    } catch (err) {
      alert("Google login failed.");
      console.error(err);
    }
  };

  return (
    <form
      onSubmit={loginWithEmail}
      className="max-w-sm mx-auto p-4 bg-white shadow-md mt-10 rounded-lg space-y-3"
    >
      <h2 className="text-xl font-bold">Admin Login</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-2 border rounded"
        required
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-2 border rounded"
        required
      />

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        Login with Email
      </button>

      <hr className="my-3" />

      <button
        type="button"
        onClick={loginWithGoogle}
        className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
      >
        <FcGoogle className="inline mr-2" /> Sign in with Google
      </button>
    </form>
  );
};

export default Login;
