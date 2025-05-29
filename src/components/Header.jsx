import React from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { 
  FaShoppingCart, 
  FaUser, 
  FaHome, 
  FaCog,
  FaSearch
} from "react-icons/fa";

const Header = ({ 
  title = "MarketSpace", 
  subtitle,
  showSearch = false,
  searchValue = "",
  onSearchChange,
  currentUser = null,
  variant = "default" // "default", "hero", "simple"
}) => {
  const navigate = useNavigate();
  const [user, setUser] = React.useState(currentUser);

  React.useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const NavigationBar = () => (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate("/")}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <FaShoppingCart className="text-white text-xl" />
              </div>
              <span className="text-xl font-bold text-gray-800">MarketSpace</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <FaHome className="text-sm" />
              <span className="hidden sm:inline">Home</span>
            </button>

            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-gray-600 hidden sm:inline">
                  Welcome, {user.displayName?.split(" ")[0] || "User"}!
                </span>
                <button
                  onClick={() => navigate("/admin")}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  <FaCog className="text-sm" />
                  <span className="hidden sm:inline">Dashboard</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <FaUser className="text-sm" />
                <span className="hidden sm:inline">Sell Items</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );

  if (variant === "hero") {
    return (
      <>
        <NavigationBar />
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white">
          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
                  {subtitle}
                </p>
              )}
              
              {showSearch && (
                <div className="max-w-2xl mx-auto mt-8">
                  <div className="relative">
                    <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search for items..."
                      className="w-full pl-12 pr-4 py-4 text-gray-800 rounded-xl border-0 focus:outline-none focus:ring-4 focus:ring-white/20 text-lg"
                      value={searchValue}
                      onChange={onSearchChange}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (variant === "simple") {
    return (
      <>
        <NavigationBar />
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
            {subtitle && (
              <p className="text-gray-600">{subtitle}</p>
            )}
          </div>
        </div>
      </>
    );
  }

  // Default variant
  return (
    <>
      <NavigationBar />
      <header className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{title}</h1>
          {subtitle && (
            <p className="text-blue-100 text-lg">{subtitle}</p>
          )}
        </div>
      </header>
    </>
  );
};

export default Header;
