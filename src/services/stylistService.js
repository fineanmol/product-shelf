// src/services/stylistService.js
//
// Client-side data-access layer for the AI stylist module, mirroring
// productsService.js's pattern. Gemini calls go straight to geminiClient.js
// from the browser (see that file's header comment for why: deploying any
// Cloud Function requires the paid Firebase Blaze plan, which conflicts with
// this app's "free APIs only, no billing account" requirement).

import { getDatabase, ref, get, push, set, update, remove } from "firebase/database";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { selectCandidates } from "../utils/stylistRecommender";
import * as geminiClient from "./geminiClient";

const boardsPath = (uid) => `stylistBoards/${uid}`;
const wardrobePath = (uid) => `wardrobeItems/${uid}`;

// Races a promise against a hard timeout so a stalled network call (Storage
// upload, Gemini request) fails with a clear error instead of hanging the
// UI forever with no feedback -- this is what previously showed as "stuck at
// Analyzing/Processing..." with no way to tell which call was the problem.
const withTimeout = (promise, ms, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s. Please try again.`)), ms)
    ),
  ]);

// Reads the full product catalog for candidate selection. Deliberately NOT
// reusing productsService.js's getAllProducts(), whose doc comment reserves
// it for superAdmin-gated call sites even though the underlying RTDB rule
// (products/.read: true) is public — the stylist module needs the whole
// catalog for every visitor, so it gets its own equivalent read here rather
// than calling a helper documented as superAdmin-only.
const getCatalogForRecommendations = async () => {
  const db = getDatabase();
  const snap = await get(ref(db, "products"));
  if (!snap.exists()) return [];
  return Object.entries(snap.val()).map(([id, product]) => ({ id, ...product }));
};

// Runs candidate selection (cascading filter relaxation) against the live
// catalog, then asks Gemini to group the result into outfits. Returns
// { stageName, outfits, products } — products is the full candidate list so
// callers can render outfit cards without a second round-trip per product id.
export const getStylistRecommendations = async (quiz, context = {}) => {
  const catalog = await getCatalogForRecommendations();
  const { stageName, candidates } = selectCandidates(catalog, quiz);
  const { outfits } = await withTimeout(
    geminiClient.generateOutfits(quiz, context, candidates),
    30000,
    "Gemini outfit generation"
  );
  return { stageName, outfits, products: candidates };
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
// read/write scope. This is now purely for persistence (so a saved board can
// re-render the photo later) — analysis and try-on work directly off the
// in-memory File/Blob and no longer need this upload to happen first.
export const uploadStylistPhoto = async (uid, file, kind) => {
  const storage = getStorage();
  const path = `stylistPhotos/${uid}/${kind}-${Date.now()}-${file.name}`;
  const fileRef = storageRef(storage, path);
  await withTimeout(uploadBytes(fileRef, file), 30000, "Photo upload");
  return withTimeout(getDownloadURL(fileRef), 15000, "Fetching photo URL");
};

// kind: "selfie" | "wardrobe". Takes the raw File/Blob directly and returns
// Gemini's structured description of the photo (skin tone/style for
// selfies, category/colors/styleTags for wardrobe items) — see
// geminiClient.js's analyzePhoto.
export const analyzePhoto = async (file, kind) =>
  withTimeout(geminiClient.analyzePhoto(file, kind), 30000, "Gemini photo analysis");

// Runs virtual try-on via Gemini 2.5 Flash Image and returns { resultImageUrl }
// directly — Gemini generates the composite image synchronously, so there's
// no job id to poll. personFile is the user's own photo (File/Blob);
// garmentImageUrl is a public catalog image URL.
export const requestTryOn = async (personFile, garmentImageUrl) => {
  const resultImageUrl = await withTimeout(
    geminiClient.generateTryOnImage(personFile, garmentImageUrl),
    45000,
    "Virtual try-on generation"
  );
  return { resultImageUrl };
};

// Persists an analyzed wardrobe photo under wardrobeItems/$uid/$itemId, so it
// survives past the current quiz session -- mirrors saveBoard's pattern.
// item shape: { photoUrl, category, colors, styleTags }.
export const saveWardrobeItem = async (uid, item) => {
  const db = getDatabase();
  const newItemRef = push(ref(db, wardrobePath(uid)));
  await set(newItemRef, { ...item, createdAt: Date.now() });
  return newItemRef.key;
};

// Fetches every saved wardrobe item for a shopper, for the /stylist/wardrobe
// management page and for generating outfits from a persisted wardrobe
// (rather than only the current quiz session's in-memory uploads).
export const getWardrobeItems = async (uid) => {
  if (!uid) return [];
  const db = getDatabase();
  const snap = await get(ref(db, wardrobePath(uid)));
  if (!snap.exists()) return [];
  const data = snap.val();
  return Object.entries(data).map(([id, item]) => ({ id, ...item }));
};

// Patches a wardrobe item's AI-generated fields (category/colors/styleTags)
// after the user edits them in the management UI.
export const updateWardrobeItem = async (uid, itemId, patch) => {
  const db = getDatabase();
  await update(ref(db, `${wardrobePath(uid)}/${itemId}`), patch);
};

export const deleteWardrobeItem = async (uid, itemId) => {
  const db = getDatabase();
  await remove(ref(db, `${wardrobePath(uid)}/${itemId}`));
};
