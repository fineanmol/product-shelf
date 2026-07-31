import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Keep the output directory as "build" to match firebase.json's
    // hosting.public setting (Vite defaults to "dist").
    outDir: "build",
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/setupTests.js"],
    globals: true,
    exclude: ["**/node_modules/**", "**/.claude/**", "**/functions/**"],
    // CRA's Jest preset ran with resetMocks: true, wiping every mock's
    // recorded calls/implementations before each test. Vitest doesn't do
    // this by default; matching it here (rather than adding manual
    // beforeEach resets everywhere) keeps existing and future tests
    // isolated the same way they were under Jest.
    mockReset: true,
  },
});
