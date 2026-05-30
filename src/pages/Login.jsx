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
import {
  FaShoppingCart,
  FaEye,
  FaEyeSlash,
  FaArrowLeft,
} from "react-icons/fa";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      // Create new user with editor role
      await set(userRef, {
        email: user.email,
        name: user.displayName || "User",
        photoURL: user.photoURL || "",
        password: providerType === "google" ? "google-auth" : password,
        role: "editor",
        disabled: false,
        createdAt: Date.now(),
      });
    } else {
      const existing = snapshot.val();
      // Only update role if it doesn't exist
      if (!existing.role) {
        await update(userRef, {
          role: "editor",
          updatedAt: Date.now(),
        });
      }
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Check if user is disabled
      const isEnabled = await handleDisabledCheck(user);
      if (!isEnabled) return;

      // Create or update user record
      await createOrUpdateUserRecord(user);

      navigate("/admin");
    } catch (error) {
      console.error("Login error:", error);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);

    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();

      // Configure Google Auth Provider
      provider.setCustomParameters({
        prompt: "select_account",
      });

      // Use a try-catch block specifically for the popup
      let userCredential;
      try {
        userCredential = await signInWithPopup(auth, provider);
      } catch (popupError) {
        // Handle popup blocked or closed
        if (popupError.code === "auth/popup-blocked") {
          alert("Please allow popups for this website to sign in with Google.");
          return;
        }
        if (popupError.code === "auth/popup-closed-by-user") {
          alert("Sign in was cancelled. Please try again.");
          return;
        }
        throw popupError;
      }

      const user = userCredential.user;

      // Check if user is disabled
      const isEnabled = await handleDisabledCheck(user);
      if (!isEnabled) return;

      // Create or update user record
      await createOrUpdateUserRecord(user, "google");

      navigate("/admin");
    } catch (error) {
      console.error("Google login error:", error);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 font-sans bg-white">
      {/* Left Column - Hero/Branding (visible on lg screens and up) */}
      <div className="hidden lg:flex lg:col-span-5 bg-brand-navy flex-col justify-between p-10 text-white relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#5cc3e8_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"></div>

        {/* Top Header */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center border border-white/10">
            <FaShoppingCart className="text-white text-lg" />
          </div>
          <div>
            <span className="font-bold text-lg leading-none tracking-tight block">SkyMarket</span>
            <span className="text-[10px] text-brand-sky font-semibold tracking-wider uppercase block mt-0.5">Management Console</span>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative space-y-5 my-auto">
          <div>
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand-sky/80 mb-3">
              ✦ Built for sellers
            </span>
            <h2 className="text-3xl font-extrabold leading-tight">
              Manage your store <br />
              with absolute ease.
            </h2>
            <p className="text-blue-100/60 text-sm leading-relaxed mt-3 max-w-xs">
              List products, track customer interests, and coordinate deliveries — all in one place.
            </p>
          </div>

          {/* Dashboard screenshot mock-frame */}
          <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40">
            {/* Browser chrome bar */}
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-2 border-b border-white/10">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400/70"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/70"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-400/70"></span>
              <div className="ml-2 flex-1 bg-white/10 rounded px-2 py-0.5 text-[10px] text-white/40 font-mono truncate">
                skymarket.app/admin
              </div>
            </div>
            {/* Screenshot image */}
            <img
              src="/login_hero.png"
              alt="SkyMarket admin dashboard preview"
              className="w-full object-cover object-top"
              style={{ maxHeight: "220px" }}
            />
          </div>

          {/* Feature bullets */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-brand-sky flex-shrink-0"></span>
              <span className="text-xs font-medium text-blue-100/70">Real-time interest tracking</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-brand-mint flex-shrink-0"></span>
              <span className="text-xs font-medium text-blue-100/70">Secure Firebase authentication</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-brand-sunshine flex-shrink-0"></span>
              <span className="text-xs font-medium text-blue-100/70">Automated seller onboarding</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative text-xs text-blue-100/30">
          &copy; {new Date().getFullYear()} SkyMarket. All rights reserved.
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="lg:col-span-7 bg-gray-50 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 py-12 relative">
        {/* Back to Home Button in top right */}
        <div className="absolute top-8 right-8">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-gray-500 hover:text-brand-navy text-sm font-semibold transition-colors"
          >
            <FaArrowLeft />
            <span>Back to Home</span>
          </button>
        </div>

        <div className="w-full max-w-md mx-auto bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-sm">
          {/* Logo on mobile */}
          <div className="flex items-center gap-3 mb-6 lg:hidden">
            <div className="w-8 h-8 bg-brand-navy rounded-lg flex items-center justify-center">
              <FaShoppingCart className="text-white text-sm" />
            </div>
            <span className="font-bold text-lg text-brand-navy tracking-tight">SkyMarket</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-brand-navy tracking-tight">
              Sign In
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Enter your credentials to manage your store listings.
            </p>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-brand-navy uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-sky focus:border-brand-sky transition-colors"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-brand-navy uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-sky focus:border-brand-sky transition-colors"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-sky hover:bg-brand-navy disabled:bg-gray-400 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm text-sm"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          <div className="flex items-center my-6">
            <hr className="flex-1 border-gray-100" />
            <span className="px-4 text-gray-400 text-xs font-bold tracking-wider">OR</span>
            <hr className="flex-1 border-gray-100" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-3 shadow-sm cursor-pointer text-sm"
          >
            <FcGoogle size={18} />
            <span>Continue with Google</span>
          </button>

          <div className="mt-8 p-4 bg-brand-sky/5 rounded-xl border border-brand-sky/10">
            <p className="text-xs text-brand-navy leading-relaxed text-center font-medium">
              💡 <strong>Note:</strong> Accounts are created instantly with <span className="text-brand-sky font-semibold">Editor</span> status to start listing items immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
