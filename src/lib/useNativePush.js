import { useEffect } from "react";
import { PushNotifications } from "@capacitor/push-notifications";
import { base44 } from "@/api/base44Client";

// Module-level guards: the bridge installs once, listeners attach once,
// even if the hook's host component remounts on navigation.
let bridgeInstalled = false;
let pushInitialised = false;
let lastSent = null;
let authReady = false;

const isNative = () =>
  typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.();

/**
 * Sends an FCM registration token to the backend for the signed-in user.
 * If the user isn't signed in yet, the token is parked on
 * window.__pendingFcmToken and flushed once auth is available.
 */
async function sendToken(value) {
  const token = typeof value === "string" ? value.trim() : "";
  if (!token) return { ok: false, error: "Missing token" };

  if (!authReady) {
    window.__pendingFcmToken = token;
    return { ok: false, pending: true };
  }
  if (token === lastSent) return { ok: true, skipped: true };

  const res = await base44.functions.invoke("registerDeviceToken", {
    token,
    platform: "ios",
  });
  lastSent = token;
  window.__pendingFcmToken = null;
  return res?.data ?? { ok: true };
}

function flushPendingToken() {
  if (window.__pendingFcmToken) window.registerFcmToken(window.__pendingFcmToken);
}

/**
 * Installs the native bridge on window. Runs at import time so the functions
 * exist before React finishes mounting and before the user signs in — native
 * can call them at any point without risking a JS exception.
 */
function installBridge() {
  if (bridgeInstalled || typeof window === "undefined") return;
  bridgeInstalled = true;

  // Called by native (AppDelegate) with the Firebase FCM token.
  window.registerFcmToken = (token) =>
    sendToken(token).catch((err) => {
      console.warn("registerDeviceToken failed", err);
      return { ok: false, error: String(err) };
    });

  // Called by native to confirm the webview is loaded and ready for handoff.
  // Native follows this by calling registerFcmToken(pendingFCMToken); the
  // pending check below also covers a token that arrived before this point.
  window.notifyNativeWebViewReady = () => {
    flushPendingToken();
    return { ready: true, authenticated: authReady };
  };
}

installBridge();

/**
 * Associates this device's FCM token with the authenticated Base44 user.
 *
 * iOS note: Capacitor's own "registration" event yields the APNs token, and
 * Firebase's swizzling usually stops it firing at all — so the FCM token is
 * pushed in from the native side via window.registerFcmToken(token).
 */
export function useNativePush(isAuthenticated) {
  useEffect(() => {
    if (!isAuthenticated) return;

    // Auth is now available: accept tokens and drain anything native parked.
    authReady = true;
    flushPendingToken();

    if (pushInitialised || !isNative()) return;
    pushInitialised = true;

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