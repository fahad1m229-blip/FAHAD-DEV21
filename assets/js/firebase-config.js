/**
 * FAHAD DEV — Firebase Web Configuration
 * ---------------------------------------------------------------------------
 * Paste your real Firebase Web App config from:
 *   Firebase Console -> Project Settings -> Your Apps -> Web App (</>)
 *
 * NOTE ON STATIC HOSTING & ENVIRONMENT VARIABLES:
 * Because FAHAD DEV runs as a pure static ES-Module site (GitHub Pages / Render
 * Static Site compatible with no build bundler), browser JS cannot read server
 * .env / process.env variables directly. Place your Firebase Web App values
 * below (or inject window.__FIREBASE_CONFIG__ before loading modules).
 *
 * Firebase Web App config keys are public client identifiers protected by
 * Firebase Authentication Authorized Domains and Firestore Security Rules.
 */

export const FIREBASE_CONFIG = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_FIREBASE_WEB_APP_ID"
};

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
