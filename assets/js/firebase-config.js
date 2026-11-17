/**
 * FAHAD DEV — Firebase Web Configuration & Singleton Service Initializer
 * ---------------------------------------------------------------------------
 * Project: nex-ora-top
 * Initializes Firebase App, Firebase Authentication, and Cloud Firestore
 * as a single memoized instance so Firebase is never initialized multiple times.
 */

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyC1lakPZTiYKvkrtoWbGzHQ2_bknLUBWLg",
  authDomain: "nex-ora-top.firebaseapp.com",
  databaseURL: "https://nex-ora-top-default-rtdb.firebaseio.com",
  projectId: "nex-ora-top",
  storageBucket: "nex-ora-top.firebasestorage.app",
  messagingSenderId: "241377330781",
  appId: "1:241377330781:web:0dcc750aa63aa69121efb4"
};

export const firebaseConfig = FIREBASE_CONFIG;

/**
 * Optional named Firestore database ID.
 * Leave as "(default)" unless you created a named Firestore database.
 */
export const FIRESTORE_DATABASE_ID = "(default)";

/**
 * Optional domain used when an admin signs in with a plain username
 * (e.g. "fahad" -> "fahad@fahaddev.admin") instead of a full email address.
 * Leave empty ("") if admins sign in with their Firebase Auth email address.
 */
export const ADMIN_USERNAME_DOMAIN = "";

const REQUIRED_KEYS = ["apiKey", "authDomain", "projectId", "appId"];
const SDK_VERSION = "11.0.2";
const SDK_LOAD_TIMEOUT_MS = 15_000;

let _servicesPromise = null;
let _cachedServices = null;

function isPlaceholderValue(val) {
  const s = String(val ?? "").trim();
  return (
    !s ||
    s.startsWith("YOUR_") ||
    s.includes("YOUR_PROJECT_ID") ||
    s.startsWith("<") ||
    s.startsWith("REPLACE_")
  );
}

function withSdkTimeout(promise, ms) {
  let timerId = null;
  const timeout = new Promise((_, reject) => {
    timerId = setTimeout(() => {
      const err = new Error(`Firebase SDK load timed out after ${ms}ms`);
      err.code = "SDK_LOAD_TIMEOUT";
      reject(err);
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timerId !== null) clearTimeout(timerId);
  });
}

/**
 * Returns the active Firebase Web App configuration, allowing an optional
 * runtime window.__FIREBASE_CONFIG__ override without conflicting with defaults.
 */
export function getFirebaseConfig() {
  const injected =
    typeof globalThis !== "undefined" &&
    globalThis.__FIREBASE_CONFIG__ &&
    typeof globalThis.__FIREBASE_CONFIG__ === "object"
      ? globalThis.__FIREBASE_CONFIG__
      : null;

  return injected ? { ...FIREBASE_CONFIG, ...injected } : FIREBASE_CONFIG;
}

/**
 * Lists any required Firebase Web App config keys that are missing or placeholders.
 */
export function getMissingFirebaseFields() {
  const cfg = getFirebaseConfig();
  return REQUIRED_KEYS.filter((key) => isPlaceholderValue(cfg[key]));
}

/**
 * Returns true when real Firebase Web credentials have been configured.
 */
export function isFirebaseConfigured() {
  return getMissingFirebaseFields().length === 0;
}

/**
 * Singleton initializer for Firebase App, Firebase Auth, and Cloud Firestore.
 * Safe to call from both public and admin modules without duplicate initialization.
 */
export async function initFirebaseServices() {
  if (_cachedServices) {
    return _cachedServices;
  }
  if (_servicesPromise) {
    return _servicesPromise;
  }

  _servicesPromise = (async () => {
    const cfg = getFirebaseConfig();
    const missingFields = getMissingFirebaseFields();
    if (missingFields.length > 0) {
      return { configured: false, missingFields };
    }

    try {
      const [appMod, authMod, fsMod] = await withSdkTimeout(
        Promise.all([
          import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-app.js`),
          import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-auth.js`),
          import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-firestore.js`)
        ]),
        SDK_LOAD_TIMEOUT_MS
      );

      const app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(cfg);
      const auth = authMod.getAuth(app);
      const db = FIRESTORE_DATABASE_ID && FIRESTORE_DATABASE_ID !== "(default)"
        ? fsMod.getFirestore(app, FIRESTORE_DATABASE_ID)
        : fsMod.getFirestore(app);

      _cachedServices = {
        configured: true,
        missingFields: [],
        app,
        auth,
        db,
        appMod,
        authMod,
        fsMod
      };
      return _cachedServices;
    } catch (err) {
      _servicesPromise = null;
      return { configured: true, missingFields: [], sdkError: err };
    }
  })();

  return _servicesPromise;
}
