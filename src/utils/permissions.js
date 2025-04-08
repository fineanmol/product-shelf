// src/utils/permissions.js
import { getAuth } from "firebase/auth";

const SUPER_ADMIN_EMAIL = "agarwal.anmol2004@gmail.com";

export const getUserAccess = (product) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const isLoggedIn = !!currentUser;
  const isSuperAdmin = currentUser?.email === SUPER_ADMIN_EMAIL;
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
