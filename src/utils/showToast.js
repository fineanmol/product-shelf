// Lightweight pub/sub so `showToast()` can still be called as a plain
// function from anywhere (event handlers, async callbacks, utils, etc.)
// without needing a hook or prop-drilling. <ToastProvider> (mounted once
// near the app root) subscribes to this emitter and renders the actual
// toasts through React, so the DOM is fully owned by React's render tree.
const listeners = new Set();

export const DEFAULT_TOAST_DURATION = 3000;

/**
 * Show a toast notification.
 *
 * Call signature is unchanged from the previous implementation:
 * showToast("Some message"). Any extra arguments are accepted but
 * currently ignored, matching the previous implementation's behavior
 * (e.g. showToast("msg", "error") historically had no effect on styling).
 */
export const showToast = (message = "Saved!") => {
  const toast = {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    message,
  };
  listeners.forEach((listener) => listener(toast));
  return toast.id;
};

// Internal: used by ToastProvider only.
export const subscribeToToasts = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
