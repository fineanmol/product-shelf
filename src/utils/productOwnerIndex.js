// Keeps products_by_owner/$uid/$productId in sync with products/$productId.added_by.
// RTDB has no server-side referential integrity, so every write path that creates,
// deletes, or reassigns a product must update this index in the same atomic update.

export const withOwnerIndexOnCreate = (updates, productId, ownerUid) => {
  updates[`products_by_owner/${ownerUid}/${productId}`] = true;
  return updates;
};

export const withOwnerIndexOnDelete = (updates, productId, ownerUid) => {
  updates[`products_by_owner/${ownerUid}/${productId}`] = null;
  return updates;
};

// For ownership transfer (e.g. reassigning added_by to a different uid).
export const withOwnerIndexOnReassign = (updates, productId, fromUid, toUid) => {
  if (fromUid) updates[`products_by_owner/${fromUid}/${productId}`] = null;
  updates[`products_by_owner/${toUid}/${productId}`] = true;
  return updates;
};
