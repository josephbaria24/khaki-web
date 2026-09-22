/** Imperative toast API — call from anywhere after ToastProvider is mounted. */

let pushToast = null;

export function bindToast(fn) {
  pushToast = fn;
  return () => {
    if (pushToast === fn) pushToast = null;
  };
}

function show(message, type = "success") {
  if (!message) return;
  if (!pushToast) {
    if (typeof console !== "undefined") console.warn("[toast]", type, message);
    return;
  }
  pushToast({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, message: String(message), type });
}

export const toast = {
  success: (message) => show(message, "success"),
  error: (message) => show(message, "error"),
  info: (message) => show(message, "info"),
};
