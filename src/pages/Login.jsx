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
  FaRocket,
  FaUsers,
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
      const userCredential = await signInWithPopup(auth, provider);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding and Info */}
        <div className="text-white space-y-8 lg:pr-8">
          {/* Back Button */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors mb-8"
          >
            <FaArrowLeft />
            <span>Back to Home</span>
          </button>

          {/* Logo and Brand */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <FaShoppingCart className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Marketplace</h1>
              <p className="text-blue-200">Your Local Trading Platform</p>
            </div>
          </div>

          {/* Value Props */}
          <div className="space-y-6">
            <h2 className="text-4xl font-bold leading-tight">
              Join Our <br />
              <span className="text-blue-200">Community</span>
            </h2>

            <p className="text-xl text-blue-100 leading-relaxed">
              Start buying and selling with ease. Access your personal dashboard
              to manage products and connect with buyers.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <FaRocket className="text-blue-200" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Quick Start</h3>
                  <p className="text-blue-200 text-sm">
                    Set up your account in minutes
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center"></div>
                <div>
                  <h3 className="font-semibold text-lg">Secure Platform</h3>
                  <p className="text-blue-200 text-sm">
                    Your data is protected and secure
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <FaUsers className="text-yellow-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Growing Community</h3>
                  <p className="text-blue-200 text-sm">
                    Join thousands of active users
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Welcome Back!
              </h2>
              <p className="text-gray-600">Sign in to access your dashboard</p>
            </div>

            <form onSubmit={handleGoogleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <FaRocket className="text-sm" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center my-6">
              <hr className="flex-1 border-gray-300" />
              <span className="px-4 text-gray-500 text-sm font-medium">OR</span>
              <hr className="flex-1 border-gray-300" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full bg-white hover:bg-gray-50 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-sm"
            >
              <FcGoogle size={20} />
              <span>Continue with Google</span>
            </button>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-blue-800 text-sm text-center">
                <strong>New users:</strong> Your account will be created
                automatically with
                <span className="font-semibold"> Editor</span> permissions to
                start selling immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
