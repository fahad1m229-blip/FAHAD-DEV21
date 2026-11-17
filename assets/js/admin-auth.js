/**
 * FAHAD DEV Admin — Backend Firebase Auth, Username/Email Resolution,
 * Rate Limiting / Lockout, Session Management & admins/{uid} Verification
 */

import {
  ADMIN_USERNAME_DOMAIN,
  FIREBASE_CONFIG,
  FIRESTORE_DATABASE_ID,
  isFirebaseConfigured
} from "./firebase-config.js";
import { ADMIN_I18N, mapAuthErrorToMessage } from "./admin-ui.js";

const LOCKOUT_KEY = "fahad_admin_login_attempts_v2";
const MAX_ATTEMPTS = 5;
const BASE_LOCKOUT_MS = 60_000;

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

  resolveAuthEmail(identifier) {
    const clean = String(identifier || "").trim();
    if (!clean) return { ok: false, error: "empty" };
    if (clean.includes("@")) return { ok: true, email: clean };
    if (ADMIN_USERNAME_DOMAIN && ADMIN_USERNAME_DOMAIN.trim()) {
      const domain = ADMIN_USERNAME_DOMAIN.trim().replace(/^@/, "");
      return { ok: true, email: `${clean}@${domain}` };
    }
    return { ok: false, error: "username_needs_domain" };
  }

  getAttemptState() {
    try {
      const raw = JSON.parse(localStorage.getItem(LOCKOUT_KEY) || "{}");
      return {
        count: Number(raw.count || 0),
        strikes: Number(raw.strikes || 0),
        lockedUntil: Number(raw.lockedUntil || 0)
      };
    } catch {
      return { count: 0, strikes: 0, lockedUntil: 0 };
    }
  }

  getLockoutRemainingMs() {
    const st = this.getAttemptState();
    return st.lockedUntil > Date.now() ? st.lockedUntil - Date.now() : 0;
  }

  getRemainingAttempts() {
    const st = this.getAttemptState();
    return Math.max(0, MAX_ATTEMPTS - st.count);
  }

  recordFailedAttempt() {
    const st = this.getAttemptState();
    const nextCount = st.count + 1;
    if (nextCount >= MAX_ATTEMPTS) {
      const nextStrikes = st.strikes + 1;
      const duration = BASE_LOCKOUT_MS * Math.min(4, nextStrikes);
      localStorage.setItem(
        LOCKOUT_KEY,
        JSON.stringify({ count: 0, strikes: nextStrikes, lockedUntil: Date.now() + duration })
      );
    } else {
      localStorage.setItem(
        LOCKOUT_KEY,
        JSON.stringify({ count: nextCount, strikes: st.strikes, lockedUntil: 0 })
      );
    }
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
      if (!adminProfile || adminProfile.active === false) {
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
        name: data.name || data.username || "Admin",
        username: data.username || "",
        email: data.email || "",
        avatar: data.avatar || "",
        active: data.active !== false
      };
    } catch (err) {
      console.warn("[AdminAuth] Failed to read admins/{uid}:", err);
      return null;
    }
  }

  async signIn(identifier, password, rememberMe, lang = "en") {
    if (!this.auth || !this.authMod) {
      throw new Error("Firebase is not initialized.");
    }

    const resolved = this.resolveAuthEmail(identifier);
    if (!resolved.ok) {
      return {
        ok: false,
        message: ADMIN_I18N[lang]?.usernameNeedsDomain || ADMIN_I18N.en.usernameNeedsDomain
      };
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
      const cred = await signInWithEmailAndPassword(this.auth, resolved.email, password);
      const profile = await this.fetchAdminProfile(cred.user.uid);
      if (!profile || profile.active === false) {
        await this.authMod.signOut(this.auth);
        this.recordFailedAttempt();
        return { ok: false, reason: "not_admin" };
      }
      this.clearFailedAttempts();
      return { ok: true, user: cred.user, adminProfile: profile };
    } catch (err) {
      this.recordFailedAttempt();
      return { ok: false, message: mapAuthErrorToMessage(err, lang) };
    }
  }

  async resetPassword(identifier, lang = "en") {
    if (!this.auth || !this.authMod) throw new Error("Firebase not initialized");
    const resolved = this.resolveAuthEmail(identifier);
    if (!resolved.ok) {
      return {
        ok: false,
        message: ADMIN_I18N[lang]?.enterEmailFirst || ADMIN_I18N.en.enterEmailFirst
      };
    }
    try {
      await this.authMod.sendPasswordResetEmail(this.auth, resolved.email);
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
