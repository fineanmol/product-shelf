// src/utils/__tests__/productOwnerIndex.test.js
import {
  withOwnerIndexOnCreate,
  withOwnerIndexOnDelete,
  withOwnerIndexOnReassign,
} from "../productOwnerIndex";

describe("productOwnerIndex", () => {
  describe("withOwnerIndexOnCreate", () => {
    it("should set the owner index key to true for the new product", () => {
      const updates = {};
      const result = withOwnerIndexOnCreate(updates, "product-1", "owner-1");

      expect(result).toEqual({
        "products_by_owner/owner-1/product-1": true,
      });
      // Confirms mutation-in-place: same reference returned.
      expect(result).toBe(updates);
    });

    it("should merge into an existing updates object without clobbering other keys", () => {
      const updates = { "products/product-1": { title: "Test" } };
      const result = withOwnerIndexOnCreate(updates, "product-1", "owner-2");

      expect(result).toEqual({
        "products/product-1": { title: "Test" },
        "products_by_owner/owner-2/product-1": true,
      });
    });
  });

  describe("withOwnerIndexOnDelete", () => {
    it("should set the owner index key to null to remove it", () => {
      const updates = {};
      const result = withOwnerIndexOnDelete(updates, "product-1", "owner-1");

      expect(result).toEqual({
        "products_by_owner/owner-1/product-1": null,
      });
      expect(result).toBe(updates);
    });

    it("should merge into an existing updates object without clobbering other keys", () => {
      const updates = { "products/product-1": null };
      const result = withOwnerIndexOnDelete(updates, "product-1", "owner-3");

      expect(result).toEqual({
        "products/product-1": null,
        "products_by_owner/owner-3/product-1": null,
      });
    });
  });

  describe("withOwnerIndexOnReassign", () => {
    it("should null out the old owner's index entry and set the new owner's entry to true", () => {
      const updates = {};
      const result = withOwnerIndexOnReassign(
        updates,
        "product-1",
        "old-owner",
        "new-owner"
      );

      expect(result).toEqual({
        "products_by_owner/old-owner/product-1": null,
        "products_by_owner/new-owner/product-1": true,
      });
      expect(result).toBe(updates);
    });

    it("should only set the new owner's entry when fromUid is null (no prior owner)", () => {
      const updates = {};
      const result = withOwnerIndexOnReassign(
        updates,
        "product-1",
        null,
        "new-owner"
      );

      expect(result).toEqual({
        "products_by_owner/new-owner/product-1": true,
      });
      expect(result["products_by_owner/null/product-1"]).toBeUndefined();
    });

    it("should only set the new owner's entry when fromUid is undefined (no prior owner)", () => {
      const updates = {};
      const result = withOwnerIndexOnReassign(
        updates,
        "product-1",
        undefined,
        "new-owner"
      );

      expect(result).toEqual({
        "products_by_owner/new-owner/product-1": true,
      });
    });

    it("should merge into an existing updates object without clobbering other keys", () => {
      const updates = { "products/product-1": { added_by: "new-owner" } };
      const result = withOwnerIndexOnReassign(
        updates,
        "product-1",
        "old-owner",
        "new-owner"
      );

      expect(result).toEqual({
        "products/product-1": { added_by: "new-owner" },
        "products_by_owner/old-owner/product-1": null,
        "products_by_owner/new-owner/product-1": true,
      });
    });
  });
});
