// src/services/__tests__/stylistService.test.js
import { getDatabase, ref, get, push, set, remove } from "firebase/database";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  getStylistRecommendations,
  saveBoard,
  getSavedBoards,
  deleteBoard,
  uploadStylistPhoto,
  analyzePhoto,
  requestTryOn,
} from "../stylistService";

describe("stylistService", () => {
  beforeEach(() => {
    getDatabase.mockReturnValue({});
    ref.mockImplementation((db, path) => ({ db, path }));
    get.mockImplementation(() => Promise.resolve({ exists: () => false, val: () => null }));
    set.mockImplementation(() => Promise.resolve());
    remove.mockImplementation(() => Promise.resolve());
    push.mockImplementation(() => ({ key: "mock-board-id" }));

    getFunctions.mockReturnValue({});
    getStorage.mockReturnValue({});
    storageRef.mockImplementation((storage, path) => ({ storage, path }));
    uploadBytes.mockImplementation(() => Promise.resolve());
    getDownloadURL.mockImplementation(() => Promise.resolve("https://example.com/photo.jpg"));
  });

  describe("getStylistRecommendations", () => {
    it("calls the getStylistRecommendations callable with quiz and context", async () => {
      const callable = vi.fn(() => Promise.resolve({ data: { stageName: "all", outfits: [] } }));
      httpsCallable.mockReturnValue(callable);

      const quiz = { gender: "women" };
      const context = { occasion: "work" };
      const result = await getStylistRecommendations(quiz, context);

      expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), "getStylistRecommendations");
      expect(callable).toHaveBeenCalledWith({ quiz, context });
      expect(result).toEqual({ stageName: "all", outfits: [] });
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
    it("calls the analyzeStylistPhoto callable with photoUrl and kind", async () => {
      const callable = vi.fn(() => Promise.resolve({ data: { skinTone: "tan" } }));
      httpsCallable.mockReturnValue(callable);

      const result = await analyzePhoto("https://example.com/photo.jpg", "selfie");

      expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), "analyzeStylistPhoto");
      expect(callable).toHaveBeenCalledWith({ photoUrl: "https://example.com/photo.jpg", kind: "selfie" });
      expect(result).toEqual({ skinTone: "tan" });
    });
  });

  describe("requestTryOn", () => {
    it("calls the requestTryOn callable and returns the generated image directly", async () => {
      const callable = vi.fn(() =>
        Promise.resolve({ data: { resultImageUrl: "data:image/png;base64,abc123" } })
      );
      httpsCallable.mockReturnValue(callable);

      const result = await requestTryOn("https://example.com/me.jpg", "https://example.com/garment.jpg");

      expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), "requestTryOn");
      expect(callable).toHaveBeenCalledWith({
        photoUrl: "https://example.com/me.jpg",
        garmentImageUrl: "https://example.com/garment.jpg",
      });
      expect(result).toEqual({ resultImageUrl: "data:image/png;base64,abc123" });
    });
  });
});
