#!/usr/bin/env node
/**
 * One-off migration: backfill products_by_owner/$uid/$productId for every
 * EXISTING product in the production RTDB.
 *
 * Background: withOwnerIndexOnCreate() (src/utils/productOwnerIndex.js) writes
 * products_by_owner/{added_by}/{productId} = true whenever a product is
 * created, deleted, or reassigned — but that index was introduced after many
 * products already existed, so those older products were never indexed. This
 * script walks the full products/ tree once and fills in the missing entries
 * so every product with a valid added_by ends up indexed, matching exactly
 * what withOwnerIndexOnCreate would have written.
 *
 * Usage:
 *   node scripts/backfill-products-by-owner.js            # dry-run (default, safe)
 *   node scripts/backfill-products-by-owner.js --dry-run  # same as above, explicit
 *   node scripts/backfill-products-by-owner.js --write    # perform the actual backfill
 *
 * Auth: uses firebase-admin applicationDefault() credentials, same pattern as
 * uploadProducts.js. Requires either:
 *   - `gcloud auth application-default login` (interactive user ADC), or
 *   - GOOGLE_APPLICATION_CREDENTIALS pointing at a service account key
 * for a principal authorized against the product-shelf-inventory Firebase
 * project (see .firebaserc).
 */

const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");

const DATABASE_URL =
  "https://product-shelf-inventory-default-rtdb.europe-west1.firebasedatabase.app";

const WRITE_MODE = process.argv.includes("--write");

initializeApp({
  credential: applicationDefault(),
  databaseURL: DATABASE_URL,
});

const db = getDatabase();

const isValidUid = (uid) => typeof uid === "string" && uid.trim().length > 0;

async function main() {
  console.log(
    `\nRunning products_by_owner backfill in ${WRITE_MODE ? "WRITE" : "DRY-RUN"} mode against:\n  ${DATABASE_URL}\n`
  );

  console.log("Reading products/ ...");
  const productsSnap = await db.ref("products").once("value");
  const products = productsSnap.val() || {};
  const productIds = Object.keys(products);
  console.log(`Loaded ${productIds.length} products.`);

  console.log("Reading products_by_owner/ ...");
  const ownerIndexSnap = await db.ref("products_by_owner").once("value");
  const ownerIndex = ownerIndexSnap.val() || {};

  let totalScanned = 0;
  let alreadyIndexed = 0;
  let missing = 0;
  const invalidOwnerProducts = []; // { id, title }
  const updates = {};

  for (const productId of productIds) {
    totalScanned += 1;
    const product = products[productId] || {};
    const ownerUid = product.added_by;

    if (!isValidUid(ownerUid)) {
      invalidOwnerProducts.push({
        id: productId,
        title: product.title || "(no title)",
      });
      continue;
    }

    const alreadyPresent = ownerIndex[ownerUid] && ownerIndex[ownerUid][productId] === true;

    if (alreadyPresent) {
      alreadyIndexed += 1;
    } else {
      missing += 1;
      updates[`products_by_owner/${ownerUid}/${productId}`] = true;
    }
  }

  // Orphaned index entries: products_by_owner entries pointing at a productId
  // that no longer exists under products/. Report only, do not delete.
  const orphanedEntries = [];
  for (const ownerUid of Object.keys(ownerIndex)) {
    const entries = ownerIndex[ownerUid] || {};
    for (const productId of Object.keys(entries)) {
      if (!Object.prototype.hasOwnProperty.call(products, productId)) {
        orphanedEntries.push({ ownerUid, productId });
      }
    }
  }

  console.log("\n--- Summary ---");
  console.table([
    { Metric: "Total products scanned", Count: totalScanned },
    { Metric: "Already indexed (no-op)", Count: alreadyIndexed },
    { Metric: "Missing from index (to backfill)", Count: missing },
    { Metric: "No valid added_by (cannot index)", Count: invalidOwnerProducts.length },
    { Metric: "Orphaned products_by_owner entries", Count: orphanedEntries.length },
  ]);

  if (invalidOwnerProducts.length > 0) {
    console.log(
      "\nProducts with no valid added_by (investigate / manually assign owner):"
    );
    console.table(invalidOwnerProducts);
  }

  if (orphanedEntries.length > 0) {
    console.log(
      "\nOrphaned products_by_owner entries (point at a productId that no longer exists; not deleted by this script):"
    );
    console.table(orphanedEntries);
  }

  if (!WRITE_MODE) {
    console.log(
      `\nDRY-RUN complete: no writes performed. ${missing} entr${
        missing === 1 ? "y" : "ies"
      } would be backfilled. Re-run with --write to apply.\n`
    );
    return;
  }

  if (missing === 0) {
    console.log("\nNothing to backfill. Index is already complete.\n");
    return;
  }

  console.log(`\nWriting ${missing} missing index entr${missing === 1 ? "y" : "ies"} in a single batched update() call ...`);
  await db.ref().update(updates);
  console.log("Backfill write complete.\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\nBackfill failed:", error);
    process.exit(1);
  });
