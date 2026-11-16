/**
 * FAHAD DEV — Firebase Web Configuration
 * ---------------------------------------------------------------------------
 * Replace the placeholder strings below with your Firebase Web App config
 * from Firebase Console -> Project Settings -> Your Apps -> Web App.
 *
 * SECURITY NOTE:
 * Never place Firebase Admin SDK credentials, serviceAccountKey.json, or
 * private server secrets in frontend files. Firebase Web config values are
 * public identifiers secured by Firebase Security Rules (see /firestore.rules).
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
 * Returns true when real Firebase Web credentials have been configured.
 */
export function isFirebaseConfigured() {
  return Boolean(
    FIREBASE_CONFIG.apiKey &&
    !FIREBASE_CONFIG.apiKey.startsWith("YOUR_") &&
    FIREBASE_CONFIG.projectId &&
    !FIREBASE_CONFIG.projectId.startsWith("YOUR_") &&
    FIREBASE_CONFIG.appId &&
    !FIREBASE_CONFIG.appId.startsWith("YOUR_")
  );
}
