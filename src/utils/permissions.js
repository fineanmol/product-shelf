// src/utils/permissions.js
import { getAuth } from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database";

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
    };
  }

  const db = getDatabase();
  const adminRef = ref(db, `superAdmins/${currentUser.uid}`);
  const snap = await get(adminRef);

  // 2. If snap.val() === true, the user is super admin.
  const isSuperAdmin = snap.exists() && snap.val() === true;

  // 3. isAuthor checks product’s 'added_by'.
  const isAuthor = currentUser.uid === product?.added_by;

  // 4. canEdit if the user is either the author or a super admin.
  const canEdit = isAuthor || isSuperAdmin;

  return {
    isLoggedIn: true,
    isSuperAdmin,
    isAuthor,
    canEdit,
    user: currentUser,
  };
};
