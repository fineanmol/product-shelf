import packageJson from "../../package.json";

// Get the version from environment variable set during build
export const getAppVersion = () => {
  const version = import.meta.env.VITE_VERSION;

  // Log version in development
  if (import.meta.env.DEV) {
    // console.log("Current version:", version || "not set");
    // console.log("All env vars:", import.meta.env);
  }

  // Fallback version from package.json if env var is not set
  if (!version) {
    return packageJson.version;
  }

  return version;
};

// Format version with v prefix
export const getFormattedVersion = () => {
  return `v${getAppVersion()}`;
};
