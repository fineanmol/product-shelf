// src/utils/stylistPhoto.js
//
// Client-side photo preprocessing for the AI stylist module, ported from the
// same author's icao-photo-studio project (Apache-2.0), whose bg-removal.ts
// used @imgly/background-removal — a 100% client-side ONNX/WASM model
// (ISNet), no API key, no server round-trip, no per-call cost. Cleaning up
// wardrobe/selfie photos before they ever leave the browser also means the
// original (with its background/surroundings) never has to be uploaded.

// Lazy-loaded exactly like icao-photo-studio's getRemoveFn(), since the
// WASM/model payload is large and most stylist sessions won't touch a
// photo-upload step at all (quiz steps 2/3 are optional).
let _removeBackgroundFn = null;
const getRemoveBackgroundFn = async () => {
  if (_removeBackgroundFn) return _removeBackgroundFn;
  const mod = await import("@imgly/background-removal");
  _removeBackgroundFn = mod.default ?? mod.removeBackground;
  return _removeBackgroundFn;
};

// Single hardcoded "balanced" tier (isnet_fp16) -- icao-photo-studio offered
// fast/balanced/quality, but the stylist upload flow deliberately skips that
// picker to keep the quiz simple; balanced is a good quality/speed default.
export const removeBackground = async (file, onProgress) => {
  const removeBg = await getRemoveBackgroundFn();
  onProgress?.({ phase: "Removing background...", pct: 0 });

  const resultBlob = await removeBg(file, {
    model: "isnet_fp16",
    output: { format: "image/png", quality: 1 },
    progress: (key, current, total) => {
      const pct = total > 0 ? Math.round((current / total) * 100) : 0;
      const phase = key.includes("fetch")
        ? "Setting up background removal (first time only)..."
        : "Removing background...";
      onProgress?.({ phase, pct });
    },
  });

  return resultBlob;
};

const TIME_OF_DAY_BUCKETS = [
  { start: 5, end: 12, label: "morning" },
  { start: 12, end: 17, label: "afternoon" },
  { start: 17, end: 21, label: "evening" },
];

// Pure function (no dependency on browser APIs), so it's trivially unit
// testable: given a local hour, return a morning/afternoon/evening/night
// bucket for the recommendation prompt.
export const getTimeOfDayBucket = (date = new Date()) => {
  const hour = date.getHours();
  const bucket = TIME_OF_DAY_BUCKETS.find((b) => hour >= b.start && hour < b.end);
  return bucket ? bucket.label : "night";
};

const NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";

// Browser geolocation -> free OpenStreetMap Nominatim reverse-geocode (no
// API key) -> city name. Resolves to { city: null } rather than rejecting on
// any failure (denied permission, network error, no city in the response),
// since this is a "nice to have" signal, not a required one -- callers
// should never let this block showing recommendations.
export const detectLocationAndTime = () =>
  new Promise((resolve) => {
    const timeOfDay = getTimeOfDayBucket();
    if (!navigator.geolocation) {
      resolve({ city: null, timeOfDay });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `${NOMINATIM_REVERSE_URL}?lat=${latitude}&lon=${longitude}&format=json`,
            // Nominatim's usage policy requires an identifying User-Agent or
            // Referer -- browsers set Referer automatically, but a custom
            // header can't be set on cross-origin fetch without triggering
            // a preflight Nominatim doesn't need, so we rely on Referer.
            { headers: { Accept: "application/json" } }
          );
          if (!response.ok) {
            resolve({ city: null, timeOfDay });
            return;
          }
          const data = await response.json();
          const city =
            data.address?.city || data.address?.town || data.address?.village || null;
          resolve({ city, timeOfDay });
        } catch {
          resolve({ city: null, timeOfDay });
        }
      },
      () => resolve({ city: null, timeOfDay }),
      { timeout: 5000 }
    );
  });
