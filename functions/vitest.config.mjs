import { defineConfig } from "vitest/config";

// Cloud Functions run in plain Node (no jsdom/browser globals needed), and
// this package is intentionally isolated from the root app's vitest config
// (see vite.config.js's functions/ exclude) since it's a separate deploy
// unit with its own package.json/dependencies.
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
  },
});
