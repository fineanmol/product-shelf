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
