// src/hooks/usePageTitle.js
import { useEffect } from "react";

const DEFAULT_TITLE = "Product Shelf";

export const usePageTitle = ({
  prefix = "",
  value = "",
  fallback = DEFAULT_TITLE,
}) => {
  useEffect(() => {
    let title = fallback;

    if (value && value.trim()) {
      title = prefix ? `${prefix}: ${value}` : value;
    } else if (prefix) {
      title = prefix;
    }

    document.title = title;

    return () => {
      document.title = fallback;
    };
  }, [prefix, value, fallback]);
};
