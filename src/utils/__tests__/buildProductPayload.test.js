// src/utils/__tests__/buildProductPayload.test.js
import { buildProductPayload } from "../buildProductPayload";
import { normalizePrice, calculateMinPrice } from "../utils";

describe("buildProductPayload and price utils", () => {
  describe("price normalization and calculations", () => {
    it("should normalize price strings by removing currency signs and invalid characters", () => {
      expect(normalizePrice("$49.99")).toBe(49.99);
      expect(normalizePrice("€100.50")).toBe(100.5);
      expect(normalizePrice("1,250.00")).toBe(1250);
      expect(normalizePrice("abc")).toBe(0);
      expect(normalizePrice(undefined)).toBe(0);
      expect(normalizePrice(null)).toBe(0);
    });

    it("should calculate min_price correctly (44% of original_price)", () => {
      expect(calculateMinPrice(100)).toBe("44.00");
      expect(calculateMinPrice("200")).toBe("88.00");
      expect(calculateMinPrice(undefined)).toBe("");
      expect(calculateMinPrice(null)).toBe("");
    });
  });

  describe("buildProductPayload", () => {
    const mockUser = {
      uid: "user-123",
      email: "seller@test.com",
    };

    beforeAll(() => {
      jest.useFakeTimers().setSystemTime(new Date("2026-05-31T18:00:00Z"));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it("should construct a creation payload for a new product", () => {
      const formData = {
        title: "Test Headphones",
        price: "$50",
        original_price: "100.00",
        currency: "USD",
        age: "New",
      };

      const payload = buildProductPayload(formData, mockUser, true);

      expect(payload).toEqual({
        title: "Test Headphones",
        price: 50,
        original_price: 100,
        currency: "USD",
        age: "New",
        condition: "New",
        min_price: "44.00",
        added_by: "user-123",
        added_email: "seller@test.com",
        timestamp: Date.now(),
      });
    });

    it("should strip undefined values so Firebase database won't reject the payload", () => {
      const formData = {
        title: "Product with undefineds",
        price: 10,
        original_price: undefined, // Should be omitted from final payload
        admin_note: undefined,      // Should be omitted
      };

      const payload = buildProductPayload(formData, mockUser, true);

      expect(payload).not.toHaveProperty("original_price");
      expect(payload).not.toHaveProperty("admin_note");
      expect(payload.price).toBe(10);
    });

    it("should construct an update payload for an existing product (no min_price or added_by/added_email)", () => {
      const formData = {
        title: "Updated Title",
        price: "75",
        original_price: "",
      };

      const payload = buildProductPayload(formData, mockUser, false);

      expect(payload).toEqual({
        title: "Updated Title",
        price: 75,
        original_price: "",
        currency: "EUR", // default fallback
        age: "New",      // default fallback
        condition: "New",
        updatedAt: Date.now(),
      });

      expect(payload).not.toHaveProperty("min_price");
      expect(payload).not.toHaveProperty("added_by");
      expect(payload).not.toHaveProperty("added_email");
    });
  });
});
