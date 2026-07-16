// src/utils/__tests__/permissions.test.js
import { getAuth } from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database";
import {
  getCurrentUserRole,
  getUserAccess,
  getOwnedProductIds,
} from "../permissions";

// CRA's jest config runs with `resetMocks: true`, which wipes every mock
// implementation (including the ones from the firebase/auth and
// firebase/database factories in setupTests.js) before each test. So rather
// than mutate the shared mock auth object, each test below sets its own
// `getAuth` return value directly, and `getDatabase`/`get` are re-primed with
// sane defaults here.
describe("permissions", () => {
  beforeEach(() => {
    getAuth.mockReturnValue({ currentUser: null });
    getDatabase.mockReturnValue({});
    get.mockImplementation(() =>
      Promise.resolve({ exists: () => false, val: () => null })
    );
  });

  describe("getOwnedProductIds", () => {
    it("should return an empty array when uid is falsy (no db lookup performed)", async () => {
      const result = await getOwnedProductIds(null);
      expect(result).toEqual([]);
      expect(get).not.toHaveBeenCalled();
    });

    it("should return an empty array when uid is undefined", async () => {
      const result = await getOwnedProductIds(undefined);
      expect(result).toEqual([]);
      expect(get).not.toHaveBeenCalled();
    });

    it("should return the list of owned product ids when the index node exists", async () => {
      get.mockImplementationOnce(() =>
        Promise.resolve({
          exists: () => true,
          val: () => ({ productA: true, productB: true }),
        })
      );

      const result = await getOwnedProductIds("owner-1");

      expect(result).toEqual(["productA", "productB"]);
      expect(ref).toHaveBeenCalledWith(expect.anything(), "products_by_owner/owner-1");
    });

    it("should return an empty array when the index node does not exist", async () => {
      get.mockImplementationOnce(() =>
        Promise.resolve({
          exists: () => false,
          val: () => null,
        })
      );

      const result = await getOwnedProductIds("owner-with-nothing");
      expect(result).toEqual([]);
    });
  });

  describe("getUserAccess", () => {
    it("should return all-false access when no user is logged in", async () => {
      getAuth.mockReturnValue({ currentUser: null });

      const result = await getUserAccess({ added_by: "someone" });

      expect(result).toEqual({
        isLoggedIn: false,
        isSuperAdmin: false,
        isAuthor: false,
        canEdit: false,
        user: null,
        role: null,
      });
      expect(get).not.toHaveBeenCalled();
    });

    it("should grant full access for a superAdmin user", async () => {
      const superAdminUser = { uid: "admin-1", email: "admin@test.com" };
      getAuth.mockReturnValue({ currentUser: superAdminUser });

      get
        .mockImplementationOnce(() =>
          // superAdmins/admin-1
          Promise.resolve({ exists: () => true, val: () => true })
        )
        .mockImplementationOnce(() =>
          // users/admin-1
          Promise.resolve({
            exists: () => true,
            val: () => ({ role: "superAdmin" }),
          })
        );

      const product = { added_by: "someone-else" };
      const result = await getUserAccess(product);

      expect(result).toEqual({
        isLoggedIn: true,
        isSuperAdmin: true,
        isAuthor: false,
        canEdit: true,
        user: superAdminUser,
        role: "superAdmin",
      });
    });

    it("should grant canEdit only via authorship for a regular editor user who owns the product", async () => {
      const editorUser = { uid: "editor-1", email: "editor@test.com" };
      getAuth.mockReturnValue({ currentUser: editorUser });

      get
        .mockImplementationOnce(() =>
          // superAdmins/editor-1 - not an admin
          Promise.resolve({ exists: () => false, val: () => null })
        )
        .mockImplementationOnce(() =>
          // users/editor-1
          Promise.resolve({
            exists: () => true,
            val: () => ({ role: "editor" }),
          })
        );

      const product = { added_by: "editor-1" };
      const result = await getUserAccess(product);

      expect(result).toEqual({
        isLoggedIn: true,
        isSuperAdmin: false,
        isAuthor: true,
        canEdit: true,
        user: editorUser,
        role: "editor",
      });
    });

    it("should deny canEdit for a regular editor who does not own the product", async () => {
      const editorUser = { uid: "editor-2", email: "editor2@test.com" };
      getAuth.mockReturnValue({ currentUser: editorUser });

      get
        .mockImplementationOnce(() =>
          Promise.resolve({ exists: () => false, val: () => null })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            exists: () => true,
            val: () => ({ role: "editor" }),
          })
        );

      const product = { added_by: "someone-else" };
      const result = await getUserAccess(product);

      expect(result.isAuthor).toBe(false);
      expect(result.canEdit).toBe(false);
      expect(result.isSuperAdmin).toBe(false);
    });

    it("should default role to 'editor' when the user record does not exist yet", async () => {
      const newUser = { uid: "new-user", email: "new@test.com" };
      getAuth.mockReturnValue({ currentUser: newUser });

      get
        .mockImplementationOnce(() =>
          Promise.resolve({ exists: () => false, val: () => null })
        )
        .mockImplementationOnce(() =>
          // users/new-user does not exist yet
          Promise.resolve({ exists: () => false, val: () => null })
        );

      const result = await getUserAccess({ added_by: "new-user" });

      expect(result.role).toBe("editor");
      expect(result.isAuthor).toBe(true);
      expect(result.canEdit).toBe(true);
    });
  });

  describe("getCurrentUserRole", () => {
    it("should return null role and isSuperAdmin false when no user is logged in", async () => {
      getAuth.mockReturnValue({ currentUser: null });

      const result = await getCurrentUserRole();

      expect(result).toEqual({ role: null, isSuperAdmin: false, user: null });
      expect(get).not.toHaveBeenCalled();
    });

    it("should return isSuperAdmin true and role from the users table for a superAdmin", async () => {
      const superAdminUser = { uid: "admin-2", email: "admin2@test.com" };
      getAuth.mockReturnValue({ currentUser: superAdminUser });

      get
        .mockImplementationOnce(() =>
          Promise.resolve({ exists: () => true, val: () => true })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            exists: () => true,
            val: () => ({ role: "superAdmin" }),
          })
        );

      const result = await getCurrentUserRole();

      expect(result).toEqual({
        role: "superAdmin",
        isSuperAdmin: true,
        user: superAdminUser,
      });
    });

    it("should return the editor role for a regular authenticated user", async () => {
      const editorUser = { uid: "editor-3", email: "editor3@test.com" };
      getAuth.mockReturnValue({ currentUser: editorUser });

      get
        .mockImplementationOnce(() =>
          Promise.resolve({ exists: () => false, val: () => null })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            exists: () => true,
            val: () => ({ role: "editor" }),
          })
        );

      const result = await getCurrentUserRole();

      expect(result).toEqual({
        role: "editor",
        isSuperAdmin: false,
        user: editorUser,
      });
    });

    it("should default role to 'editor' when the user record does not exist yet", async () => {
      const newUser = { uid: "new-user-2", email: "new2@test.com" };
      getAuth.mockReturnValue({ currentUser: newUser });

      get
        .mockImplementationOnce(() =>
          Promise.resolve({ exists: () => false, val: () => null })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({ exists: () => false, val: () => null })
        );

      const result = await getCurrentUserRole();

      expect(result).toEqual({
        role: "editor",
        isSuperAdmin: false,
        user: newUser,
      });
    });

    it("should fall back to role 'editor' and isSuperAdmin false when the database calls throw", async () => {
      const userWhoErrors = { uid: "error-user", email: "err@test.com" };
      getAuth.mockReturnValue({ currentUser: userWhoErrors });

      get.mockImplementationOnce(() => Promise.reject(new Error("RTDB unavailable")));

      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const result = await getCurrentUserRole();

      expect(result).toEqual({
        role: "editor",
        isSuperAdmin: false,
        user: userWhoErrors,
      });
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});
