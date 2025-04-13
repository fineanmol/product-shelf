import { initializeApp, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
// Example library for Amazon PA API. You could also do raw fetch + signature
import { PAAPIv5Client } from "amazon-paapi";
import serviceAccount from "./firebase-service-account.json"; // or env

// Make sure we initialize the app only once
if (!global.firebaseAdminInitialized) {
  initializeApp({
    credential: cert(serviceAccount),
    databaseURL:
      "https://product-shelf-inventory-default-rtdb.europe-west1.firebasedatabase.app",
  });
  global.firebaseAdminInitialized = true;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { asin } = JSON.parse(req.body || "{}");
  if (!asin) {
    return res.status(400).json({ error: "ASIN is required" });
  }

  try {
    // Initialize Amazon PA API client
    const client = new PAAPIv5Client({
      accessKey: process.env.AMAZON_ACCESS_KEY,
      secretKey: process.env.AMAZON_SECRET_KEY,
      partnerTag: process.env.AMAZON_PARTNER_TAG,
      partnerType: "Associates",
      marketplace: "www.amazon.com",
    });

    // Fetch the product details by ASIN
    const response = await client.getItems([asin]);
    if (!response?.ItemsResult?.Items?.length) {
      return res.status(404).json({ error: "Item not found" });
    }

    const item = response.ItemsResult.Items[0];
    const productData = {
      asin: item.ASIN,
      title: item.ItemInfo.Title?.DisplayValue || "Unknown",
      image: item.Images?.Primary?.Large?.URL || "",
      price: item.Offers?.Listings?.[0]?.Price?.DisplayAmount || "N/A",
      url: item.DetailPageURL,
      timestamp: Date.now(),
      // add your own fields as needed
    };

    const db = getDatabase();
    // Store in "products" node with key = ASIN
    await db.ref(`products/${productData.asin}`).set(productData);

    return res.status(200).json({ success: true, product: productData });
  } catch (err) {
    console.error("Amazon API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
