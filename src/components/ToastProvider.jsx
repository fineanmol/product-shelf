import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DEFAULT_TOAST_DURATION, subscribeToToasts } from "../utils/showToast";

/**
 * Mounts once near the app root (see src/App.js). Subscribes to the
 * showToast() event emitter and renders any active toasts through React
 * (via a portal into document.body), so the DOM nodes are owned by React's
 * reconciler instead of being manually created/removed. Multiple toasts
 * stack in a list instead of overlapping, and each is announced to screen
 * readers via role="status"/aria-live="polite".
 */
export default function ToastProvider() {
  const [toasts, setToasts] = useState([]);
  const timeoutsRef = useRef(new Map());

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timeoutId = timeoutsRef.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutsRef.current.delete(id);
    }
  }, []);

  useEffect(() => {
    const timeouts = timeoutsRef.current;

    const unsubscribe = subscribeToToasts((toast) => {
      setToasts((current) => [...current, toast]);
      const timeoutId = setTimeout(() => {
        dismissToast(toast.id);
      }, DEFAULT_TOAST_DURATION);
      timeouts.set(toast.id, timeoutId);
    });

    return () => {
      unsubscribe();
      timeouts.forEach((timeoutId) => clearTimeout(timeoutId));
      timeouts.clear();
    };
  }, [dismissToast]);

  if (toasts.length === 0) return null;

  return createPortal(
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast">
          {toast.message}
        </div>
      ))}
    </div>,
    document.body
  );
}
