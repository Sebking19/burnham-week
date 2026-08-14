import { useEffect } from "react";
import { PushNotifications } from "@capacitor/push-notifications";
import { base44 } from "@/api/base44Client";

// Module-level guard: listeners attach once per app session, even if the
// hook's host component remounts on navigation.
let initialised = false;
let lastSent = null;

const isNative = () =>
  typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.();

/**
 * Sends an FCM registration token to the backend for the signed-in user.
 * Exposed on window so the native layer can call it directly (see below).
 */
async function sendToken(value) {
  const token = typeof value === "string" ? value.trim() : "";
  if (!token || token === lastSent) return { ok: false, skipped: true };
  const res = await base44.functions.invoke("registerDeviceToken", {
    token,
    platform: "ios",
  });
  lastSent = token;
  return res?.data ?? { ok: true };
}

/**
 * Associates this device's FCM token with the authenticated Base44 user.
 *
 * iOS note: Capacitor's own "registration" event yields the APNs token, and
 * Firebase's swizzling usually stops it firing at all — so the FCM token is
 * pushed in from the native side via window.registerFcmToken(token).
 */
export function useNativePush(isAuthenticated) {
  useEffect(() => {
    if (!isAuthenticated || initialised || !isNative()) return;
    initialised = true;

    // Native bridge: call this from Swift once Firebase hands you the token.
    window.registerFcmToken = (token) =>
      sendToken(token).catch((err) => {
        console.warn("registerDeviceToken failed", err);
        return { ok: false, error: String(err) };
      });

    // If native stashed a token before the webview finished booting, use it.
    if (window.__pendingFcmToken) {
      window.registerFcmToken(window.__pendingFcmToken);
    }

    (async () => {
      await PushNotifications.addListener("registrationError", (err) => {
        console.warn("Push registration failed", err);
      });

      let perm = await PushNotifications.checkPermissions();
      if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") {
        perm = await PushNotifications.requestPermissions();
      }
      if (perm.receive !== "granted") return;

      // Registers with APNs so Firebase can mint/refresh the FCM token.
      await PushNotifications.register();
    })();
  }, [isAuthenticated]);
}