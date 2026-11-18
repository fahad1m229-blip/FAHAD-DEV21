/**
 * FAHAD DEV — Single-Admin Cryptographic Authentication, Session & Rate-Limit Engine
 * Zero external dependencies: uses Node.js native crypto (scrypt, HMAC-SHA256, timingSafeEqual).
 */

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export const SESSION_COOKIE_NAME = "fahad_admin_session";
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 };
const SHORT_SESSION_MS = 8 * 60 * 60 * 1000;      // 8 hours
const REMEMBER_SESSION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const MAX_FAILED_ATTEMPTS = 5;
const BASE_LOCKOUT_MS = 60 * 1000;
const MAX_LOCKOUT_MS = 15 * 60 * 1000;
const IP_WINDOW_MS = 15 * 60 * 1000;
const IP_WINDOW_MAX_REQ = 30;

// Precomputed dummy scrypt hash used to equalize timing on unknown email attempts
const DUMMY_SCRYPT_HASH =
  "scrypt$000102030405060708090a0b0c0d0e0f$" +
  "00".repeat(64);

function scryptAsync(password, saltBuf, keylen = 64) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, saltBuf, keylen, SCRYPT_PARAMS, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

function pbkdf2Async(password, saltBuf, iterations, keylen = 64) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, saltBuf, iterations, keylen, "sha512", (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derived = await scryptAsync(String(password), salt, 64);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(password, storedHash) {
  const raw = String(storedHash || "").trim();
  const pwd = String(password || "");
  if (!raw || !pwd) return false;

  const parts = raw.split("$");
  try {
    if (parts[0] === "scrypt" && parts.length === 3) {
      const saltBuf = Buffer.from(parts[1], "hex");
      const expectedBuf = Buffer.from(parts[2], "hex");
      if (!saltBuf.length || !expectedBuf.length) return false;
      const derived = await scryptAsync(pwd, saltBuf, expectedBuf.length);
      return derived.length === expectedBuf.length && crypto.timingSafeEqual(derived, expectedBuf);
    }

    if (parts[0] === "pbkdf2" && parts.length === 4) {
      const iterations = Number(parts[1]);
      const saltBuf = Buffer.from(parts[2], "hex");
      const expectedBuf = Buffer.from(parts[3], "hex");
      if (!Number.isFinite(iterations) || iterations < 10000 || !saltBuf.length || !expectedBuf.length) {
        return false;
      }
      const derived = await pbkdf2Async(pwd, saltBuf, iterations, expectedBuf.length);
      return derived.length === expectedBuf.length && crypto.timingSafeEqual(derived, expectedBuf);
    }
  } catch {
    return false;
  }

  return false;
}

function timingSafeStringEqual(a, b) {
  const bufA = Buffer.from(String(a || ""), "utf8");
  const bufB = Buffer.from(String(b || ""), "utf8");
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function base64UrlEncode(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input), "utf8");
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(str) {
  let b64 = String(str || "").replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  return Buffer.from(b64, "base64");
}

export function parseCookies(cookieHeader) {
  const out = {};
  if (!cookieHeader) return out;
  for (const part of String(cookieHeader).split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (!key) continue;
    try {
      out[key] = decodeURIComponent(val);
    } catch {
      out[key] = val;
    }
  }
  return out;
}

export function buildCookieString({ name, value, maxAgeSec = null, isHttps = false }) {
  const attrs = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax"
  ];
  if (maxAgeSec !== null) {
    attrs.push(`Max-Age=${Math.max(0, Math.floor(maxAgeSec))}`);
  }
  if (isHttps) {
    attrs.push("Secure");
  }
  return attrs.join("; ");
}

