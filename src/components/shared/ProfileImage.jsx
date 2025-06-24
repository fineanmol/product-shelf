import React, { useState, useEffect, useRef } from "react";

const ProfileImage = ({
  src,
  alt,
  className = "w-8 h-8 rounded-full object-cover",
  fallbackSrc,
  showInitials = true,
  size = 128,
}) => {
  // Generate fallback URL if not provided
  const defaultFallbackSrc =
    fallbackSrc ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      alt || "User"
    )}&background=6366f1&color=fff&size=${size}&rounded=true`;

  // Initialize with src or fallback immediately
  const [imageSrc, setImageSrc] = useState(src || defaultFallbackSrc);
  const [isLoading, setIsLoading] = useState(!!src);
  const [hasError, setHasError] = useState(false);
  const isMounted = useRef(true);
  const previousSrc = useRef(src);

  // Debug logging
  useEffect(() => {
    console.log("ProfileImage props:", { src, alt, size });
    console.log("Current state:", { imageSrc, isLoading, hasError });
  }, [src, imageSrc, isLoading, hasError]);

  useEffect(() => {
    if (src !== previousSrc.current) {
      if (src) {
        setImageSrc(src);
        setIsLoading(true);
        setHasError(false);
      } else {
        setImageSrc(defaultFallbackSrc);
        setIsLoading(false);
        setHasError(false);
      }
      previousSrc.current = src;
    }
  }, [src, defaultFallbackSrc]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleLoad = () => {
    console.log("Image loaded successfully:", imageSrc);
    if (isMounted.current) {
      setIsLoading(false);
      setHasError(false);
    }
  };

  const handleError = () => {
    console.log("Image load error:", {
      src: imageSrc,
      fallback: defaultFallbackSrc,
    });
    if (!isMounted.current) return;

    setIsLoading(false);
    setHasError(true);

    // Try fallback URL if current src isn't the fallback already
    if (imageSrc !== defaultFallbackSrc) {
      setImageSrc(defaultFallbackSrc);
    }
  };

  // Show initials if no source or error with fallback
  if (
    (!imageSrc && showInitials) ||
    (hasError && imageSrc === defaultFallbackSrc)
  ) {
    const initials =
      alt
        ?.split(" ")
        .map((word) => word[0]?.toUpperCase())
        .join("")
        .slice(0, 2) || "U";

    console.log("Showing initials:", initials);
    return (
      <div
        className={`${className} bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium`}
      >
        <span className="text-sm">{initials}</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div
          className={`${className} bg-gray-200 animate-pulse flex items-center justify-center`}
        >
          <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
        </div>
      )}
      {imageSrc && (
        <img
          key={imageSrc}
          src={imageSrc}
          alt={alt}
          className={`${className} ${
            isLoading ? "opacity-0" : "opacity-100"
          } transition-opacity duration-200`}
          style={{ position: isLoading ? "absolute" : "static" }}
          onLoad={handleLoad}
          onError={handleError}
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  );
};

export default ProfileImage;
