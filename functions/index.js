// Cloud Functions entry point.
//
// NOTE: firebase.json already declares a "renderProductPage" function as
// deployed in production, but no functions/ source was checked into this
// repo prior to this change. If renderProductPage's source exists elsewhere
// (a different branch, or only in the deployed artifact), merge it back in
// here before deploying, otherwise `firebase deploy --only functions` will
// remove it from the live project.

const { getStylistRecommendations } = require("./stylist");
const { analyzeStylistPhoto } = require("./stylistPhotoAnalysis");
const { requestTryOn } = require("./stylistTryOn");

module.exports = {
  getStylistRecommendations,
  analyzeStylistPhoto,
  requestTryOn,
};
