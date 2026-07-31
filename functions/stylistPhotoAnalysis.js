// HTTPS callable: analyzeStylistPhoto
//
// Replaces the reference repo's DeepFace skin-tone/age/gender detection and
// image-based-wardrobe similarity search with a single Gemini vision call —
// no model training, no GPU service. Given a Storage download URL and a
// "kind" ("selfie" | "wardrobe"), asks Gemini to describe the photo as
// structured JSON instead of running a classifier.

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const geminiApiKey = defineSecret("GEMINI_API_KEY");

// Fixed named palette, matching the reference repo's swatch-picker concept
// (trimmed from its 11 swatches to 6 -- enough signal without over-asking).
const SKIN_TONE_PALETTE = [
  "deep",
  "rich",
  "tan",
  "medium",
  "light",
  "fair",
];

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

const parseGeminiJson = (text) => {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "");
  return JSON.parse(cleaned);
};

const fetchImageAsBase64 = async (photoUrl) => {
  const response = await fetch(photoUrl);
  if (!response.ok) {
    throw new HttpsError("invalid-argument", `Could not fetch photo: ${response.status}`);
  }
  const contentType = response.headers.get("content-type") || "image/jpeg";
  const buffer = Buffer.from(await response.arrayBuffer());
  return { data: buffer.toString("base64"), mimeType: contentType };
};

const analyzeStylistPhoto = onCall(
  { secrets: [geminiApiKey] },
  async (request) => {
    const { photoUrl, kind } = request.data || {};
    if (!photoUrl || !["selfie", "wardrobe"].includes(kind)) {
      throw new HttpsError("invalid-argument", "photoUrl and kind ('selfie'|'wardrobe') are required");
    }

    const image = await fetchImageAsBase64(photoUrl);
    const genAI = new GoogleGenerativeAI(geminiApiKey.value());
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = kind === "selfie" ? SELFIE_PROMPT : WARDROBE_PROMPT;
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: image.data, mimeType: image.mimeType } },
    ]);

    return parseGeminiJson(result.response.text());
  }
);

module.exports = { analyzeStylistPhoto, SKIN_TONE_PALETTE };
