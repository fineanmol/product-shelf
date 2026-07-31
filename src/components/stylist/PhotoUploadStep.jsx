import React, { useState } from "react";
import { FaCamera, FaCheckCircle } from "react-icons/fa";
import AnimatedButton from "../ui/AnimatedButton";
import LoadingSpinner from "../ui/LoadingSpinner";
import { uploadStylistPhoto, analyzePhoto } from "../../services/stylistService";
import { removeBackground } from "../../utils/stylistPhoto";

// Selfie or wardrobe-item photo upload + client-side background removal +
// Gemini vision analysis, replacing the reference repo's DeepFace/
// image-similarity steps. Background removal runs entirely in the browser
// (@imgly/background-removal, ported from icao-photo-studio) before
// anything is uploaded, so only the cleaned cutout ever reaches Storage.
// kind: "selfie" | "wardrobe".
const PhotoUploadStep = ({ uid, kind, label, helperText, onAnalyzed, skippable = true, onSkip }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | removing-bg | uploading | analyzing | done | error
  const [progressText, setProgressText] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setStatus("idle");
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!file || !uid) return;
    setError(null);
    try {
      setStatus("removing-bg");
      const cleanedBlob = await removeBackground(file, ({ phase }) => setProgressText(phase));
      setProgressText(null);

      setStatus("uploading");
      const cleanedFile = new File([cleanedBlob], file.name.replace(/\.\w+$/, ".png"), {
        type: "image/png",
      });
      const photoUrl = await uploadStylistPhoto(uid, cleanedFile, kind);

      setStatus("analyzing");
      const analysis = await analyzePhoto(photoUrl, kind);
      setStatus("done");
      onAnalyzed({ photoUrl, analysis });
    } catch (err) {
      setStatus("error");
      setError(err.message || "Could not process photo. You can skip this step.");
    }
  };

  const statusText = {
    "removing-bg": progressText || "Removing background...",
    uploading: "Uploading...",
    analyzing: "Analyzing with Gemini...",
  }[status];

  return (
    <div className="bg-stone-50 border border-stone-200 rounded-xl p-6">
      <h3 className="text-title text-brand-navy mb-1">{label}</h3>
      {helperText && <p className="text-caption text-stone-500 mb-4">{helperText}</p>}

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {preview ? (
          <img src={preview} alt="Selected upload preview" className="w-24 h-24 object-cover rounded-lg border border-stone-200" />
        ) : (
          <label className="w-24 h-24 flex items-center justify-center border-2 border-dashed border-stone-300 rounded-lg cursor-pointer hover:border-brand-sky transition-colors">
            <FaCamera className="text-stone-400 text-xl" />
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>
        )}

        <div className="flex flex-col gap-2">
          {statusText ? (
            <LoadingSpinner text={statusText} />
          ) : status === "done" ? (
            <span className="flex items-center gap-2 text-brand-mint-text text-body font-medium">
              <FaCheckCircle /> Analyzed
            </span>
          ) : (
            <div className="flex gap-2">
              {preview && (
                <AnimatedButton variant="primary" size="sm" onClick={handleAnalyze}>
                  Analyze photo
                </AnimatedButton>
              )}
              {skippable && (
                <AnimatedButton variant="ghost" size="sm" onClick={onSkip}>
                  Skip
                </AnimatedButton>
              )}
            </div>
          )}
          {error && <p className="text-caption text-brand-coral">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default PhotoUploadStep;
