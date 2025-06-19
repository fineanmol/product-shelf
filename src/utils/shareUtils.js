// Share utility functions for consistent sharing across the app

/**
 * Handle sharing with multiple fallback methods
 * 1. Native Web Share API (mobile)
 * 2. Clipboard API (modern browsers)
 * 3. Manual text selection fallback
 * 4. Alert with URL (last resort)
 */
export const handleShare = async (shareData) => {
  const { title, text, url } = shareData;

  // Method 1: Try native Web Share API (works great on mobile)
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url,
      });
      return { success: true, method: "native" };
    } catch (error) {
      if (error.name !== "AbortError") {
        console.log("Native share failed, trying clipboard...", error);
      } else {
        return { success: false, method: "native", error: "User cancelled" };
      }
    }
  }

  // Method 2: Try Clipboard API
  if (navigator.clipboard && window.isSecureContext) {
    try {
      const shareText = `${title}\n\n${text}\n\n${url}`;
      await navigator.clipboard.writeText(shareText);
      return {
        success: true,
        method: "clipboard",
        message: "Link copied to clipboard!",
      };
    } catch (error) {
      console.log("Clipboard API failed, trying text selection...", error);
    }
  }

  // Method 3: Fallback - Create temporary input for text selection
  try {
    const shareText = `${title}\n\n${text}\n\n${url}`;
    const textArea = document.createElement("textarea");
    textArea.value = shareText;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);

    if (successful) {
      return {
        success: true,
        method: "selection",
        message: "Link copied to clipboard!",
      };
    }
  } catch (error) {
    console.log("Text selection fallback failed:", error);
  }

  // Method 4: Last resort - show alert with URL
  const shareText = `${title}\n\n${text}\n\n${url}`;
  alert(`Share this link:\n\n${shareText}`);
  return { success: true, method: "alert", message: "Share link displayed" };
};

/**
 * Create a shareable product URL
 */
export const createProductShareUrl = (productId) => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/product/${productId}`;
};

/**
 * Share a specific product with proper formatting
 */
export const shareProduct = async (product) => {
  if (!product) {
    console.error("No product provided for sharing");
    return { success: false, error: "No product data" };
  }

  const shareUrl = createProductShareUrl(product.id);

  const shareData = {
    title: `${product.title} - MarketSpace`,
    text: `Check out this ${product.condition || "item"} for €${
      product.price
    } on MarketSpace!\n\n${product.description?.substring(0, 100)}${
      product.description?.length > 100 ? "..." : ""
    }`,
    url: shareUrl,
  };

  return await handleShare(shareData);
};

/**
 * Share the general marketplace
 */
export const shareMarketplace = async () => {
  const shareData = {
    title: "MarketSpace - Your Local Marketplace",
    text: "Discover amazing products at great prices on MarketSpace!",
    url: window.location.origin,
  };

  return await handleShare(shareData);
};

/**
 * Generic share function for any content
 */
export const shareContent = async (title, text, url = window.location.href) => {
  const shareData = { title, text, url };
  return await handleShare(shareData);
};
