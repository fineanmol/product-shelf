// File: pages/api/add-amazon-product.js

import { initializeApp, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const amazonPaapi = require("amazon-paapi");
const serviceAccount = require("./firebase-service-account.json");

// Initialize Firebase Admin only once (global guard)
if (!global.firebaseAdminInitialized) {
  initializeApp({
    credential: cert(serviceAccount),
    databaseURL:
      "https://product-shelf-inventory-default-rtdb.europe-west1.firebasedatabase.app",
  });
  global.firebaseAdminInitialized = true;
}

/**
 * Helper function to fetch data from Amazon PA-API with basic retry logic.
 * @param {object} commonParameters - Common config parameters for amazon-paapi
 * @param {object} requestParameters - Request-specific parameters (ItemIds, Resources, etc.)
 * @return {Promise<object>} The response from amazon-paapi.GetItems
 */
async function fetchAmazonData(commonParameters, requestParameters) {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      return await amazonPaapi.GetItems(commonParameters, requestParameters);
    } catch (err) {
      // If it's a Too Many Requests error, do exponential backoff
      if (err.message.includes("Too Many Requests")) {
        attempt++;
        console.warn(
          `429 Too Many Requests. Retrying attempt ${attempt}/${maxRetries}...`
        );
        const delayMs = 500 * Math.pow(2, attempt); // e.g. 500, 1000, 2000ms
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        // If it's some other error, just throw it up
        throw err;
      }
    }
  }

  // If we exhaust retries, throw an error
  throw new Error("Exceeded maximum retry limit for Amazon API calls.");
}

export default async function handler(req, res) {
  console.log("🔧 Incoming request:", req.method);

  // Handle GET
  if (req.method === "GET") {
    return res
      .status(200)
      .json({ message: "API is working. Use POST to add product." });
  }

  // Reject all other methods
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { asin } = req.body;
    console.log("🟢 ASIN received:", asin);

    if (!asin) {
      return res.status(400).json({ error: "ASIN is required" });
    }

    // Prepare parameters for amazon-paapi
    const commonParameters = {
      AccessKey: process.env.AMAZON_ACCESS_KEY,
      SecretKey: process.env.AMAZON_SECRET_KEY,
      PartnerTag: process.env.AMAZON_PARTNER_TAG, // e.g., "mytag-20"
      PartnerType: "Associates",
      Marketplace: "www.amazon.com",
    };

    const requestParameters = {
      ItemIds: [asin],
      Resources: [
        "Images.Primary.Large",
        "ItemInfo.Title",
        "Offers.Listings.Price",
        "DetailPageURL",
      ],
    };

    console.log("🌍 Sending request to Amazon API...");

    // Use helper with retry logic
    const response = await fetchAmazonData(commonParameters, requestParameters);
    console.log("📦 Amazon response received");

    if (!response?.ItemsResult?.Items?.length) {
      console.warn("❌ Item not found in Amazon response");
      return res.status(404).json({ error: "Item not found" });
    }

    // Extract the first item
    const item = response.ItemsResult.Items[0];
    const productData = {
      asin: item.ASIN,
      title: item.ItemInfo?.Title?.DisplayValue || "Unknown",
      image: item.Images?.Primary?.Large?.URL || "",
      price: item.Offers?.Listings?.[0]?.Price?.DisplayAmount || "N/A",
      url: item.DetailPageURL,
      timestamp: Date.now(),
    };

    console.log("📥 Saving to Firebase DB:", productData);

    const db = getDatabase();
    await db.ref(`products/${productData.asin}`).set(productData);

    console.log("✅ Product saved successfully");

    return res.status(200).json({ success: true, product: productData });
  } catch (err) {
    console.error("🔥 Amazon API error:", err.message);
    console.error(err.stack);
    return res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
}
