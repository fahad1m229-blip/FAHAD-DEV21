/**
 * FAHAD DEV Admin — Firebase Auth & admins/{uid} Role Verification
 */

import { FIREBASE_CONFIG, FIRESTORE_DATABASE_ID, isFirebaseConfigured } from "./firebase-config.js";
import { mapAuthErrorToMessage } from "./admin-ui.js";

const LOCKOUT_KEY = "fahad_admin_login_attempts";
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60_000;

export class AdminAuthService {
  constructor() {
    this.app = null;
    this.auth = null;
    this.db = null;
    this.authMod = null;
    this.fsMod = null;
    this.inactivityTimer = null;
    this.inactivityMinutes = 30;
  }

  async init() {
    if (!isFirebaseConfigured()) {
      return { configured: false };
    }

    const [appMod, authMod, fsMod] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js")
    ]);

    this.authMod = authMod;
    this.fsMod = fsMod;
    this.app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(FIREBASE_CONFIG);
    this.auth = authMod.getAuth(this.app);
    this.db = FIRESTORE_DATABASE_ID && FIRESTORE_DATABASE_ID !== "(default)"
      ? fsMod.getFirestore(this.app, FIRESTORE_DATABASE_ID)
      : fsMod.getFirestore(this.app);

    return { configured: true };
  }

  getLockoutRemainingMs() {
    try {
      const raw = JSON.parse(localStorage.getItem(LOCKOUT_KEY) || "{}");
      if (raw.lockedUntil && Date.now() < raw.lockedUntil) {
        return raw.lockedUntil - Date.now();
      }
      return 0;
    } catch {
      return 0;
    }
  }

  recordFailedAttempt() {
    try {
      const raw = JSON.parse(localStorage.getItem(LOCKOUT_KEY) || "{}");
      const count = (raw.count || 0) + 1;
      const lockedUntil = count >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : 0;
      localStorage.setItem(LOCKOUT_KEY, JSON.stringify({ count: lockedUntil ? 0 : count, lockedUntil }));
    } catch {}
  }

  clearFailedAttempts() {
    localStorage.removeItem(LOCKOUT_KEY);
  }

  onAuthChange(callback) {
    if (!this.auth || !this.authMod) return () => {};
    return this.authMod.onAuthStateChanged(this.auth, async (user) => {
      if (!user) {
        callback(null);
        return;
      }
      const adminProfile = await this.fetchAdminProfile(user.uid);
      if (!adminProfile) {
        await this.authMod.signOut(this.auth);
        callback({ unauthorized: true, user });
        return;
      }
      callback({ user, adminProfile });
    });
  }

  async fetchAdminProfile(uid) {
    try {
      const { doc, getDoc } = this.fsMod;
      const snap = await getDoc(doc(this.db, "admins", uid));
      if (!snap.exists()) return null;
      const data = snap.data();
      const role = String(data.role || "viewer").toLowerCase();
      if (!["owner", "editor", "viewer"].includes(role)) return null;
      return {
        uid,
        role,
        name: data.name || "Admin",
        email: data.email || "",
        avatar: data.avatar || ""
      };
    } catch (err) {
      console.warn("[AdminAuth] Failed to read admins/{uid}:", err);
      return null;
    }
  }

  async signIn(email, password, rememberMe, lang = "en") {
    if (!this.auth || !this.authMod) {
      throw new Error("Firebase is not initialized.");
    }
    const {
      setPersistence,
      browserLocalPersistence,
      browserSessionPersistence,
      signInWithEmailAndPassword
    } = this.authMod;

    await setPersistence(
      this.auth,
      rememberMe ? browserLocalPersistence : browserSessionPersistence
    );

    try {
      const cred = await signInWithEmailAndPassword(this.auth, email.trim(), password);
      const profile = await this.fetchAdminProfile(cred.user.uid);
      if (!profile) {
        await this.authMod.signOut(this.auth);
        return { ok: false, reason: "not_admin" };
      }
      this.clearFailedAttempts();
      return { ok: true, user: cred.user, adminProfile: profile };
    } catch (err) {
      this.recordFailedAttempt();
      return { ok: false, message: mapAuthErrorToMessage(err, lang) };
    }
  }

  async resetPassword(email, lang = "en") {
    if (!this.auth || !this.authMod) throw new Error("Firebase not initialized");
    try {
      await this.authMod.sendPasswordResetEmail(this.auth, email.trim());
      return { ok: true };
    } catch (err) {
      return { ok: false, message: mapAuthErrorToMessage(err, lang) };
    }
  }

  async signOut() {
    this.stopInactivityWatcher();
    if (this.auth && this.authMod) {
      await this.authMod.signOut(this.auth);
    }
  }

  startInactivityWatcher(minutes, onTimeout) {
    this.stopInactivityWatcher();
    this.inactivityMinutes = Math.max(5, Number(minutes) || 30);

    const reset = () => {
      if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
      this.inactivityTimer = setTimeout(() => {
        onTimeout?.();
      }, this.inactivityMinutes * 60_000);
    };

    const events = ["pointerdown", "keydown", "scroll", "touchstart"];
    this._activityHandler = reset;
    this._activityEvents = events;
    events.forEach((ev) => window.addEventListener(ev, reset, { passive: true }));
    reset();
  }

  stopInactivityWatcher() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    if (this._activityEvents && this._activityHandler) {
      this._activityEvents.forEach((ev) => window.removeEventListener(ev, this._activityHandler));
    }
  }
}
