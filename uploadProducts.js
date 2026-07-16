#!/usr/bin/env node
/**
 * One-off maintainer script: seeds the production RTDB with the contents of
 * src/data/products.json. Not used by the app at runtime — run manually only.
 *
 * Auth: uses firebase-admin applicationDefault() credentials. Requires either
 * `gcloud auth application-default login` (interactive user ADC) or
 * GOOGLE_APPLICATION_CREDENTIALS pointing at a service account key for a
 * principal authorized against the product-shelf-inventory Firebase project.
 */

const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");

const products = require("./src/data/products.json");

initializeApp({
  credential: applicationDefault(),
  databaseURL:
    "https://product-shelf-inventory-default-rtdb.europe-west1.firebasedatabase.app",
});

const db = getDatabase();

const uploadData = async () => {
  try {
    await db.ref("/").set(products);
    console.log("✅ Data uploaded successfully.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Upload failed:", error);
    process.exit(1);
  }
};

uploadData();
