// HTTPS callable: requestTryOn
//
// Replaces the reference repo's self-hosted OOTDiffusion virtual try-on, and
// an earlier revision of this module that used the paid FASHN.ai API, with
// Gemini 2.5 Flash Image ("nano banana") -- an image-generation/editing
// model on the same free-tier Gemini API already used for recommendations
// and photo analysis. No separate API key, no job/polling: Gemini returns
// the generated image directly in the response.

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const geminiApiKey = defineSecret("GEMINI_API_KEY");

const TRY_ON_PROMPT =
  "Edit the first image: dress the person in it with the garment shown in " +
  "the second image. Keep the person's pose, face, and background " +
  "unchanged -- only replace/add the clothing item.";

const fetchImageAsBase64 = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new HttpsError("invalid-argument", `Could not fetch image: ${response.status}`);
  }
  const contentType = response.headers.get("content-type") || "image/jpeg";
  const buffer = Buffer.from(await response.arrayBuffer());
  return { data: buffer.toString("base64"), mimeType: contentType };
};

const requestTryOn = onCall(
  { secrets: [geminiApiKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in to use virtual try-on");
    }
    const { photoUrl, garmentImageUrl } = request.data || {};
    if (!photoUrl || !garmentImageUrl) {
      throw new HttpsError("invalid-argument", "photoUrl and garmentImageUrl are required");
    }

    const [personImage, garmentImage] = await Promise.all([
      fetchImageAsBase64(photoUrl),
      fetchImageAsBase64(garmentImageUrl),
    ]);

    const genAI = new GoogleGenerativeAI(geminiApiKey.value());
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

    const result = await model.generateContent([
      TRY_ON_PROMPT,
      { inlineData: { data: personImage.data, mimeType: personImage.mimeType } },
      { inlineData: { data: garmentImage.data, mimeType: garmentImage.mimeType } },
    ]);

    const imagePart = result.response.candidates?.[0]?.content?.parts?.find((part) => part.inlineData);
    if (!imagePart) {
      throw new HttpsError("internal", "Gemini did not return a generated image");
    }

    return {
      resultImageUrl: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`,
    };
  }
);

module.exports = { requestTryOn };