export class SingleAdminAuth {
  constructor(options = {}) {
    this.dataDir = options.dataDir || path.resolve(process.cwd(), "data");
    this.credFile = path.join(this.dataDir, "admin-credentials.json");
    this.env = options.env || process.env;

    this.overrideState = null; // { passwordHash, tokenVersion, updatedAt }
    this.revokedJtis = new Map(); // jti -> expMs
    this.failedAttempts = new Map(); // key -> { count, strikes, lockedUntil }
    this.ipRequestLog = new Map(); // ip -> [timestamps]
  }

  async loadCredentialState() {
    if (this.overrideState) return this.overrideState;
    try {
      const raw = await fs.readFile(this.credFile, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        this.overrideState = {
          passwordHash: parsed.passwordHash || null,
          tokenVersion: Number(parsed.tokenVersion || 1),
          updatedAt: parsed.updatedAt || null
        };
        return this.overrideState;
      }
    } catch {}
    this.overrideState = { passwordHash: null, tokenVersion: 1, updatedAt: null };
    return this.overrideState;
  }

  async saveCredentialState(nextState) {
    await fs.mkdir(this.dataDir, { recursive: true });
    const tmpFile = `${this.credFile}.tmp`;
    await fs.writeFile(tmpFile, JSON.stringify(nextState, null, 2), { mode: 0o600 });
    await fs.rename(tmpFile, this.credFile);
    this.overrideState = nextState;
  }

  getConfiguredEmail() {
    const raw = String(this.env.ADMIN_EMAIL || "").trim().toLowerCase();
    if (!raw || raw === "your_admin_email" || raw.startsWith("your_")) return "";
    return raw;
  }

  getSessionSecret() {
    const raw = String(this.env.SESSION_SECRET || "").trim();
    if (!raw || raw === "YOUR_RANDOM_SECRET" || raw.startsWith("YOUR_") || raw.length < 16) {
      return "";
    }
    return raw;
  }

  async getActivePasswordHash() {
    const cred = await this.loadCredentialState();
    if (cred.passwordHash) return cred.passwordHash;
    const envHash = String(this.env.ADMIN_PASSWORD_HASH || "").trim();
    if (!envHash || envHash === "YOUR_SECURE_PASSWORD_HASH" || envHash.startsWith("YOUR_")) {
      return "";
    }
    return envHash;
  }

  async isConfigured() {
    const email = this.getConfiguredEmail();
    const hash = await this.getActivePasswordHash();
    const secret = this.getSessionSecret();
    return {
      configured: Boolean(email && hash && secret),
      missing: [
        !email ? "ADMIN_EMAIL" : null,
        !hash ? "ADMIN_PASSWORD_HASH" : null,
        !secret ? "SESSION_SECRET" : null
      ].filter(Boolean)
    };
  }

  checkIpRateLimit(ip) {
    const now = Date.now();
    const list = (this.ipRequestLog.get(ip) || []).filter((ts) => now - ts < IP_WINDOW_MS);
    if (list.length >= IP_WINDOW_MAX_REQ) {
      const oldest = list[0];
      const retryAfterSec = Math.max(1, Math.ceil((IP_WINDOW_MS - (now - oldest)) / 1000));
      return { allowed: false, retryAfterSec };
    }
    list.push(now);
    this.ipRequestLog.set(ip, list);
    return { allowed: true, retryAfterSec: 0 };
  }

  getAttemptLockout(ip, email) {
    const now = Date.now();
    const keys = [`ip:${ip}`, email ? `email:${email}` : null].filter(Boolean);
    let maxWaitMs = 0;
    let minRemaining = MAX_FAILED_ATTEMPTS;

    for (const key of keys) {
      const st = this.failedAttempts.get(key);
      if (!st) continue;
      if (st.lockedUntil > now) {
        maxWaitMs = Math.max(maxWaitMs, st.lockedUntil - now);
        minRemaining = 0;
      } else {
        minRemaining = Math.min(minRemaining, Math.max(0, MAX_FAILED_ATTEMPTS - st.count));
      }
    }

    return {
      locked: maxWaitMs > 0,
      retryAfterSec: Math.ceil(maxWaitMs / 1000),
      attemptsLeft: minRemaining
    };
  }

