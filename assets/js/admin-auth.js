/**
 * FAHAD DEV Admin — Single-Admin Server Authentication & HTTP-Only Session Client
 * All credential verification, rate limiting, and session cookies happen on the server.
 */

import { ADMIN_I18N } from "./admin-ui.js";

const REQUEST_TIMEOUT_MS = 15_000;

export class AdminAuthService {
  constructor() {
    this.inactivityTimer = null;
    this.inactivityMinutes = 30;
    this._unauthorizedHandler = null;
  }

  setUnauthorizedHandler(handler) {
    this._unauthorizedHandler = handler;
  }

  async _fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      return await fetch(url, {
        credentials: "same-origin",
        cache: "no-store",
        ...options,
        signal: controller.signal
      });
    } finally {
      clearTimeout(timer);
    }
  }

  async checkSession() {
    try {
      const res = await this._fetchWithTimeout("/api/admin/auth/session", { method: "GET" });
      if (!res.ok) {
        return { configured: true, authenticated: false };
      }
      const data = await res.json();
      return {
        configured: data.configured !== false,
        missing: data.missing || [],
        authenticated: Boolean(data.authenticated),
        adminProfile: data.adminProfile || null
      };
    } catch (err) {
      return { configured: true, authenticated: false, networkError: true, error: err };
    }
  }

  async signIn(email, password, rememberMe, lang = "en") {
    const cleanEmail = String(email || "").trim();
    if (!cleanEmail || !password) {
      return {
        ok: false,
        message: ADMIN_I18N[lang]?.invalidCredentials || ADMIN_I18N.en.invalidCredentials
      };
    }

    try {
      const res = await this._fetchWithTimeout("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          password: String(password),
          rememberMe: Boolean(rememberMe)
        })
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        return {
          ok: true,
          adminProfile: data.adminProfile
        };
      }

      if (data.code === "SERVER_NOT_CONFIGURED") {
        const missing = data.message || ADMIN_I18N[lang]?.serverNotConfigured || ADMIN_I18N.en.serverNotConfigured;
        return { ok: false, status: res.status, code: data.code, message: missing };
      }

      if (res.status === 429) {
        return {
          ok: false,
          status: 429,
          code: data.code || "LOCKED_OUT",
          retryAfterSec: Number(data.retryAfterSec || 60),
          message:
            data.message ||
            `${ADMIN_I18N[lang]?.lockoutWait || ADMIN_I18N.en.lockoutWait}`
        };
      }

      return {
        ok: false,
        status: res.status,
        code: data.code || "INVALID_CREDENTIALS",
        attemptsLeft: typeof data.attemptsLeft === "number" ? data.attemptsLeft : undefined,
        message:
          data.message ||
          ADMIN_I18N[lang]?.invalidCredentials ||
          ADMIN_I18N.en.invalidCredentials
      };
    } catch (err) {
      const isAbort = err?.name === "AbortError";
      return {
        ok: false,
        message: isAbort
          ? ADMIN_I18N[lang]?.authTimeoutError || ADMIN_I18N.en.authTimeoutError
          : ADMIN_I18N[lang]?.networkError || ADMIN_I18N.en.networkError
      };
    }
  }

  async changePassword({ currentPassword, newPassword }) {
    try {
      const res = await this._fetchWithTimeout("/api/admin/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 && data.message?.toLowerCase().includes("authentication required")) {
        this._unauthorizedHandler?.();
      }
      return {
        ok: Boolean(res.ok && data.ok),
        status: res.status,
        sessionsInvalidated: Boolean(data.sessionsInvalidated),
        message: data.message || (res.ok ? "Password updated." : "Failed to update password.")
      };
    } catch (err) {
      return {
        ok: false,
        message: err?.name === "AbortError" ? "Request timed out." : "Network error."
      };
    }
  }

  async signOut() {
    this.stopInactivityWatcher();
    try {
      await this._fetchWithTimeout("/api/admin/auth/logout", { method: "POST" });
    } catch {}
  }

  async apiFetch(url, options = {}) {
    const res = await this._fetchWithTimeout(url, options);
    if (res.status === 401) {
      this.stopInactivityWatcher();
      this._unauthorizedHandler?.();
      const err = new Error("Unauthorized session.");
      err.status = 401;
      throw err;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.message || `Request failed (${res.status})`);
      err.status = res.status;
      throw err;
    }
    return data;
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
