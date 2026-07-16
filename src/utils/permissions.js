// src/utils/permissions.js
import { getAuth } from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database";

// Returns the set of product IDs owned by uid, from the products_by_owner index.
export const getOwnedProductIds = async (uid) => {
  if (!uid) return [];
  const db = getDatabase();
  const snap = await get(ref(db, `products_by_owner/${uid}`));
  return snap.exists() ? Object.keys(snap.val()) : [];
};

// Shared internal helper: fetches superAdmins/${uid} and users/${uid} from
// RTDB and derives { isSuperAdmin, role } for the given user. Centralizes
// the fetch/derivation logic (including the 'editor' default role and a
// consistent try/catch fallback) that getUserAccess and getCurrentUserRole
// both need, so they no longer duplicate it independently.
const fetchUserRoleData = async (uid) => {
  const db = getDatabase();

  try {
    // Check if user is super admin
    const adminRef = ref(db, `superAdmins/${uid}`);
    const adminSnap = await get(adminRef);
    const isSuperAdmin = adminSnap.exists() && adminSnap.val() === true;

    // Get user role from users table
    const userRef = ref(db, `users/${uid}`);
    const userSnap = await get(userRef);
    const userData = userSnap.exists() ? userSnap.val() : {};

    // Default role is 'editor' if not specified
    const role = userData.role || 'editor';

    return { isSuperAdmin, role };
  } catch (error) {
    console.error('Error getting user role:', error);
    // Fall back to the safest defaults: non-privileged 'editor' role and
    // no super-admin access.
    return { isSuperAdmin: false, role: 'editor' };
  }
};

export const getUserAccess = async (product) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  // 1. If no user is logged in, everything is false.
  if (!currentUser) {
    return {
      isLoggedIn: false,
      isSuperAdmin: false,
      isAuthor: false,
      canEdit: false,
      user: null,
      role: null,
    };
  }

  const { isSuperAdmin, role } = await fetchUserRoleData(currentUser.uid);

  // 3. isAuthor checks product's 'added_by'.
  const isAuthor = currentUser.uid === product?.added_by;

  // 4. canEdit if the user is either the author or a super admin.
  const canEdit = isAuthor || isSuperAdmin;

  return {
    isLoggedIn: true,
    isSuperAdmin,
    isAuthor,
    canEdit,
    user: currentUser,
    role,
  };
};

export const getCurrentUserRole = async () => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    return { role: null, isSuperAdmin: false, user: null };
  }

  const { isSuperAdmin, role } = await fetchUserRoleData(currentUser.uid);

  return {
    role,
    isSuperAdmin,
    user: currentUser,
  };
};
