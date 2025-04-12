import React, { useState } from "react";
import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import { getDatabase, ref, get, set, update } from "firebase/database";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleDisabledCheck = async (user) => {
    const db = getDatabase();
    const userRef = ref(db, `users/${user.uid}`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      const userData = snapshot.val() || {};
      // If user is disabled, force sign out
      if (userData.disabled) {
        await signOut(getAuth());
        alert("Your account is disabled. Please contact an administrator.");
        return false;
      }
    }
    return true;
  };

  const createOrUpdateUserRecord = async (user, providerType = "password") => {
    const db = getDatabase();
    const userRef = ref(db, `users/${user.uid}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      await set(userRef, {
        email: user.email,
        name: user.displayName || "User",
        photoURL: user.photoURL || "",
        password: providerType === "google" ? "google-auth" : password,
        role: "editor",
        disabled: false,
      });
    } else {
      const existing = snapshot.val();
      if (!existing.role) {
        await update(userRef, { role: "editor" });
      }
    }
  };

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

      const allowed = await handleDisabledCheck(user);
      if (!allowed) return;

      await createOrUpdateUserRecord(user, "password");
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

      const allowed = await handleDisabledCheck(user);
      if (!allowed) return;

      await createOrUpdateUserRecord(user, "google");
      navigate("/admin");
    } catch (err) {
      alert("Google login failed.");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-100 via-blue-200 to-blue-300 flex items-center justify-center p-4">
      <form
        onSubmit={loginWithEmail}
        className="w-full max-w-sm bg-white rounded-xl shadow-2xl p-6 space-y-5"
      >
        <h2 className="text-2xl font-bold text-gray-800">Admin Login</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring focus:ring-blue-200 transition"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring focus:ring-blue-200 transition"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition"
        >
          Login with Email
        </button>

        <div className="flex items-center my-3">
          <hr className="flex-1 border-gray-300" />
          <span className="px-2 text-gray-500 text-sm">OR</span>
          <hr className="flex-1 border-gray-300" />
        </div>

        <button
          type="button"
          onClick={loginWithGoogle}
          className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 flex items-center justify-center gap-2 transition focus:ring-2 focus:ring-red-300"
        >
          <FcGoogle size={20} /> <span>Sign in with Google</span>
        </button>
      </form>
    </div>
  );
};

export default Login;
