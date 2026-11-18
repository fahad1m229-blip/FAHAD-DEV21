/**
 * FAHAD DEV — Production Node.js Server
 * Serves public User Panel, protected /FAHAD/admin routes, Public APIs,
 * and Single-Admin HTTP-Only Session Protected APIs.
 */

import fs from "node:fs";
import fsp from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  SESSION_COOKIE_NAME,
  SingleAdminAuth,
  buildCookieString
} from "./lib/auth.js";
import { SiteDataStore } from "./lib/store.js";

const ROOT_DIR = process.cwd();
const ASSETS_DIR = path.resolve(ROOT_DIR, "assets");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8"
};

const EXACT_PUBLIC_FILES = new Map([
  ["/", "index.html"],
  ["/index.html", "index.html"],
  ["/manifest.json", "manifest.json"],
  ["/service-worker.js", "service-worker.js"],
  ["/offline.html", "offline.html"],
  ["/404.html", "404.html"],
  ["/FAHAD", "FAHAD/index.html"],
  ["/FAHAD/", "FAHAD/index.html"],
  ["/FAHAD/index.html", "FAHAD/index.html"],
  ["/admin", "admin/index.html"],
  ["/admin/", "admin/index.html"],
  ["/admin/index.html", "admin/index.html"]
]);

export function loadLocalEnvIfPresent(envPath = path.resolve(ROOT_DIR, ".env")) {
  try {
    if (!fs.existsSync(envPath)) return;
    const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (key && !(key in process.env)) {
        process.env[key] = val;
      }
    }
  } catch {}
}

function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.trim()) {
    return xff.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

function isHttpsRequest(req) {
  const proto = req.headers["x-forwarded-proto"];
  if (typeof proto === "string") {
    return proto.split(",")[0].trim().toLowerCase() === "https";
  }
  return Boolean(req.socket?.encrypted);
}

function validateHttpUrl(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  try {
    const parsed = new URL(s);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

function readJsonBody(req, maxBytes = 256 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        const err = new Error("Payload too large");
        err.status = 413;
        reject(err);
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (!chunks.length) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        const err = new Error("Invalid JSON body");
        err.status = 400;
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function setSecurityHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "no-referrer");
}

function sendJson(res, status, data, extraHeaders = {}) {
  setSecurityHeaders(res);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...extraHeaders
  });
  res.end(JSON.stringify(data));
}

async function sendFile(res, absPath, { noStore = false } = {}) {
  try {
    const stat = await fsp.stat(absPath);
    if (!stat.isFile()) {
      sendNotFound(res);
      return;
    }
    const ext = path.extname(absPath).toLowerCase();
    const mime = MIME_TYPES[ext] || "application/octet-stream";
    setSecurityHeaders(res);
    const headers = { "Content-Type": mime };
    if (noStore || ext === ".html" || path.basename(absPath) === "service-worker.js") {
      headers["Cache-Control"] = "no-store";
    } else {
      headers["Cache-Control"] = "public, max-age=300";
    }
    res.writeHead(200, headers);
    fs.createReadStream(absPath).pipe(res);
  } catch {
    sendNotFound(res);
  }
}

function sendNotFound(res) {
  setSecurityHeaders(res);
  const notFoundHtml = path.join(ROOT_DIR, "404.html");
  if (fs.existsSync(notFoundHtml)) {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    fs.createReadStream(notFoundHtml).pipe(res);
  } else {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not Found");
  }
}

