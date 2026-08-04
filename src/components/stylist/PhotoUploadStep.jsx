import React, { useState } from "react";
import { FaCamera, FaCheckCircle, FaTimes } from "react-icons/fa";
import AnimatedButton from "../ui/AnimatedButton";
import LoadingSpinner from "../ui/LoadingSpinner";
import { uploadStylistPhoto, analyzePhoto } from "../../services/stylistService";
import { removeBackground } from "../../utils/stylistPhoto";

let nextItemId = 0;

// Selfie or wardrobe-item photo upload + client-side background removal +
// Gemini vision analysis, replacing the reference repo's DeepFace/
// image-similarity steps. Background removal runs entirely in the browser
// (@imgly/background-removal, ported from icao-photo-studio) before
// anything is uploaded, so only the cleaned cutout ever reaches Storage.
// kind: "selfie" | "wardrobe". Pass `multiple` for wardrobe photos so
// several clothing items can be picked and processed in one go, each shown
// as its own thumbnail with its own status, instead of one item at a time.
const PhotoUploadStep = ({ uid, kind, label, helperText, onAnalyzed, skippable = true, onSkip, multiple = false }) => {
  const [items, setItems] = useState([]); // [{ id, file, preview, status, error }]

  const processItem = async (item) => {
    const update = (patch) =>
      setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, ...patch } : it)));

    try {
      update({ status: "removing-bg", progressText: null });
      const cleanedBlob = await removeBackground(item.file, ({ phase, pct }) =>
        update({ progressText: typeof pct === "number" ? `${phase} ${pct}%` : phase })
      );
      const cleanedFile = new File([cleanedBlob], item.file.name.replace(/\.\w+$/, ".png"), {
        type: "image/png",
      });

      // Analysis and upload run concurrently (analysis needs no Storage
      // round-trip first, unlike the old server-side version) but are
      // tracked as separate sub-states rather than one shared "analyzing"
      // label -- if one of the two calls stalls, the status shown should say
      // which one, not blame Gemini for a hung Storage upload or vice versa.
      update({ status: "analyzing", analyzing: true, uploading: true });
      const analysisPromise = analyzePhoto(cleanedFile, kind).finally(() =>
        update({ analyzing: false })
      );
      const uploadPromise = uploadStylistPhoto(uid, cleanedFile, kind).finally(() =>
        update({ uploading: false })
      );
      const [analysis, photoUrl] = await Promise.all([analysisPromise, uploadPromise]);

      update({ status: "done" });
      onAnalyzed({ photoUrl, file: cleanedFile, analysis });
    } catch (err) {
      update({ status: "error", error: err.message || "Could not process this photo." });
    }
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    const newItems = selected.map((file) => ({
      id: nextItemId++,
      file,
      preview: URL.createObjectURL(file),
      status: "idle",
      progressText: null,
      analyzing: false,
      uploading: false,
      error: null,
    }));
    setItems((prev) => (multiple ? [...prev, ...newItems] : newItems));
    // Process sequentially rather than in parallel: background removal is a
    // heavy client-side WASM operation, and running several at once would
    // contend for the same CPU/model instance with no real speed benefit.
    // processItem already catches its own errors and sets status: "error" on
    // that item, but a `.catch(() => {})` is added at the chain level too --
    // without it, any uncaught rejection anywhere in the chain silently
    // stops every subsequent item from ever being processed (they'd sit at
    // status: "idle" forever with no visible error), which is exactly the
    // "upload gets stuck" bug this guards against.
    newItems.reduce(
      (chain, item) => chain.then(() => processItem(item)).catch(() => {}),
      Promise.resolve()
    );
  };

  const removeItem = (id) => setItems((prev) => prev.filter((it) => it.id !== id));

  const statusLabel = (item) => {
    if (item.status === "removing-bg") return item.progressText || "Removing background...";
    if (item.status === "analyzing") {
      if (item.analyzing && item.uploading) return "Analyzing & uploading...";
      if (item.analyzing) return "Analyzing with Gemini...";
      if (item.uploading) return "Uploading...";
    }
    return null;
  };

  const anyProcessing = items.some((it) => !["done", "error"].includes(it.status));

  return (
    <div className="bg-stone-50 border border-stone-200 rounded-xl p-6">
      <h3 className="text-title text-brand-navy mb-1">{label}</h3>
      {helperText && <p className="text-caption text-stone-500 mb-4">{helperText}</p>}

      <div className="flex flex-wrap items-start gap-4 mb-4">
        {items.map((item) => (
          <div key={item.id} className="relative w-24">
            <img
              src={item.preview}
              alt="Upload preview"
              className="w-24 h-24 object-cover rounded-lg border border-stone-200"
            />
            {item.status !== "done" && (
              <button
                onClick={() => removeItem(item.id)}
                aria-label="Remove this photo"
                className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center bg-white border border-stone-200 rounded-full text-stone-500 hover:text-brand-coral shadow-soft"
              >
                <FaTimes className="text-xs" />
              </button>
            )}
            <div className="mt-1 text-center">
              {statusLabel(item) ? (
                <span className="text-caption text-stone-500">{statusLabel(item)}</span>
              ) : item.status === "done" ? (
                <span className="flex items-center justify-center gap-1 text-caption text-brand-mint-text font-medium">
                  <FaCheckCircle /> Added
                </span>
              ) : item.status === "error" ? (
                <span className="text-caption text-brand-coral">{item.error}</span>
              ) : null}
            </div>
          </div>
        ))}

        <label className="w-24 h-24 flex items-center justify-center border-2 border-dashed border-stone-300 rounded-lg cursor-pointer hover:border-brand-sky transition-colors shrink-0">
          <FaCamera className="text-stone-400 text-xl" />
          <input
            type="file"
            accept="image/*"
            multiple={multiple}
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      {anyProcessing && <LoadingSpinner text="Processing photos..." />}

      {skippable && (
        <AnimatedButton variant="ghost" size="sm" onClick={onSkip} disabled={anyProcessing}>
          {items.length > 0 ? "Continue" : "Skip"}
        </AnimatedButton>
      )}
    </div>
  );
};

export default PhotoUploadStep;
