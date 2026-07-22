// src/services/productsService.js
//
// Shared Firebase Realtime Database data-access layer for PRODUCTS.
//
// This centralizes the get/push/update/remove calls against `products/*` and
// the `products_by_owner/*` index that were previously duplicated across
// ProductManager.jsx, admin/Products.jsx, BulkImport.jsx, dashboard.jsx,
// SummaryCards.jsx, DashboardProducts.jsx, Home.jsx and ProductDetails.jsx.
//
// Out of scope (deliberately not touched here): users, interests, feedback.
//
// Index maintenance still delegates to src/utils/productOwnerIndex.js so the
// exact same products_by_owner semantics keep living in one place; this
// module is just the single call site every UI component now goes through.

import { getDatabase, ref, get, push, update, remove, runTransaction } from "firebase/database";
import {
  withOwnerIndexOnCreate,
  withOwnerIndexOnDelete,
  withOwnerIndexOnReassign,
} from "../utils/productOwnerIndex";

const productsPath = (id) => `products/${id}`;

// Fetch a single product by id. Returns null if it doesn't exist.
export const getProduct = async (id) => {
  const db = getDatabase();
  const snap = await get(ref(db, productsPath(id)));
  return snap.exists() ? { id, ...snap.val() } : null;
};

// Fetch the full products tree. Intended for superAdmins only — callers are
// responsible for checking role before calling this (matches existing usage).
export const getAllProducts = async () => {
  const db = getDatabase();
  const snap = await get(ref(db, "products"));
  if (!snap.exists()) return [];
  const data = snap.val();
  return Object.entries(data).map(([id, product]) => ({ id, ...product }));
};

// Fetch only the products owned by `uid`, via the products_by_owner index
// followed by a per-id fetch. This is the pattern that used to be inlined in
// Products.jsx, SummaryCards.jsx, DashboardProducts.jsx, BulkImport.jsx and
// InterestsTable.jsx: products/.read is public, but a plain fetch-then-filter
// would still download every seller's inventory to the browser before
// discarding it, so non-superadmins always go through the owner index.
export const getOwnedProducts = async (uid) => {
  if (!uid) return [];
  const db = getDatabase();
  const indexSnap = await get(ref(db, `products_by_owner/${uid}`));
  if (!indexSnap.exists()) return [];
  const ownedIds = Object.keys(indexSnap.val());
  const owned = await Promise.all(
    ownedIds.map(async (id) => {
      const snap = await get(ref(db, productsPath(id)));
      return snap.exists() ? { id, ...snap.val() } : null;
    })
  );
  return owned.filter(Boolean);
};

// Creates a new product and atomically maintains the products_by_owner
// index, matching withOwnerIndexOnCreate's existing semantics. Returns the
// new product id.
export const createProduct = async (payload, ownerUid) => {
  const db = getDatabase();
  const newProductRef = push(ref(db, "products"));
  const updates = { [productsPath(newProductRef.key)]: payload };
  if (ownerUid) {
    withOwnerIndexOnCreate(updates, newProductRef.key, ownerUid);
  }
  await update(ref(db), updates);
  return newProductRef.key;
};

// Patches an existing product. Does not touch the owner index — use
// reassignProductOwner for ownership changes.
export const updateProduct = async (id, patch) => {
  const db = getDatabase();
  await update(ref(db, productsPath(id)), patch);
};

// Deletes a product and atomically maintains the products_by_owner index,
// matching withOwnerIndexOnDelete's existing semantics.
export const deleteProduct = async (id, ownerUid) => {
  const db = getDatabase();
  const updates = withOwnerIndexOnDelete({}, id, ownerUid);
  await update(ref(db), updates);
  await remove(ref(db, productsPath(id)));
};

// Reassigns a product's owner (e.g. superAdmin assigning a product to a
// different seller), atomically maintaining the products_by_owner index,
// matching withOwnerIndexOnReassign's existing semantics. `extraFields` are
// plain field names (e.g. { added_by, added_email, updatedAt }) scoped under
// this product in the same multi-path update — callers should NOT pass
// already-prefixed RTDB paths.
export const reassignProductOwner = async (id, fromUid, toUid, extraFields = {}) => {
  const db = getDatabase();
  const namespacedFields = Object.fromEntries(
    Object.entries(extraFields).map(([key, value]) => [`${productsPath(id)}/${key}`, value])
  );
  const updates = withOwnerIndexOnReassign(namespacedFields, id, fromUid, toUid);
  await update(ref(db), updates);
};

// Atomically increments a product's interestCount by 1, matching the
// runTransaction pattern already used in Home.jsx and ProductDetails.jsx.
export const incrementInterestCount = async (productId) => {
  const db = getDatabase();
  await runTransaction(
    ref(db, `${productsPath(productId)}/interestCount`),
    (current) => (current || 0) + 1
  );
};

// Fetch every product marked sold (status === 'sold'), for the admin Sales
// Report page. Reuses getAllProducts/getOwnedProducts rather than duplicating
// their Firebase call logic, then filters client-side — same superAdmin vs.
// owned-only split every other read in this module already follows.
export const getSoldProducts = async (uid, isSuperAdmin) => {
  const products = isSuperAdmin ? await getAllProducts() : await getOwnedProducts(uid);
  return products.filter((product) => product.status === "sold");
};
