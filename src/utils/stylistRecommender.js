// src/utils/stylistRecommender.js
//
// Pure, dependency-free candidate-selection logic for the AI stylist. Given
// a product list and quiz answers, deterministically narrows candidates down
// with cascading filter relaxation (never hard-empty), matching the same UX
// idea used by the reference repo this module was scoped against
// (progressively drop constraints instead of showing a dead end). Runs
// entirely client-side (no Cloud Function) since database.rules.json already
// allows public reads of `products`.

const matchesGender = (product, gender) =>
  !gender || gender === "unisex" || !product.gender || product.gender === "unisex" || product.gender === gender;

const matchesBudget = (product, maxBudget) =>
  !maxBudget || typeof product.price !== "number" || product.price <= maxBudget;

const matchesAnyTag = (productTags, wantedTags) => {
  if (!wantedTags || wantedTags.length === 0) return true;
  if (!productTags || productTags.length === 0) return false;
  const normalizedProductTags = productTags.map((t) => String(t).toLowerCase());
  return wantedTags.some((tag) => normalizedProductTags.includes(String(tag).toLowerCase()));
};

const productTags = (product) => [
  ...(product.colors || (product.color ? [product.color] : [])),
  ...(product.styleTags || product.styles || []),
  ...(product.occasionTags || product.occasions || []),
];

// Filter stages, most to least restrictive. Each stage is a predicate over
// (product, quiz). Stages are tried in order; the first stage that yields at
// least one result wins, so results only ever go fully empty if the catalog
// itself has nothing matching gender+budget for this shopper.
export const FILTER_STAGES = [
  {
    name: "gender+budget+style+occasion",
    predicate: (p, q) =>
      matchesGender(p, q.gender) &&
      matchesBudget(p, q.maxBudget) &&
      matchesAnyTag(productTags(p), q.preferredColors) &&
      matchesAnyTag(productTags(p), q.preferredStyles) &&
      matchesAnyTag(productTags(p), q.occasionTypes),
  },
  {
    name: "gender+budget+style",
    predicate: (p, q) =>
      matchesGender(p, q.gender) &&
      matchesBudget(p, q.maxBudget) &&
      matchesAnyTag(productTags(p), q.preferredStyles),
  },
  {
    name: "gender+budget+color",
    predicate: (p, q) =>
      matchesGender(p, q.gender) &&
      matchesBudget(p, q.maxBudget) &&
      matchesAnyTag(productTags(p), q.preferredColors),
  },
  {
    name: "gender+budget",
    predicate: (p, q) => matchesGender(p, q.gender) && matchesBudget(p, q.maxBudget),
  },
  {
    name: "gender-only",
    predicate: (p, q) => matchesGender(p, q.gender),
  },
  {
    name: "all",
    predicate: () => true,
  },
];

// Caps how many matches from a single category can dominate the candidate
// list sent to Gemini. Without this, slicing the first N matches in
// whatever order the RTDB snapshot happens to return them could easily hand
// Gemini 40 tops and zero bottoms -- structurally impossible to build a
// complete top+bottom outfit from, no matter how good the prompt is. This
// round-robins across categories instead of taking a flat prefix, so every
// category present in the matches gets a fair share of the limit.
const capWithCategoryDiversity = (matches, limit) => {
  if (matches.length <= limit) return matches;

  const byCategory = new Map();
  for (const product of matches) {
    const key = (product.category || "uncategorized").toLowerCase();
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key).push(product);
  }

  const buckets = [...byCategory.values()];
  const maxBucketLength = Math.max(...buckets.map((bucket) => bucket.length));
  const result = [];
  for (let index = 0; index < maxBucketLength && result.length < limit; index += 1) {
    for (const bucket of buckets) {
      if (result.length >= limit) break;
      if (index < bucket.length) result.push(bucket[index]);
    }
  }
  return result;
};

// Returns { stageName, candidates } — candidates is never non-empty unless
// the full catalog itself is empty.
export const selectCandidates = (products, quiz, limit = 40) => {
  const availableProducts = products.filter((p) => p.status !== "sold");
  for (const stage of FILTER_STAGES) {
    const matches = availableProducts.filter((p) => stage.predicate(p, quiz));
    if (matches.length > 0) {
      return { stageName: stage.name, candidates: capWithCategoryDiversity(matches, limit) };
    }
  }
  return { stageName: "none", candidates: [] };
};
