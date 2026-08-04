// src/services/__tests__/stylistService.test.js
import { getDatabase, ref, get, push, set, update, remove } from "firebase/database";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import * as geminiClient from "../geminiClient";
import {
  getStylistRecommendations,
  saveBoard,
  getSavedBoards,
  deleteBoard,
  uploadStylistPhoto,
  analyzePhoto,
  requestTryOn,
  saveWardrobeItem,
  getWardrobeItems,
  updateWardrobeItem,
  deleteWardrobeItem,
} from "../stylistService";

vi.mock("../geminiClient", () => ({
  generateOutfits: vi.fn(),
  analyzePhoto: vi.fn(),
  generateTryOnImage: vi.fn(),
}));

describe("stylistService", () => {
  beforeEach(() => {
    getDatabase.mockReturnValue({});
    ref.mockImplementation((db, path) => ({ db, path }));
    get.mockImplementation(() => Promise.resolve({ exists: () => false, val: () => null }));
    set.mockImplementation(() => Promise.resolve());
    update.mockImplementation(() => Promise.resolve());
    remove.mockImplementation(() => Promise.resolve());
    push.mockImplementation(() => ({ key: "mock-board-id" }));

    getStorage.mockReturnValue({});
    storageRef.mockImplementation((storage, path) => ({ storage, path }));
    uploadBytes.mockImplementation(() => Promise.resolve());
    getDownloadURL.mockImplementation(() => Promise.resolve("https://example.com/photo.jpg"));
  });

  describe("getStylistRecommendations", () => {
    it("reads the live catalog, narrows candidates, and asks Gemini to group outfits", async () => {
      get.mockImplementationOnce(() =>
        Promise.resolve({
          exists: () => true,
          val: () => ({
            "prod-1": { title: "Blue Shirt", gender: "women", price: 20, status: "available" },
          }),
        })
      );
      geminiClient.generateOutfits.mockResolvedValue({
        outfits: [{ title: "Casual Look", productIds: ["prod-1"], rationale: "Great fit" }],
      });

      const quiz = { gender: "women" };
      const context = { occasion: "work" };
      const result = await getStylistRecommendations(quiz, context);

      expect(ref).toHaveBeenCalledWith(expect.anything(), "products");
      expect(geminiClient.generateOutfits).toHaveBeenCalledWith(
        quiz,
        context,
        expect.arrayContaining([expect.objectContaining({ id: "prod-1" })])
      );
      expect(result.outfits).toEqual([{ title: "Casual Look", productIds: ["prod-1"], rationale: "Great fit" }]);
      expect(result.products).toEqual(expect.arrayContaining([expect.objectContaining({ id: "prod-1" })]));
    });

    it("returns an empty product list when the catalog is empty", async () => {
      get.mockImplementationOnce(() => Promise.resolve({ exists: () => false, val: () => null }));
      geminiClient.generateOutfits.mockResolvedValue({ outfits: [] });

      const result = await getStylistRecommendations({ gender: "women" });

      expect(result.products).toEqual([]);
      expect(result.stageName).toBe("none");
    });
  });

  describe("saveBoard", () => {
    it("pushes a new board under stylistBoards/$uid with a createdAt timestamp", async () => {
      const board = { title: "Weekend Look", productIds: ["p1"] };
      const boardId = await saveBoard("user-1", board);

      expect(ref).toHaveBeenCalledWith(expect.anything(), "stylistBoards/user-1");
      expect(set).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ title: "Weekend Look", productIds: ["p1"], createdAt: expect.any(Number) })
      );
      expect(boardId).toBe("mock-board-id");
    });
  });

  describe("getSavedBoards", () => {
    it("returns an empty array when there is no uid", async () => {
      expect(await getSavedBoards(null)).toEqual([]);
    });

    it("returns an empty array when the user has no saved boards", async () => {
      get.mockImplementationOnce(() => Promise.resolve({ exists: () => false, val: () => null }));
      expect(await getSavedBoards("user-1")).toEqual([]);
    });

    it("returns boards with their ids attached", async () => {
      get.mockImplementationOnce(() =>
        Promise.resolve({
          exists: () => true,
          val: () => ({ "board-1": { title: "Look A" }, "board-2": { title: "Look B" } }),
        })
      );

      const result = await getSavedBoards("user-1");

      expect(result).toEqual(
        expect.arrayContaining([
          { id: "board-1", title: "Look A" },
          { id: "board-2", title: "Look B" },
        ])
      );
    });
  });

  describe("deleteBoard", () => {
    it("removes the board at stylistBoards/$uid/$boardId", async () => {
      await deleteBoard("user-1", "board-1");
      expect(ref).toHaveBeenCalledWith(expect.anything(), "stylistBoards/user-1/board-1");
      expect(remove).toHaveBeenCalledWith(expect.anything());
    });
  });

  describe("uploadStylistPhoto", () => {
    it("uploads to stylistPhotos/$uid/* and returns the download URL", async () => {
      const file = { name: "selfie.jpg" };
      const url = await uploadStylistPhoto("user-1", file, "selfie");

      expect(storageRef).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringMatching(/^stylistPhotos\/user-1\/selfie-\d+-selfie\.jpg$/)
      );
      expect(uploadBytes).toHaveBeenCalled();
      expect(url).toBe("https://example.com/photo.jpg");
    });
  });

  describe("analyzePhoto", () => {
    it("delegates directly to geminiClient.analyzePhoto with the file and kind", async () => {
      const file = { name: "selfie.jpg" };
      geminiClient.analyzePhoto.mockResolvedValue({ skinTone: "tan" });

      const result = await analyzePhoto(file, "selfie");

      expect(geminiClient.analyzePhoto).toHaveBeenCalledWith(file, "selfie");
      expect(result).toEqual({ skinTone: "tan" });
    });
  });

  describe("requestTryOn", () => {
    it("delegates to geminiClient.generateTryOnImage and wraps the result", async () => {
      const personFile = { name: "me.jpg" };
      geminiClient.generateTryOnImage.mockResolvedValue("data:image/png;base64,abc123");

      const result = await requestTryOn(personFile, "https://example.com/garment.jpg");

      expect(geminiClient.generateTryOnImage).toHaveBeenCalledWith(personFile, "https://example.com/garment.jpg");
      expect(result).toEqual({ resultImageUrl: "data:image/png;base64,abc123" });
    });
  });

  describe("saveWardrobeItem", () => {
    it("pushes a new item under wardrobeItems/$uid with a createdAt timestamp", async () => {
      const item = { photoUrl: "https://example.com/shirt.jpg", category: "top" };
      const itemId = await saveWardrobeItem("user-1", item);

      expect(ref).toHaveBeenCalledWith(expect.anything(), "wardrobeItems/user-1");
      expect(set).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ photoUrl: "https://example.com/shirt.jpg", category: "top", createdAt: expect.any(Number) })
      );
      expect(itemId).toBe("mock-board-id");
    });
  });

  describe("getWardrobeItems", () => {
    it("returns an empty array when there is no uid", async () => {
      expect(await getWardrobeItems(null)).toEqual([]);
    });

    it("returns an empty array when the user has no wardrobe items", async () => {
      get.mockImplementationOnce(() => Promise.resolve({ exists: () => false, val: () => null }));
      expect(await getWardrobeItems("user-1")).toEqual([]);
    });

    it("returns items with their ids attached", async () => {
      get.mockImplementationOnce(() =>
        Promise.resolve({
          exists: () => true,
          val: () => ({
            "item-1": { photoUrl: "https://example.com/a.jpg", category: "top" },
            "item-2": { photoUrl: "https://example.com/b.jpg", category: "bottom" },
          }),
        })
      );

      const result = await getWardrobeItems("user-1");

      expect(result).toEqual(
        expect.arrayContaining([
          { id: "item-1", photoUrl: "https://example.com/a.jpg", category: "top" },
          { id: "item-2", photoUrl: "https://example.com/b.jpg", category: "bottom" },
        ])
      );
    });
  });

  describe("updateWardrobeItem", () => {
    it("patches the item at wardrobeItems/$uid/$itemId", async () => {
      const patch = { category: "dress", colors: ["red"] };
      await updateWardrobeItem("user-1", "item-1", patch);

      expect(ref).toHaveBeenCalledWith(expect.anything(), "wardrobeItems/user-1/item-1");
      expect(update).toHaveBeenCalledWith(expect.anything(), patch);
    });
  });

  describe("deleteWardrobeItem", () => {
    it("removes the item at wardrobeItems/$uid/$itemId", async () => {
      await deleteWardrobeItem("user-1", "item-1");
      expect(ref).toHaveBeenCalledWith(expect.anything(), "wardrobeItems/user-1/item-1");
      expect(remove).toHaveBeenCalledWith(expect.anything());
    });
  });
});
