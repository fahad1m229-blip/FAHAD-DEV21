/**
 * FAHAD DEV Admin — Backend Firebase Auth, Username/Email Resolution,
 * Rate Limiting / Lockout, Timeout-Safe Verification & Diagnostic Logging
 */

import {
  ADMIN_USERNAME_DOMAIN,
  FIRESTORE_DATABASE_ID,
  getFirebaseConfig,
  getMissingFirebaseFields,
  initFirebaseServices
} from "./firebase-config.js";
import { ADMIN_I18N, mapAuthErrorToMessage } from "./admin-ui.js";

const LOCKOUT_KEY = "fahad_admin_login_attempts_v2";
const MAX_ATTEMPTS = 5;
const BASE_LOCKOUT_MS = 60_000;
const PERSISTENCE_TIMEOUT_MS = 4_000;
const AUTH_REQUEST_TIMEOUT_MS = 15_000;
const DB_VERIFY_TIMEOUT_MS = 10_000;

function withTimeout(promise, ms, errorCode) {
  let timerId = null;
  const timeoutPromise = new Promise((_, reject) => {
    timerId = setTimeout(() => {
      const err = new Error(`Request timed out after ${ms}ms (${errorCode})`);
      err.code = errorCode;
      reject(err);
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timerId !== null) clearTimeout(timerId);
  });
}

function maskIdentifier(identifier) {
  const s = String(identifier || "").trim();
  if (!s) return "(empty)";
  const at = s.indexOf("@");
  if (at > 1) {
    return `${s.slice(0, 2)}***${s.slice(at)}`;
  }
  return `${s.slice(0, 2)}***`;
}

export class AdminAuthService {
  constructor() {
    this.app = null;
    this.auth = null;
    this.db = null;
    this.authMod = null;
    this.fsMod = null;
    this.inactivityTimer = null;
    this.inactivityMinutes = 30;
    this._initPromise = null;
    this._signingIn = false;
    this._profileInFlight = new Map();
  }

  async init() {
    if (this.auth && this.db) {
      return { configured: true };
    }
    if (this._initPromise) {
      return this._initPromise;
    }

    this._initPromise = (async () => {
      const cfg = getFirebaseConfig();
      const missingFields = getMissingFirebaseFields();
      console.info("[AdminAuth] Diagnostic init check:", {
        configured: missingFields.length === 0,
        missingFields,
        projectId: cfg?.projectId || "(unset)",
        databaseId: FIRESTORE_DATABASE_ID || "(default)"
      });

      const start = performance.now();
      const services = await initFirebaseServices();

      if (!services.configured) {
        console.warn("[AdminAuth] Firebase Web configuration is incomplete or placeholder:", services.missingFields);
        this._initPromise = null;
        return { configured: false, missingFields: services.missingFields };
      }

      if (services.sdkError) {
        console.error("[AdminAuth] Failed to initialize Firebase SDK:", {
          code: services.sdkError?.code || "INIT_ERROR",
          message: services.sdkError?.message || String(services.sdkError)
        });
        this._initPromise = null;
        return { configured: true, sdkError: services.sdkError };
      }

      this.app = services.app;
      this.auth = services.auth;
      this.db = services.db;
      this.authMod = services.authMod;
      this.fsMod = services.fsMod;

      console.info("[AdminAuth] Firebase Auth & Firestore SDK ready.", {
        elapsedMs: Math.round(performance.now() - start)
      });
      return { configured: true, missingFields: [] };
    })();

    return this._initPromise;
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
    try {
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
    } catch {}
  }

  clearFailedAttempts() {
    try {
      localStorage.removeItem(LOCKOUT_KEY);
    } catch {}
  }

  onAuthChange(callback) {
    if (!this.auth || !this.authMod) return () => {};
    return this.authMod.onAuthStateChanged(this.auth, async (user) => {
      if (!user) {
        console.info("[AdminAuth] Auth state: signed out.");
        callback(null);
        return;
      }

      console.info("[AdminAuth] Auth state changed: verifying Firestore admins/{uid}...", {
        uid: user.uid
      });

      const verification = await this.verifyAdminRecord(user.uid);
      if (!verification.ok) {
        if (this._signingIn) {
          // Let signIn() own the error reporting and cleanup to prevent race conditions.
          return;
        }
        try {
          await this.authMod.signOut(this.auth);
        } catch {}
        callback({
          unauthorized: true,
          reason: verification.reason,
          user
        });
        return;
      }

      console.info("[AdminAuth] Admin session verified.", {
        uid: user.uid,
        role: verification.profile.role
      });
      callback({ user, adminProfile: verification.profile });
    });
  }

  async verifyAdminRecord(uid) {
    if (this._profileInFlight.has(uid)) {
      return this._profileInFlight.get(uid);
    }

    const job = (async () => {
      const start = performance.now();
      try {
        const { doc, getDoc } = this.fsMod;
        const snap = await withTimeout(
          getDoc(doc(this.db, "admins", uid)),
          DB_VERIFY_TIMEOUT_MS,
          "FIRESTORE_TIMEOUT"
        );

        if (!snap.exists()) {
          console.warn("[AdminDB] Document admins/{uid} does not exist.", {
            uid,
            elapsedMs: Math.round(performance.now() - start)
          });
          return { ok: false, reason: "not_admin" };
        }

        const data = snap.data();
        const rawRole = String(data.role || "viewer").trim().toLowerCase();
        const normalizedRole = ["owner", "admin", "superadmin", "super_admin"].includes(rawRole)
          ? "owner"
          : ["editor", "viewer"].includes(rawRole)
          ? rawRole
          : null;

        if (!normalizedRole) {
          console.warn("[AdminDB] Invalid admin role in admins/{uid}.", { uid, role: rawRole });
          return { ok: false, reason: "not_admin" };
        }

        if (data.active === false) {
          console.warn("[AdminDB] Admin account is marked inactive.", { uid });
          return { ok: false, reason: "inactive" };
        }

        const profile = {
          uid,
          role: normalizedRole,
          name: data.name || data.username || "Admin",
          username: data.username || "",
          email: data.email || this.auth?.currentUser?.email || "",
          avatar: data.avatar || "",
          active: true
        };

        console.info("[AdminDB] Firestore admin verification succeeded.", {
          uid,
          role,
          elapsedMs: Math.round(performance.now() - start)
        });
        return { ok: true, profile };
      } catch (err) {
        const code = err?.code || "FIRESTORE_ERROR";
        console.error("[AdminDB] Firestore verification error:", {
          uid,
          code,
          message: err?.message || String(err),
          elapsedMs: Math.round(performance.now() - start)
        });

        if (code === "permission-denied") {
          return { ok: false, reason: "permission_denied", code };
        }
        if (code === "FIRESTORE_TIMEOUT" || code === "unavailable") {
          return { ok: false, reason: "db_timeout", code };
        }
        return { ok: false, reason: "db_error", code, message: err?.message };
      } finally {
        this._profileInFlight.delete(uid);
      }
    })();

    this._profileInFlight.set(uid, job);
    return job;
  }

  async fetchAdminProfile(uid) {
    const res = await this.verifyAdminRecord(uid);
    return res.ok ? res.profile : null;
  }

  async signIn(identifier, password, rememberMe, lang = "en") {
    const reqStart = performance.now();
    console.info("[AdminAuth] Step 1/4: Starting admin login flow.", {
      identifier: maskIdentifier(identifier),
      rememberMe: Boolean(rememberMe)
    });

    if (!this.auth || !this.authMod) {
      const initResult = await this.init();
      if (!initResult.configured) {
        console.error("[AdminAuth] Aborted: Firebase Web credentials are not configured.", initResult.missingFields);
        const baseMsg = ADMIN_I18N[lang]?.firebaseNotConfigured || ADMIN_I18N.en.firebaseNotConfigured;
        const fieldsNote = initResult.missingFields?.length
          ? ` (${initResult.missingFields.join(", ")})`
          : "";
        return {
          ok: false,
          showAttemptsLeft: false,
          message: `${baseMsg}${fieldsNote}`
        };
      }
      if (initResult.sdkError || !this.auth || !this.authMod) {
        console.error("[AdminAuth] Aborted: Firebase SDK initialization failed.");
        return {
          ok: false,
          showAttemptsLeft: false,
          message: ADMIN_I18N[lang]?.sdkLoadError || ADMIN_I18N.en.sdkLoadError
        };
      }
    }

    const resolved = this.resolveAuthEmail(identifier);
    if (!resolved.ok) {
      console.warn("[AdminAuth] Identifier rejected before network request:", resolved.error);
      return {
        ok: false,
        showAttemptsLeft: false,
        message: ADMIN_I18N[lang]?.usernameNeedsDomain || ADMIN_I18N.en.usernameNeedsDomain
      };
    }

    const {
      setPersistence,
      browserLocalPersistence,
      browserSessionPersistence,
      inMemoryPersistence,
      signInWithEmailAndPassword
    } = this.authMod;

    // Step 2: Persistence setup with timeout & safe fallback so browser storage blocks never hang login
    console.info("[AdminAuth] Step 2/4: Applying auth persistence.");
    try {
      await withTimeout(
        setPersistence(
          this.auth,
          rememberMe ? browserLocalPersistence : browserSessionPersistence
        ),
        PERSISTENCE_TIMEOUT_MS,
        "PERSISTENCE_TIMEOUT"
      );
    } catch (persistErr) {
      console.warn("[AdminAuth] Storage persistence failed/timed out; falling back to in-memory persistence.", {
        code: persistErr?.code || "PERSISTENCE_WARN",
        message: persistErr?.message || String(persistErr)
      });
      try {
        await setPersistence(this.auth, inMemoryPersistence);
      } catch {}
    }

    // Step 3: Firebase Auth signInWithEmailAndPassword (Identity Toolkit POST)
    this._signingIn = true;
    try {
      console.info("[AdminAuth] Step 3/4: Sending Firebase Auth sign-in request.");
      const cred = await withTimeout(
        signInWithEmailAndPassword(this.auth, resolved.email, password),
        AUTH_REQUEST_TIMEOUT_MS,
        "AUTH_TIMEOUT"
      );

      console.info("[AdminAuth] Step 4/4: Auth succeeded, verifying Firestore admins/{uid}.", {
        uid: cred.user.uid
      });

      const verification = await this.verifyAdminRecord(cred.user.uid);
      if (!verification.ok) {
        try {
          await this.authMod.signOut(this.auth);
        } catch {}

        if (verification.reason === "not_admin" || verification.reason === "inactive") {
          this.recordFailedAttempt();
        }

        let msgKey = "notAdminError";
        if (verification.reason === "inactive") msgKey = "adminInactiveError";
        if (verification.reason === "permission_denied") msgKey = "dbPermissionError";
        if (verification.reason === "db_timeout" || verification.reason === "db_error") msgKey = "dbTimeoutError";

        return {
          ok: false,
          reason: verification.reason,
          showAttemptsLeft: verification.reason === "not_admin",
          message: ADMIN_I18N[lang]?.[msgKey] || ADMIN_I18N.en[msgKey]
        };
      }

      this.clearFailedAttempts();
      console.info("[AdminAuth] Login flow completed successfully.", {
        uid: cred.user.uid,
        role: verification.profile.role,
        elapsedMs: Math.round(performance.now() - reqStart)
      });
      return { ok: true, user: cred.user, adminProfile: verification.profile };
    } catch (err) {
      const code = err?.code || "AUTH_UNKNOWN";
      console.error("[AdminAuth] Firebase Auth request failed.", {
        code,
        message: err?.message || String(err),
        elapsedMs: Math.round(performance.now() - reqStart)
      });
      if (code !== "AUTH_TIMEOUT" && code !== "auth/network-request-failed") {
        this.recordFailedAttempt();
      }
      return {
        ok: false,
        code,
        showAttemptsLeft: code !== "AUTH_TIMEOUT" && code !== "auth/network-request-failed",
        message: mapAuthErrorToMessage(err, lang)
      };
    } finally {
      this._signingIn = false;
    }
  }

  async resetPassword(identifier, lang = "en") {
    if (!this.auth || !this.authMod) {
      const initResult = await this.init();
      if (!initResult.configured || initResult.sdkError || !this.auth || !this.authMod) {
        return {
          ok: false,
          message: ADMIN_I18N[lang]?.firebaseNotConfigured || ADMIN_I18N.en.firebaseNotConfigured
        };
      }
    }

    const resolved = this.resolveAuthEmail(identifier);
    if (!resolved.ok) {
      return {
        ok: false,
        message: ADMIN_I18N[lang]?.enterEmailFirst || ADMIN_I18N.en.enterEmailFirst
      };
    }
    try {
      await withTimeout(
        this.authMod.sendPasswordResetEmail(this.auth, resolved.email),
        AUTH_REQUEST_TIMEOUT_MS,
        "AUTH_TIMEOUT"
      );
      return { ok: true };
    } catch (err) {
      console.error("[AdminAuth] Password reset failed:", {
        code: err?.code || "RESET_ERROR",
        message: err?.message || String(err)
      });
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
