import { useEffect } from "react";
import { PushNotifications } from "@capacitor/push-notifications";
import { base44 } from "@/api/base44Client";

// Module-level guard: listeners attach once per app session, even if the
// hook's host component remounts on navigation.
let initialised = false;

const isNative = () =>
  typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.();

async function sendToken(value) {
  if (!value) return;
  await base44.functions.registerDeviceToken({ token: value, platform: "ios" });
}

/**
 * Registers this device's FCM token against the authenticated Base44 user.
 * Runs only inside the native Capacitor wrapper, once the user is available.
 */
export function useNativePush(isAuthenticated) {
  useEffect(() => {
    if (!isAuthenticated || initialised || !isNative()) return;
    initialised = true;

    (async () => {
      // registration fires on every register() call and on token refresh
      await PushNotifications.addListener("registration", ({ value }) => {
        sendToken(value);
      });
      await PushNotifications.addListener("registrationError", (err) => {
        console.warn("Push registration failed", err);
      });

      let perm = await PushNotifications.checkPermissions();
      if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") {
        perm = await PushNotifications.requestPermissions();
      }
      if (perm.receive !== "granted") return;

      // Safe on every launch — the backend upserts on the token value
      await PushNotifications.register();
    })();
  }, [isAuthenticated]);
}