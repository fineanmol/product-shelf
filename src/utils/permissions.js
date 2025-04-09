// src/utils/permissions.js
import { getAuth } from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database";

export const getUserAccess = async (product) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const isLoggedIn = !!currentUser;
  let isSuperAdmin = false;

  if (currentUser) {
    const db = getDatabase();
    const snap = await get(ref(db, `superAdmins/${currentUser.uid}`));
    isSuperAdmin = snap.exists();
  }

  const isAuthor = currentUser?.uid === product?.added_by;
  const canEdit = isAuthor || isSuperAdmin;

  return {
    isLoggedIn,
    isSuperAdmin,
    isAuthor,
    canEdit,
    user: currentUser,
  };
};
