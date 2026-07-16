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

  const db = getDatabase();
  
  // Check if user is super admin
  const adminRef = ref(db, `superAdmins/${currentUser.uid}`);
  const adminSnap = await get(adminRef);
  const isSuperAdmin = adminSnap.exists() && adminSnap.val() === true;

  // Get user role from users table
  const userRef = ref(db, `users/${currentUser.uid}`);
  const userSnap = await get(userRef);
  const userData = userSnap.exists() ? userSnap.val() : {};
  
  // Default role is 'editor' if not specified
  const role = userData.role || 'editor';

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

  const db = getDatabase();
  
  try {
    // Check if user is super admin
    const adminRef = ref(db, `superAdmins/${currentUser.uid}`);
    const adminSnap = await get(adminRef);
    const isSuperAdmin = adminSnap.exists() && adminSnap.val() === true;

    // Get user role from users table
    const userRef = ref(db, `users/${currentUser.uid}`);
    const userSnap = await get(userRef);
    const userData = userSnap.exists() ? userSnap.val() : {};
    
    // Default role is 'editor' if not specified
    const role = userData.role || 'editor';

    

    return {
      role,
      isSuperAdmin,
      user: currentUser,
    };
  } catch (error) {
    console.error('Error getting user role:', error);
    return { role: 'editor', isSuperAdmin: false, user: currentUser };
  }
};

export const filterDataByUserRole = (data, userRole, userId, isSuperAdmin) => {
  if (isSuperAdmin) {
    // Super admins see everything
    return data;
  }

  // Every non-superAdmin role (only "editor" exists today) only sees their own data.
  return data.filter(item => item.added_by === userId);
};
