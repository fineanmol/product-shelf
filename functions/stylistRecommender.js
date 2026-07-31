// Pure, dependency-free candidate-selection logic for the AI stylist.
//
// Split out from stylist.js so it can be unit tested without touching
// firebase-admin or the Gemini SDK: given a product list and quiz answers,
// deterministically narrow candidates down with cascading filter relaxation
// (never hard-empty), matching the same UX idea used by the reference repo
// this module was scoped against (progressively drop constraints instead of
// showing a dead end). The actual Gemini call (grouping candidates into
// outfits + writing the rationale) stays in stylist.js since that's the part
// that needs the API key and network access.

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
const FILTER_STAGES = [
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

// Returns { stageName, candidates } — candidates is never non-empty unless
// the full catalog itself is empty.
function selectCandidates(products, quiz, limit = 40) {
  const availableProducts = products.filter((p) => p.status !== "sold");
  for (const stage of FILTER_STAGES) {
    const matches = availableProducts.filter((p) => stage.predicate(p, quiz));
    if (matches.length > 0) {
      return { stageName: stage.name, candidates: matches.slice(0, limit) };
    }
  }
  return { stageName: "none", candidates: [] };
}

module.exports = { selectCandidates, FILTER_STAGES };