  recordFailure(ip, email) {
    const now = Date.now();
    const keys = [`ip:${ip}`, email ? `email:${email}` : null].filter(Boolean);
    let minAttemptsLeft = MAX_FAILED_ATTEMPTS;
    let lockedSec = 0;

    for (const key of keys) {
      const prev = this.failedAttempts.get(key) || { count: 0, strikes: 0, lockedUntil: 0 };
      const nextCount = prev.count + 1;
      if (nextCount >= MAX_FAILED_ATTEMPTS) {
        const nextStrikes = prev.strikes + 1;
        const duration = Math.min(MAX_LOCKOUT_MS, BASE_LOCKOUT_MS * Math.pow(2, nextStrikes - 1));
        this.failedAttempts.set(key, {
          count: 0,
          strikes: nextStrikes,
          lockedUntil: now + duration
        });
        minAttemptsLeft = 0;
        lockedSec = Math.max(lockedSec, Math.ceil(duration / 1000));
      } else {
        this.failedAttempts.set(key, {
          count: nextCount,
          strikes: prev.strikes,
          lockedUntil: 0
        });
        minAttemptsLeft = Math.min(minAttemptsLeft, MAX_FAILED_ATTEMPTS - nextCount);
      }
    }

    return { attemptsLeft: minAttemptsLeft, lockedSec };
  }

  clearFailures(ip, email) {
    this.failedAttempts.delete(`ip:${ip}`);
    if (email) this.failedAttempts.delete(`email:${email}`);
  }

  pruneRevoked() {
    const now = Date.now();
    for (const [jti, exp] of this.revokedJtis.entries()) {
      if (exp <= now) this.revokedJtis.delete(jti);
    }
  }

  signToken(payload) {
    const secret = this.getSessionSecret();
    const payloadB64 = base64UrlEncode(JSON.stringify(payload));
    const sig = crypto.createHmac("sha256", secret).update(payloadB64).digest();
    return `${payloadB64}.${base64UrlEncode(sig)}`;
  }

  async verifyToken(token) {
    if (!token || typeof token !== "string") return null;
    const secret = this.getSessionSecret();
    const adminEmail = this.getConfiguredEmail();
    if (!secret || !adminEmail) return null;

    const dot = token.indexOf(".");
    if (dot <= 0) return null;

    const payloadB64 = token.slice(0, dot);
    const sigB64 = token.slice(dot + 1);
    const expectedSig = crypto.createHmac("sha256", secret).update(payloadB64).digest();
    let providedSig;
    try {
      providedSig = base64UrlDecode(sigB64);
    } catch {
      return null;
    }

    if (providedSig.length !== expectedSig.length || !crypto.timingSafeEqual(providedSig, expectedSig)) {
      return null;
    }

    let payload;
    try {
      payload = JSON.parse(base64UrlDecode(payloadB64).toString("utf8"));
    } catch {
      return null;
    }

    if (!payload || !payload.jti || !payload.exp || !payload.email) return null;
    if (Date.now() >= Number(payload.exp)) return null;
    if (!timingSafeStringEqual(payload.email, adminEmail)) return null;

    this.pruneRevoked();
    if (this.revokedJtis.has(payload.jti)) return null;

    const cred = await this.loadCredentialState();
    if (Number(payload.tv || 1) !== Number(cred.tokenVersion || 1)) {
      return null;
    }

    return payload;
  }

