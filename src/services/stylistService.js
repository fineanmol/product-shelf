// src/services/stylistService.js
//
// Client-side data-access layer for the AI stylist module, mirroring
// productsService.js's pattern. The actual Gemini call happens server-side
// in functions/stylist.js (getStylistRecommendations callable) — this module
// never talks to Gemini directly, since the API key must not ship to the
// browser bundle.

import { getDatabase, ref, get, push, set, remove } from "firebase/database";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

const boardsPath = (uid) => `stylistBoards/${uid}`;

// Calls the getStylistRecommendations Cloud Function with the shopper's quiz
// answers plus optional context (e.g. { weather, occasion }). Returns
// { stageName, outfits } — outfits is [] when the catalog has literally
// nothing matching this shopper's gender/budget (see selectCandidates).
export const getStylistRecommendations = async (quiz, context = {}) => {
  const functions = getFunctions();
  const callable = httpsCallable(functions, "getStylistRecommendations");
  const { data } = await callable({ quiz, context });
  return data;
};

// Saves a set of recommended product ids as a named board under
// stylistBoards/$uid/$boardId. Requires auth (enforced by database.rules.json).
export const saveBoard = async (uid, board) => {
  const db = getDatabase();
  const newBoardRef = push(ref(db, boardsPath(uid)));
  await set(newBoardRef, { ...board, createdAt: Date.now() });
  return newBoardRef.key;
};

// Fetches every saved board for a shopper.
export const getSavedBoards = async (uid) => {
  if (!uid) return [];
  const db = getDatabase();
  const snap = await get(ref(db, boardsPath(uid)));
  if (!snap.exists()) return [];
  const data = snap.val();
  return Object.entries(data).map(([id, board]) => ({ id, ...board }));
};

export const deleteBoard = async (uid, boardId) => {
  const db = getDatabase();
  await remove(ref(db, `${boardsPath(uid)}/${boardId}`));
};

// Uploads a selfie or wardrobe photo to Storage under the user's own uid
// path (stylistPhotos/$uid/*), matching storage.rules' any-authenticated-user
// read/write scope. Returns the public download URL, which is what the
// analyzeStylistPhoto/requestTryOn callables expect (Cloud Functions can't
// read gs:// paths directly without extra plumbing).
export const uploadStylistPhoto = async (uid, file, kind) => {
  const storage = getStorage();
  const path = `stylistPhotos/${uid}/${kind}-${Date.now()}-${file.name}`;
  const fileRef = storageRef(storage, path);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
};

// kind: "selfie" | "wardrobe". Returns Gemini's structured description of
// the photo (skin tone/style for selfies, category/colors/styleTags for
// wardrobe items) — see functions/stylistPhotoAnalysis.js.
export const analyzePhoto = async (photoUrl, kind) => {
  const functions = getFunctions();
  const callable = httpsCallable(functions, "analyzeStylistPhoto");
  const { data } = await callable({ photoUrl, kind });
  return data;
};

// Runs virtual try-on via Gemini 2.5 Flash Image (see functions/stylistTryOn.js)
// and returns { resultImageUrl } directly — Gemini generates the composite
// image synchronously in the same call, so there's no job id to poll.
export const requestTryOn = async (photoUrl, garmentImageUrl) => {
  const functions = getFunctions();
  const callable = httpsCallable(functions, "requestTryOn");
  const { data } = await callable({ photoUrl, garmentImageUrl });
  return data;
};
