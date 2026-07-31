import React, { useState } from "react";
import { FaMagic } from "react-icons/fa";
import AnimatedButton from "../ui/AnimatedButton";
import { requestTryOn } from "../../services/stylistService";

// Triggers a virtual try-on via Gemini 2.5 Flash Image, which generates the
// composite image synchronously in the response -- no job id, no polling,
// unlike the job-based FASHN.ai flow this replaced.
const TryOnButton = ({ userPhotoUrl, garmentImageUrl, onResult }) => {
  const [state, setState] = useState("idle"); // idle | processing | done | error
  const [error, setError] = useState(null);

  const handleClick = async () => {
    setState("processing");
    setError(null);
    try {
      const { resultImageUrl } = await requestTryOn(userPhotoUrl, garmentImageUrl);
      setState("done");
      onResult(resultImageUrl);
    } catch (err) {
      setState("error");
      setError(err.message || "Could not generate virtual try-on.");
    }
  };

  if (state === "error") {
    return (
      <div className="text-caption text-brand-coral">
        {error}{" "}
        <button onClick={handleClick} className="underline hover:text-brand-navy">
          Retry
        </button>
      </div>
    );
  }

  return (
    <AnimatedButton
      variant="ghost"
      size="sm"
      onClick={handleClick}
      loading={state === "processing"}
      disabled={state === "processing" || state === "done"}
    >
      <FaMagic className="mr-1.5" />
      {state === "done" ? "Try-on ready" : "Try it on"}
    </AnimatedButton>
  );
};

export default TryOnButton;
