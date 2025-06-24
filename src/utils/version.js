// Get the version from environment variable set during build
export const getAppVersion = () => {
  const version = process.env.REACT_APP_VERSION;

  // Log version in development
  if (process.env.NODE_ENV === "development") {
    // console.log("Current version:", version || "not set");
    // console.log("All env vars:", process.env);
  }

  // Fallback version from package.json if env var is not set
  if (!version) {
    try {
      // Try to get version from package.json
      const packageJson = require("../../package.json");
      return packageJson.version;
    } catch (error) {
      console.warn("Could not read version from package.json:", error);
      return "0.0.0";
    }
  }

  return version;
};

// Format version with v prefix
export const getFormattedVersion = () => {
  return `v${getAppVersion()}`;
};
