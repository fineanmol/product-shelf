// src/services/geminiClient.js
//
// Browser-side Gemini calls for the AI stylist module. Ported from the
// former Cloud Functions (functions/stylist.js, stylistPhotoAnalysis.js,
// stylistTryOn.js) after discovering that deploying ANY Cloud Function
// requires the Firebase project to be on the paid Blaze plan (confirmed via
// a real failed `firebase deploy --only functions` run) -- which conflicts
// with the explicit "free APIs / no billing account" requirement for this
// app. The API key therefore ships in the client bundle; mitigate by
// restricting it to this app's deployed domain(s) via HTTP referrer in
// Google Cloud Console (Credentials > the API key > Application restrictions).
// This is the same category of exposure as the already-public Firebase
// client config in src/firebase.js -- not secret, but restricted to this
// app's own origins.

import { GoogleGenerativeAI } from "@google/generative-ai";

const getClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "VITE_GEMINI_API_KEY is not set. Add it to .env.local (see README) and restart the dev server."
    );
  }
  return new GoogleGenerativeAI(apiKey);
};

const parseGeminiJson = (text) => {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "");
  return JSON.parse(cleaned);
};

// Reads a File/Blob into the { data, mimeType } shape Gemini's inlineData
// parts expect, without the Buffer/fetch-a-URL approach the old server-side
// version used (the file is already in memory client-side).
const fileToInlineImage = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
      resolve({ data: base64, mimeType: file.type || "image/jpeg" });
    };
    reader.readAsDataURL(file);
  });

const urlToInlineImage = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not fetch image: ${response.status}`);
  }
  const blob = await response.blob();
  return fileToInlineImage(new File([blob], "image", { type: blob.type }));
};

// ---- Outfit recommendations (was functions/stylist.js) ----

const buildOutfitsPrompt = (quiz, context, candidates) => `
You are a personal stylist for the SkyMarket product catalog. Choose outfits
using ONLY the products listed below (reference them by "id" exactly as
given) — never invent a product that is not in this list.

A COMPLETE outfit must pair items across categories, not just list one item.
At minimum, try to include one top-half item (e.g. top, shirt, dress,
outerwear) AND one bottom-half item (e.g. bottom, pants, skirt) in every
outfit, and add footwear or an accessory when a suitable one is available in
the candidates. A "dress" or "jumpsuit" on its own already covers top+bottom
and does not need a separate bottom. Only fall back to a single-item or
partial outfit if the candidate list genuinely has nothing in the missing
category — never invent an item to fill a gap.

Shopper preferences: ${JSON.stringify(quiz)}
Extra context (may include weather, season, occasion, city, and time of day; may be empty): ${JSON.stringify(context || {})}

Candidate products (id, title, category, price, colors) — category tells you
which "slot" (top/bottom/dress/footwear/accessory/outerwear) each item fills:
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
      "rationale": "one sentence explaining why this works for the shopper, and why these categories were paired together"
    }
  ]
}
Return at most 6 outfits, each a genuinely complete look wherever the candidate list allows it. Only use ids present in the candidate list above.
`;

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

export const generateOutfits = async (quiz, context, candidates) => {
  if (candidates.length === 0) return { outfits: [] };

  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(buildOutfitsPrompt(quiz, context, candidates));
  const parsed = parseGeminiJson(result.response.text());
  return { outfits: sanitizeOutfits(parsed.outfits, candidates) };
};

// ---- Photo analysis (was functions/stylistPhotoAnalysis.js) ----

// Fixed named palette, matching the reference repo's swatch-picker concept
// (trimmed from its 11 swatches to 6 -- enough signal without over-asking).
export const SKIN_TONE_PALETTE = ["deep", "rich", "tan", "medium", "light", "fair"];

const SELFIE_PROMPT = `
Look at this photo of a person and describe it for outfit-recommendation
purposes. Return ONLY valid JSON (no markdown fences) matching this shape:
{
  "skinTone": one of ${JSON.stringify(SKIN_TONE_PALETTE)},
  "apparentStyle": "a short phrase, e.g. 'casual streetwear' or 'classic formal'",
  "ageRange": "a broad range like '20-30', never an exact guess"
}
Do not attempt to identify the person or make any claims beyond these three
fields. If the image does not clearly show a person, set all fields to null.
`;

const WARDROBE_PROMPT = `
Look at this photo of a clothing item and describe it. Return ONLY valid
JSON (no markdown fences) matching this shape:
{
  "category": "e.g. top, bottom, dress, footwear, accessory",
  "colors": ["primary color", "secondary color if any"],
  "styleTags": ["short style descriptors, e.g. casual, formal, sporty"]
}
If the image does not clearly show a single clothing item, set all fields to null.
`;

// kind: "selfie" | "wardrobe". Takes the raw File/Blob directly -- no
// Storage round-trip required before analysis (unlike the old server-side
// version, which had to fetch a download URL since Cloud Functions can't
// read the browser's in-memory file).
export const analyzePhoto = async (imageFile, kind) => {
  const image = await fileToInlineImage(imageFile);
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = kind === "selfie" ? SELFIE_PROMPT : WARDROBE_PROMPT;
  const result = await model.generateContent([
    prompt,
    { inlineData: { data: image.data, mimeType: image.mimeType } },
  ]);

  return parseGeminiJson(result.response.text());
};

// ---- Virtual try-on (was functions/stylistTryOn.js) ----

const TRY_ON_PROMPT =
  "Edit the first image: dress the person in it with the garment shown in " +
  "the second image. Keep the person's pose, face, and background " +
  "unchanged -- only replace/add the clothing item.";

// personImageFile: File/Blob (the user's own photo). garmentImageUrl: a
// public catalog image URL (fetched client-side into a blob since Gemini
// needs inline image data, not a bare URL). Returns a data: URL directly --
// no job id/polling, since Gemini's image response comes back synchronously.
export const generateTryOnImage = async (personImageFile, garmentImageUrl) => {
  const [personImage, garmentImage] = await Promise.all([
    fileToInlineImage(personImageFile),
    urlToInlineImage(garmentImageUrl),
  ]);

  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

  const result = await model.generateContent([
    TRY_ON_PROMPT,
    { inlineData: { data: personImage.data, mimeType: personImage.mimeType } },
    { inlineData: { data: garmentImage.data, mimeType: garmentImage.mimeType } },
  ]);

  const imagePart = result.response.candidates?.[0]?.content?.parts?.find((part) => part.inlineData);
  if (!imagePart) {
    throw new Error("Gemini did not return a generated image");
  }

  return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
};
