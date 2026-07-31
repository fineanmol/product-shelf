// HTTPS callable: getStylistRecommendations
//
// Holds the Gemini API key server-side (never shipped to the client bundle).
// Flow: read the real product-shelf catalog -> narrow it with
// selectCandidates (cascading filter relaxation, see stylistRecommender.js)
// -> hand the narrowed candidate list + quiz answers to Gemini, constrained
// to only ever reference the given candidate ids (never invent products) ->
// return grouped outfits with a one-line "why this outfit" rationale each.

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { selectCandidates } = require("./stylistRecommender");

const geminiApiKey = defineSecret("GEMINI_API_KEY");

if (!admin.apps.length) {
  admin.initializeApp();
}

const buildPrompt = (quiz, context, candidates) => `
You are a personal stylist for the SkyMarket product catalog. Choose outfits
using ONLY the products listed below (reference them by "id" exactly as
given) — never invent a product that is not in this list.

Shopper preferences: ${JSON.stringify(quiz)}
Extra context (may include weather, season, occasion, city, and time of day; may be empty): ${JSON.stringify(context || {})}

Candidate products (id, title, category, price, colors):
${JSON.stringify(
  candidates.map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category,
    price: p.price,
    colors: p.colors || (p.color ? [p.color] : []),
  }))
)}

Return ONLY valid JSON (no markdown fences) matching this shape:
{
  "outfits": [
    {
      "title": "short outfit name",
      "productIds": ["id1", "id2"],
      "rationale": "one sentence explaining why this works for the shopper"
    }
  ]
}
Return at most 6 outfits. Only use ids present in the candidate list above.
`;

const parseGeminiJson = (text) => {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "");
  return JSON.parse(cleaned);
};

// Drops any outfit referencing a productId Gemini hallucinated outside the
// candidate list, and any outfit left with zero valid items afterward —
// belt-and-suspenders alongside the prompt constraint above.
const sanitizeOutfits = (outfits, candidates) => {
  const validIds = new Set(candidates.map((p) => p.id));
  return (outfits || [])
    .map((outfit) => ({
      ...outfit,
      productIds: (outfit.productIds || []).filter((id) => validIds.has(id)),
    }))
    .filter((outfit) => outfit.productIds.length > 0);
};

const getStylistRecommendations = onCall(
  { secrets: [geminiApiKey] },
  async (request) => {
    const { quiz, context } = request.data || {};
    if (!quiz || !quiz.gender) {
      throw new HttpsError("invalid-argument", "quiz.gender is required");
    }

    const db = admin.database();
    const snapshot = await db.ref("products").get();
    const productsData = snapshot.exists() ? snapshot.val() : {};
    const products = Object.entries(productsData).map(([id, product]) => ({ id, ...product }));

    const { stageName, candidates } = selectCandidates(products, quiz);
    if (candidates.length === 0) {
      return { stageName, outfits: [] };
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey.value());
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(buildPrompt(quiz, context, candidates));
    const parsed = parseGeminiJson(result.response.text());
    const outfits = sanitizeOutfits(parsed.outfits, candidates);

    return { stageName, outfits };
  }
);

module.exports = { getStylistRecommendations };