  async authenticate({ email, password, rememberMe = false, ip = "unknown" }) {
    const status = await this.isConfigured();
    if (!status.configured) {
      return {
        ok: false,
        status: 503,
        code: "SERVER_NOT_CONFIGURED",
        message: `Server admin authentication is not configured (${status.missing.join(", ")}).`
      };
    }

    const rate = this.checkIpRateLimit(ip);
    if (!rate.allowed) {
      return {
        ok: false,
        status: 429,
        code: "RATE_LIMITED",
        retryAfterSec: rate.retryAfterSec,
        message: `Too many login requests. Try again in ${rate.retryAfterSec}s.`
      };
    }

    const normalizedEmail = String(email || "").trim().toLowerCase();
    const lockout = this.getAttemptLockout(ip, normalizedEmail);
    if (lockout.locked) {
      return {
        ok: false,
        status: 429,
        code: "LOCKED_OUT",
        retryAfterSec: lockout.retryAfterSec,
        message: `Too many failed attempts. Locked for ${lockout.retryAfterSec}s.`
      };
    }

    const expectedEmail = this.getConfiguredEmail();
    const activeHash = await this.getActivePasswordHash();
    const emailMatches = timingSafeStringEqual(normalizedEmail, expectedEmail);

    // Always run scrypt check to avoid timing side-channel revealing whether email matched
    const passwordMatches = await verifyPassword(
      password,
      emailMatches ? activeHash : DUMMY_SCRYPT_HASH
    );

    if (!emailMatches || !passwordMatches) {
      const failInfo = this.recordFailure(ip, normalizedEmail);
      return {
        ok: false,
        status: failInfo.lockedSec ? 429 : 401,
        code: failInfo.lockedSec ? "LOCKED_OUT" : "INVALID_CREDENTIALS",
        attemptsLeft: failInfo.attemptsLeft,
        retryAfterSec: failInfo.lockedSec || 0,
        message: failInfo.lockedSec
          ? `Too many failed attempts. Temporarily locked for ${failInfo.lockedSec}s.`
          : "Invalid administrator email or password."
      };
    }

    this.clearFailures(ip, normalizedEmail);
    const cred = await this.loadCredentialState();
    const now = Date.now();
    const ttlMs = rememberMe ? REMEMBER_SESSION_MS : SHORT_SESSION_MS;
    const token = this.signToken({
      jti: crypto.randomUUID(),
      email: expectedEmail,
      role: "owner",
      tv: Number(cred.tokenVersion || 1),
      iat: now,
      exp: now + ttlMs
    });

    return {
      ok: true,
      token,
      maxAgeSec: rememberMe ? Math.floor(ttlMs / 1000) : null,
      expiresAt: now + ttlMs,
      email: expectedEmail
    };
  }

  async verifyRequestSession(req) {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[SESSION_COOKIE_NAME];
    if (!token) return null;
    return this.verifyToken(token);
  }

  revokeSession(sessionPayload) {
    if (sessionPayload?.jti && sessionPayload?.exp) {
      this.revokedJtis.set(sessionPayload.jti, Number(sessionPayload.exp));
    }
  }

  async changePassword({ currentPassword, newPassword }) {
    const status = await this.isConfigured();
    if (!status.configured) {
      return { ok: false, status: 503, message: "Server authentication is not configured." };
    }

    const activeHash = await this.getActivePasswordHash();
    const validCurrent = await verifyPassword(currentPassword, activeHash);
    if (!validCurrent) {
      return { ok: false, status: 401, message: "Current password is incorrect." };
    }

    const nextPwd = String(newPassword || "");
    if (nextPwd.length < 10) {
      return { ok: false, status: 400, message: "New password must be at least 10 characters long." };
    }
    if (nextPwd === String(currentPassword || "")) {
      return { ok: false, status: 400, message: "New password must differ from current password." };
    }

    const newHash = await hashPassword(nextPwd);
    const prev = await this.loadCredentialState();
    const nextTokenVersion = Number(prev.tokenVersion || 1) + 1;

    await this.saveCredentialState({
      passwordHash: newHash,
      tokenVersion: nextTokenVersion,
      updatedAt: new Date().toISOString()
    });

    // Clear all tracked in-memory revocations (tokenVersion bump invalidates all prior cookies)
    this.revokedJtis.clear();
    return { ok: true, tokenVersion: nextTokenVersion };
  }
}
