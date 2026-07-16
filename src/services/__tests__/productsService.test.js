// src/services/__tests__/productsService.test.js
import { getDatabase, ref, get, push, update, remove, runTransaction } from "firebase/database";
import {
  getProduct,
  getAllProducts,
  getOwnedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  reassignProductOwner,
  incrementInterestCount,
} from "../productsService";

// CRA's jest config runs with `resetMocks: true`, which wipes every mock
// implementation from the firebase/database factory in setupTests.js before
// each test, so sane defaults are re-primed here.
describe("productsService", () => {
  beforeEach(() => {
    getDatabase.mockReturnValue({});
    ref.mockImplementation((db, path) => ({ db, path }));
    get.mockImplementation(() =>
      Promise.resolve({ exists: () => false, val: () => null })
    );
    push.mockImplementation(() => ({ key: "mock-key" }));
    update.mockImplementation(() => Promise.resolve());
    remove.mockImplementation(() => Promise.resolve());
    runTransaction.mockImplementation(() => Promise.resolve());
  });

  describe("getProduct", () => {
    it("should return the product with its id when it exists", async () => {
      get.mockImplementationOnce(() =>
        Promise.resolve({
          exists: () => true,
          val: () => ({ title: "Widget", price: 10 }),
        })
      );

      const result = await getProduct("prod-1");

      expect(result).toEqual({ id: "prod-1", title: "Widget", price: 10 });
      expect(ref).toHaveBeenCalledWith(expect.anything(), "products/prod-1");
    });

    it("should return null when the product does not exist", async () => {
      get.mockImplementationOnce(() =>
        Promise.resolve({ exists: () => false, val: () => null })
      );

      const result = await getProduct("missing-prod");
      expect(result).toBeNull();
    });
  });

  describe("getAllProducts", () => {
    it("should return an empty array when there are no products", async () => {
      get.mockImplementationOnce(() =>
        Promise.resolve({ exists: () => false, val: () => null })
      );

      const result = await getAllProducts();
      expect(result).toEqual([]);
    });

    it("should map the products tree into an array of products with ids", async () => {
      get.mockImplementationOnce(() =>
        Promise.resolve({
          exists: () => true,
          val: () => ({
            "prod-1": { title: "A" },
            "prod-2": { title: "B" },
          }),
        })
      );

      const result = await getAllProducts();

      expect(result).toEqual([
        { id: "prod-1", title: "A" },
        { id: "prod-2", title: "B" },
      ]);
    });
  });

  describe("getOwnedProducts", () => {
    it("should return an empty array when uid is falsy", async () => {
      const result = await getOwnedProducts(null);
      expect(result).toEqual([]);
      expect(get).not.toHaveBeenCalled();
    });

    it("should return an empty array when the owner index does not exist", async () => {
      get.mockImplementationOnce(() =>
        Promise.resolve({ exists: () => false, val: () => null })
      );

      const result = await getOwnedProducts("owner-1");
      expect(result).toEqual([]);
    });

    it("should fetch each owned product id and filter out any that no longer exist", async () => {
      get
        .mockImplementationOnce(() =>
          // products_by_owner/owner-1
          Promise.resolve({
            exists: () => true,
            val: () => ({ "prod-1": true, "prod-2": true }),
          })
        )
        .mockImplementationOnce(() =>
          // products/prod-1
          Promise.resolve({ exists: () => true, val: () => ({ title: "A" }) })
        )
        .mockImplementationOnce(() =>
          // products/prod-2 - dangling index entry, product deleted
          Promise.resolve({ exists: () => false, val: () => null })
        );

      const result = await getOwnedProducts("owner-1");

      expect(result).toEqual([{ id: "prod-1", title: "A" }]);
    });
  });

  describe("createProduct", () => {
    it("should push a new product and write the owner index atomically when ownerUid is provided", async () => {
      push.mockReturnValueOnce({ key: "new-prod-id" });

      const payload = { title: "New Product" };
      const result = await createProduct(payload, "owner-1");

      expect(result).toBe("new-prod-id");
      expect(update).toHaveBeenCalledWith(expect.anything(), {
        "products/new-prod-id": payload,
        "products_by_owner/owner-1/new-prod-id": true,
      });
    });

    it("should not write an owner index entry when ownerUid is falsy", async () => {
      push.mockReturnValueOnce({ key: "new-prod-id-2" });

      const payload = { title: "Ownerless Product" };
      await createProduct(payload, null);

      expect(update).toHaveBeenCalledWith(expect.anything(), {
        "products/new-prod-id-2": payload,
      });
    });
  });

  describe("updateProduct", () => {
    it("should patch the product at its path without touching the owner index", async () => {
      const patch = { price: 42 };
      await updateProduct("prod-1", patch);

      expect(ref).toHaveBeenCalledWith(expect.anything(), "products/prod-1");
      expect(update).toHaveBeenCalledWith(expect.anything(), patch);
    });
  });

  describe("deleteProduct", () => {
    it("should null out the owner index entry and remove the product", async () => {
      await deleteProduct("prod-1", "owner-1");

      expect(update).toHaveBeenCalledWith(expect.anything(), {
        "products_by_owner/owner-1/prod-1": null,
      });
      expect(remove).toHaveBeenCalledWith(expect.anything());
      expect(ref).toHaveBeenCalledWith(expect.anything(), "products/prod-1");
    });
  });

  describe("reassignProductOwner", () => {
    it("should move the owner index entry from the old owner to the new owner and namespace extra fields under the product", async () => {
      await reassignProductOwner("prod-1", "old-owner", "new-owner", {
        added_by: "new-owner",
      });

      expect(update).toHaveBeenCalledWith(expect.anything(), {
        "products/prod-1/added_by": "new-owner",
        "products_by_owner/old-owner/prod-1": null,
        "products_by_owner/new-owner/prod-1": true,
      });
    });

    it("should only set the new owner's index entry when fromUid is falsy", async () => {
      await reassignProductOwner("prod-1", null, "new-owner");

      expect(update).toHaveBeenCalledWith(expect.anything(), {
        "products_by_owner/new-owner/prod-1": true,
      });
    });
  });

  describe("incrementInterestCount", () => {
    it("should run a transaction against the product's interestCount path", async () => {
      await incrementInterestCount("prod-1");

      expect(ref).toHaveBeenCalledWith(expect.anything(), "products/prod-1/interestCount");
      expect(runTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Function)
      );
    });

    it("should increment from 0 when current value is null/undefined", () => {
      const updateFn = (current) => (current || 0) + 1;
      expect(updateFn(null)).toBe(1);
      expect(updateFn(undefined)).toBe(1);
      expect(updateFn(5)).toBe(6);
    });
  });
});
