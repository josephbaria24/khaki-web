import { api } from "@/lib/store";
import { isTaskerMode } from "@/lib/roles";

export const LOCATION_SHARE_MS = 45 * 1000;

export function hasLocationConsent(user) {
  return Boolean(user?.location_consent_at);
}

export function shouldShareLocation(user) {
  if (!user?.id) return false;
  if (!hasLocationConsent(user)) return false;
  return isTaskerMode(user);
}

function readPosition() {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("This browser cannot share a location."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error("Location permission is off.")),
      { enableHighAccuracy: true, maximumAge: 20000, timeout: 15000 }
    );
  });
}

export async function pushRiderLocation() {
  const point = await readPosition();
  return api.teams.shareLocation(point.lat, point.lng);
}

/**
 * Keep a rider pin fresh while the app is open and they are Online.
 * Returns a stop() function.
 */
export function startLocationShare({ enabled, onNeedConsent, onError }) {
  if (!enabled) return () => {};
  let live = true;
  let timer = null;

  const tick = async () => {
    if (!live) return;
    try {
      await pushRiderLocation();
    } catch (err) {
      const msg = err?.message || "";
      if (/consent/i.test(msg)) {
        onNeedConsent?.(err);
        return;
      }
      // Permission / offline — soft fail; try again next interval.
      onError?.(err);
    }
  };

  tick();
  timer = window.setInterval(tick, LOCATION_SHARE_MS);

  return () => {
    live = false;
    if (timer) window.clearInterval(timer);
  };
}