export function createAppServer({ auth = new SingleAdminAuth(), store = new SiteDataStore() } = {}) {
  return http.createServer(async (req, res) => {
    try {
      const urlObj = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
      const pathname = decodeURIComponent(urlObj.pathname);
      const method = (req.method || "GET").toUpperCase();

      // -----------------------------------------------------------------------
      // Health Check (for Render)
      // -----------------------------------------------------------------------
      if (pathname === "/api/health" && method === "GET") {
        const cfg = await auth.isConfigured();
        const diag = cfg.diagnostics;
        sendJson(res, 200, {
          ok: true,
          nodeEnv: diag.nodeEnv,
          authConfigured: cfg.configured,
          emailValid: diag.email.validFormat,
          hashFormatValid: diag.passwordHash.validFormat,
          hashSource: diag.passwordHash.source,
          hashFingerprint: diag.passwordHash.fingerprint,
          sessionSecretValid: diag.sessionSecret.validFormat
        });
        return;
      }

      // -----------------------------------------------------------------------
      // Public User Panel APIs (No auth required)
      // -----------------------------------------------------------------------
      if (pathname === "/api/public/bootstrap" && method === "GET") {
        const data = await store.getPublicBootstrap();
        sendJson(res, 200, data);
        return;
      }

      const pubVerMatch = pathname.match(/^\/api\/public\/categories\/([^/]+)\/versions$/);
      if (pubVerMatch && method === "GET") {
        const versions = await store.getPublicVersions(pubVerMatch[1]);
        sendJson(res, 200, { versions });
        return;
      }

      const pubLinksMatch = pathname.match(/^\/api\/public\/categories\/([^/]+)\/versions\/([^/]+)\/links$/);
      if (pubLinksMatch && method === "GET") {
        const links = await store.getPublicLinks(pubLinksMatch[1], pubLinksMatch[2]);
        sendJson(res, 200, { links });
        return;
      }

      if (pathname === "/api/public/analytics" && method === "POST") {
        const body = await readJsonBody(req);
        const allowedTypes = new Set(["download_click", "view_category", "view_version", "share_click"]);
        if (!allowedTypes.has(body?.type) || !body?.categoryId) {
          sendJson(res, 400, { ok: false, message: "Invalid analytics payload." });
          return;
        }
        await store.recordPublicAnalytics({
          type: body.type,
          categoryId: String(body.categoryId).slice(0, 80),
          versionId: body.versionId ? String(body.versionId).slice(0, 80) : null
        });
        sendJson(res, 200, { ok: true });
        return;
      }

      // -----------------------------------------------------------------------
      // Admin Authentication APIs
      // -----------------------------------------------------------------------
      if (pathname === "/api/admin/auth/session" && method === "GET") {
        const cfg = await auth.isConfigured();
        const session = await auth.verifyRequestSession(req);
        if (!session) {
          sendJson(res, 200, {
            configured: cfg.configured,
            missing: cfg.missing,
            authenticated: false
          });
          return;
        }
        const profile = await store.getAdminProfile(session.email);
        sendJson(res, 200, {
          configured: cfg.configured,
          authenticated: true,
          adminProfile: profile
        });
        return;
      }

      if (pathname === "/api/admin/auth/login" && method === "POST") {
        const body = await readJsonBody(req);
        const ip = getClientIp(req);
        const result = await auth.authenticate({
          email: body?.email,
          password: body?.password,
          rememberMe: Boolean(body?.rememberMe),
          ip
        });

        if (!result.ok) {
          const extra = result.retryAfterSec ? { "Retry-After": String(result.retryAfterSec) } : {};
          sendJson(res, result.status, {
            ok: false,
            code: result.code,
            message: result.message,
            attemptsLeft: result.attemptsLeft,
            retryAfterSec: result.retryAfterSec
          }, extra);
          return;
        }

        const profile = await store.getAdminProfile(result.email);
        store.addLog(result.email, "ADMIN_LOGIN", {}, { ip: ip.slice(0, 45) });
        await store.persist();

        const cookie = buildCookieString({
          name: SESSION_COOKIE_NAME,
          value: result.token,
          maxAgeSec: result.maxAgeSec,
          isHttps: isHttpsRequest(req)
        });
        sendJson(res, 200, {
          ok: true,
          adminProfile: profile
        }, {
          "Set-Cookie": cookie
        });
        return;
      }

      if (pathname === "/api/admin/auth/logout" && method === "POST") {
        const session = await auth.verifyRequestSession(req);
        if (session) {
          auth.revokeSession(session);
        }
        const clearCookie = buildCookieString({
          name: SESSION_COOKIE_NAME,
          value: "",
          maxAgeSec: 0,
          isHttps: isHttpsRequest(req)
        });
        sendJson(res, 200, { ok: true }, { "Set-Cookie": clearCookie });
        return;
      }

      if (pathname === "/api/admin/auth/change-password" && method === "POST") {
        const session = await auth.verifyRequestSession(req);
        if (!session) {
          sendJson(res, 401, { ok: false, message: "Authentication required." });
          return;
        }
        const body = await readJsonBody(req);
        const result = await auth.changePassword({
          currentPassword: body?.currentPassword,
          newPassword: body?.newPassword
        });

        if (!result.ok) {
          sendJson(res, result.status, { ok: false, message: result.message });
          return;
        }

        store.addLog(session.email, "ADMIN_PASSWORD_CHANGED", {}, { sessionsInvalidated: true });
        await store.persist();

        const clearCookie = buildCookieString({
          name: SESSION_COOKIE_NAME,
          value: "",
          maxAgeSec: 0,
          isHttps: isHttpsRequest(req)
        });
        sendJson(res, 200, {
          ok: true,
          sessionsInvalidated: true,
          message: "Password updated. All active sessions have been invalidated; please sign in again."
        }, { "Set-Cookie": clearCookie });
        return;
      }

      // -----------------------------------------------------------------------
      // Protected Admin Data & Management APIs (Strict Server Auth Gate)
      // -----------------------------------------------------------------------
      if (pathname.startsWith("/api/admin/")) {
        const session = await auth.verifyRequestSession(req);
        if (!session) {
          sendJson(res, 401, { ok: false, message: "Unauthorized: Admin session required." });
          return;
        }

        if (pathname === "/api/admin/overview" && method === "GET") {
          const overview = await store.getOverview();
          sendJson(res, 200, overview);
          return;
        }

        if (pathname === "/api/admin/users" && method === "GET") {
          const users = await store.getUsers();
          sendJson(res, 200, { users });
          return;
        }

        const userMatch = pathname.match(/^\/api\/admin\/users\/([^/]+)$/);
        if (userMatch && method === "PATCH") {
          const body = await readJsonBody(req);
          const updated = await store.toggleUserStatus(userMatch[1], Boolean(body?.active), session.email);
          if (!updated) {
            sendJson(res, 404, { ok: false, message: "User not found." });
            return;
          }
          sendJson(res, 200, { ok: true, user: updated });
          return;
        }

        if (pathname === "/api/admin/profile" && method === "GET") {
          const profile = await store.getAdminProfile(session.email);
          sendJson(res, 200, { profile });
          return;
        }

        if (pathname === "/api/admin/profile" && method === "PUT") {
          const body = await readJsonBody(req);
          const avatarUrl = body?.avatar ? validateHttpUrl(body.avatar) : "";
          if (body?.avatar && avatarUrl === null) {
            sendJson(res, 400, { ok: false, message: "Invalid avatar URL." });
            return;
          }
          const profile = await store.updateAdminProfile(session.email, {
            name: body?.name,
            avatar: avatarUrl
          });
          sendJson(res, 200, { ok: true, profile });
          return;
        }

        if (pathname === "/api/admin/categories" && method === "GET") {
          const categories = await store.getCategories();
          sendJson(res, 200, { categories });
          return;
        }

        if (pathname === "/api/admin/categories" && method === "POST") {
          const body = await readJsonBody(req);
          const cat = await store.upsertCategory(body, session.email);
          sendJson(res, 200, { ok: true, category: cat });
          return;
        }

        const catDelMatch = pathname.match(/^\/api\/admin\/categories\/([^/]+)$/);
        if (catDelMatch && method === "DELETE") {
          const ok = await store.deleteCategory(catDelMatch[1], session.email);
          sendJson(res, ok ? 200 : 404, { ok });
          return;
        }

        const catVerMatch = pathname.match(/^\/api\/admin\/categories\/([^/]+)\/versions$/);
        if (catVerMatch && method === "GET") {
          const versions = await store.getCategoryVersions(catVerMatch[1]);
          if (!versions) {
            sendJson(res, 404, { ok: false, message: "Category not found." });
            return;
          }
          sendJson(res, 200, { versions });
          return;
        }

        if (catVerMatch && method === "POST") {
          const body = await readJsonBody(req);
          const safeDl = body?.downloadUrl ? validateHttpUrl(body.downloadUrl) : "";
          const safeYt = body?.youtubeUrl ? validateHttpUrl(body.youtubeUrl) : "";
          if ((body?.downloadUrl && safeDl === null) || (body?.youtubeUrl && safeYt === null)) {
            sendJson(res, 400, { ok: false, message: "Provide valid HTTP/HTTPS URLs." });
            return;
          }
          const ver = await store.upsertVersion(
            catVerMatch[1],
            { ...body, downloadUrl: safeDl, youtubeUrl: safeYt },
            session.email
          );
          if (!ver) {
            sendJson(res, 404, { ok: false, message: "Category not found." });
            return;
          }
          sendJson(res, 200, { ok: true, version: ver });
          return;
        }

        const verDelMatch = pathname.match(/^\/api\/admin\/categories\/([^/]+)\/versions\/([^/]+)$/);
        if (verDelMatch && method === "DELETE") {
          const ok = await store.deleteVersion(verDelMatch[1], verDelMatch[2], session.email);
          sendJson(res, ok ? 200 : 404, { ok });
          return;
        }

        if (pathname === "/api/admin/settings" && method === "GET") {
          const settings = await store.getSiteSettings();
          sendJson(res, 200, { settings });
          return;
        }

        if (pathname === "/api/admin/settings" && method === "PUT") {
          const body = await readJsonBody(req);
          for (const field of ["logo", "favicon"]) {
            const val = String(body?.[field] || "").trim();
            if (val && !val.startsWith("./") && !val.startsWith("../") && validateHttpUrl(val) === null) {
              sendJson(res, 400, { ok: false, message: `Invalid URL for ${field}.` });
              return;
            }
          }
          const settings = await store.updateSiteSettings(body || {}, session.email);
          sendJson(res, 200, { ok: true, settings });
          return;
        }

        sendJson(res, 404, { ok: false, message: "Admin API endpoint not found." });
        return;
      }

      // -----------------------------------------------------------------------
      // Protected Hidden Admin Routes (/FAHAD/admin & /FAHAD/admin/*)
      // -----------------------------------------------------------------------
      if (pathname === "/FAHAD/admin" || pathname === "/FAHAD/admin/" || pathname === "/FAHAD/admin/index.html") {
        await sendFile(res, path.join(ROOT_DIR, "FAHAD", "admin", "index.html"), { noStore: true });
        return;
      }

      if (pathname.startsWith("/FAHAD/admin/")) {
        const session = await auth.verifyRequestSession(req);
        if (!session) {
          setSecurityHeaders(res);
          res.writeHead(302, {
            Location: "/FAHAD/admin/",
            "Cache-Control": "no-store"
          });
          res.end();
          return;
        }
        await sendFile(res, path.join(ROOT_DIR, "FAHAD", "admin", "index.html"), { noStore: true });
        return;
      }

      // -----------------------------------------------------------------------
      // Strict Static File Serving Allowlist (Blocks .env, data/, lib/, server.js)
      // -----------------------------------------------------------------------
      if (method !== "GET" && method !== "HEAD") {
        sendNotFound(res);
        return;
      }

      const exactRel = EXACT_PUBLIC_FILES.get(pathname);
      if (exactRel) {
        await sendFile(res, path.join(ROOT_DIR, exactRel));
        return;
      }

      if (pathname.startsWith("/assets/")) {
        const relAsset = pathname.slice("/assets/".length);
        const resolved = path.resolve(ASSETS_DIR, relAsset);
        if (
          resolved.startsWith(ASSETS_DIR + path.sep) &&
          !path.basename(resolved).startsWith(".")
        ) {
          await sendFile(res, resolved);
          return;
        }
      }

      sendNotFound(res);
    } catch (err) {
      const status = Number(err?.status || 500);
      console.error("[Server] Request error:", {
        status,
        message: err?.message || "Internal error"
      });
      if (!res.headersSent) {
        sendJson(res, status, { ok: false, message: status >= 500 ? "Internal server error." : err.message });
      } else {
        res.end();
      }
    }
  });
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  loadLocalEnvIfPresent();
  const auth = new SingleAdminAuth();
  const store = new SiteDataStore();
  await store.init();
  const cfgStatus = await auth.isConfigured();
  console.info("[FAHAD DEV] Auth env check:", cfgStatus.diagnostics);
  if (!cfgStatus.configured) {
    console.warn("[FAHAD DEV] Warning: Missing or invalid server admin env vars:", cfgStatus.missing.join(", "));
  }
  const port = Number(process.env.PORT || 3000);
  const server = createAppServer({ auth, store });
  server.listen(port, "0.0.0.0", () => {
    console.info(`[FAHAD DEV] Server listening on port ${port}`);
  });
}
