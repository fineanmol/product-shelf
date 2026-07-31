const { selectCandidates } = require("./stylistRecommender");

const product = (overrides) => ({
  id: "p1",
  status: "available",
  gender: "women",
  price: 50,
  colors: [],
  styleTags: [],
  occasionTags: [],
  ...overrides,
});

describe("selectCandidates", () => {
  it("returns items matching the strictest stage when available", () => {
    const products = [
      product({ id: "match", colors: ["black"], styleTags: ["casual"], occasionTags: ["work"] }),
      product({ id: "no-match", colors: ["red"], styleTags: ["formal"], occasionTags: ["party"] }),
    ];
    const quiz = {
      gender: "women",
      maxBudget: 100,
      preferredColors: ["black"],
      preferredStyles: ["casual"],
      occasionTypes: ["work"],
    };

    const { stageName, candidates } = selectCandidates(products, quiz);

    expect(stageName).toBe("gender+budget+style+occasion");
    expect(candidates.map((p) => p.id)).toEqual(["match"]);
  });

  it("relaxes to gender+budget+style when color/occasion don't match anything", () => {
    const products = [
      product({ id: "style-only", colors: ["red"], styleTags: ["casual"], occasionTags: ["party"] }),
    ];
    const quiz = {
      gender: "women",
      maxBudget: 100,
      preferredColors: ["black"],
      preferredStyles: ["casual"],
      occasionTypes: ["work"],
    };

    const { stageName, candidates } = selectCandidates(products, quiz);

    expect(stageName).toBe("gender+budget+style");
    expect(candidates.map((p) => p.id)).toEqual(["style-only"]);
  });

  it("relaxes all the way to gender-only when nothing else matches", () => {
    const products = [
      product({ id: "gender-only-match", colors: ["red"], styleTags: ["formal"], occasionTags: ["party"], price: 500 }),
    ];
    const quiz = {
      gender: "women",
      maxBudget: 100,
      preferredColors: ["black"],
      preferredStyles: ["casual"],
      occasionTypes: ["work"],
    };

    const { stageName, candidates } = selectCandidates(products, quiz);

    expect(stageName).toBe("gender-only");
    expect(candidates.map((p) => p.id)).toEqual(["gender-only-match"]);
  });

  it("never returns hard-empty unless the whole catalog is empty", () => {
    const products = [product({ id: "anything", gender: "men", price: 99999 })];
    const quiz = { gender: "women", maxBudget: 1, preferredColors: ["black"] };

    const { stageName, candidates } = selectCandidates(products, quiz);

    expect(stageName).toBe("all");
    expect(candidates.map((p) => p.id)).toEqual(["anything"]);
  });

  it("returns an empty result set with stageName 'none' for an empty catalog", () => {
    const { stageName, candidates } = selectCandidates([], { gender: "women" });

    expect(stageName).toBe("none");
    expect(candidates).toEqual([]);
  });

  it("excludes sold products", () => {
    const products = [
      product({ id: "sold", status: "sold" }),
      product({ id: "available", status: "available" }),
    ];

    const { candidates } = selectCandidates(products, { gender: "women" });

    expect(candidates.map((p) => p.id)).toEqual(["available"]);
  });

  it("respects the limit parameter", () => {
    const products = Array.from({ length: 10 }, (_, i) => product({ id: `p${i}` }));

    const { candidates } = selectCandidates(products, { gender: "women" }, 3);

    expect(candidates).toHaveLength(3);
  });
});
