// src/utils/__tests__/bulkImportUtils.test.js
import {
  autoMapColumns,
  applyMapping,
  validateRow,
  applyDefaults,
  detectDuplicates,
  isTemplateFile,
  FIELD_DEFS,
} from "../bulkImportUtils";

describe("bulkImportUtils", () => {
  describe("autoMapColumns", () => {
    it("should map columns with exact matches", () => {
      const headers = ["title", "price", "description"];
      const mapping = autoMapColumns(headers);
      expect(mapping.title).toBe("title");
      expect(mapping.price).toBe("price");
      expect(mapping.description).toBe("description");
    });

    it("should map columns with label matches", () => {
      const headers = ["Title", "Price", "Product URL"];
      const mapping = autoMapColumns(headers);
      expect(mapping.title).toBe("Title");
      expect(mapping.price).toBe("Price");
      expect(mapping.url).toBe("Product URL");
    });

    it("should map columns with fuzzy matching (spaces, underscores, case normalization)", () => {
      const headers = ["title_", "originalPrice", "delivery_options", "ProductUrl"];
      const mapping = autoMapColumns(headers);
      expect(mapping.title).toBe("title_");
      expect(mapping.original_price).toBe("originalPrice");
      expect(mapping.delivery_options).toBe("delivery_options");
      expect(mapping.url).toBe("ProductUrl");
    });

    it("should leave unmapped fields empty", () => {
      const headers = ["unrelated_column"];
      const mapping = autoMapColumns(headers);
      expect(mapping.title).toBe("");
      expect(mapping.price).toBe("");
    });
  });

  describe("applyMapping", () => {
    it("should produce mapped product rows with 1-based index (header is row 1, so data starts at row 2)", () => {
      const rawRows = [
        { "Product Name": "Test Product", "Cost": "100" },
        { "Product Name": "Second Product", "Cost": "200" },
      ];
      const mapping = {
        title: "Product Name",
        price: "Cost",
      };
      const result = applyMapping(rawRows, mapping);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        _rowIndex: 2,
        title: "Test Product",
        price: "100",
      });
      expect(result[1]).toEqual({
        _rowIndex: 3,
        title: "Second Product",
        price: "200",
      });
    });
  });

  describe("validateRow", () => {
    const defaultDefaults = { currency: "EUR" };

    it("should fail validation if required fields are missing and no defaults are set", () => {
      const row = { title: "A product" }; // missing price
      const result = validateRow(row, defaultDefaults);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "price",
        message: '"Price" is required',
      });
    });

    it("should give warnings if required fields are missing but defaults are set", () => {
      const row = { price: "20" }; // missing title, but let's say title has a default
      const defaults = { title: "Fallback Title" };
      const result = validateRow(row, defaults);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toContainEqual({
        field: "title",
        message: 'Using default: "Fallback Title"',
      });
    });

    it("should fail validation if numeric fields are not numbers", () => {
      const row = { title: "Product", price: "not-a-number" };
      const result = validateRow(row, defaultDefaults);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "price",
        message: '"Price" must be a number',
      });
    });

    it("should fail validation if price is less than or equal to 0", () => {
      const row = { title: "Product", price: "-5" };
      const result = validateRow(row, defaultDefaults);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "price",
        message: '"Price" must be greater than 0',
      });
    });

    it("should warn if standard dropdown option is not matched, but remain valid", () => {
      const row = { title: "Product", price: "10", category: "InvalidCategory" };
      const result = validateRow(row, defaultDefaults);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContainEqual({
        field: "category",
        message: '"InvalidCategory" is not a standard value for Category. Will use as-is.',
      });
    });
  });

  describe("applyDefaults", () => {
    it("should merge default values and normalise structures", () => {
      const row = {
        title: "Product A",
        price: "19.99",
        delivery_options: "Pick Up, Shipping",
        visible: "true",
        age: "New",
      };
      const merged = applyDefaults(row);
      expect(merged.price).toBe(19.99);
      expect(merged.delivery_options).toEqual(["Pick Up", "Shipping"]);
      expect(merged.visible).toBe(true);
      expect(merged.condition).toBe("New");
      expect(merged.age).toBe("New");
    });

    it("should handle boolean visible and number/string prices", () => {
      const row = {
        title: "Product B",
        price: 15,
        original_price: "25.5",
        visible: false,
      };
      const merged = applyDefaults(row);
      expect(merged.price).toBe(15);
      expect(merged.original_price).toBe(25.5);
      expect(merged.visible).toBe(false);
    });
  });

  describe("detectDuplicates", () => {
    it("should detect duplicate products based on normalised title and price", () => {
      const existing = [
        { title: "Apple iPhone 13", price: 699.99 },
        { title: "Sony Headphones", price: 150 },
      ];
      const uploaded = [
        { title: "apple iphone 13 ", price: "699.99" }, // duplicate (case, whitespace, string price)
        { title: "Sony Headphones", price: "200" },      // different price (not duplicate)
        { title: "Xiaomi Mi 11", price: "400" },         // new product (not duplicate)
      ];

      const results = detectDuplicates(uploaded, existing);
      expect(results[0]._isDuplicate).toBe(true);
      expect(results[1]._isDuplicate).toBe(false);
      expect(results[2]._isDuplicate).toBe(false);
    });
  });

  describe("isTemplateFile", () => {
    it("should recognize headers matching template keys as template file", () => {
      const headers = ["title", "price", "description", "category"];
      expect(isTemplateFile(headers)).toBe(true);
    });

    it("should not recognize unrelated headers", () => {
      const headers = ["name", "cost", "details"];
      expect(isTemplateFile(headers)).toBe(false);
    });
  });
});
