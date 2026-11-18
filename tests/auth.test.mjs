import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";

import { SingleAdminAuth, hashPassword, verifyPassword } from "../lib/auth.js";
import { SiteDataStore } from "../lib/store.js";
import { createAppServer } from "../server.js";

describe("FAHAD DEV Single-Admin Authentication & Security Suite", () => {
  let tmpDir;
  let server;
  let baseUrl;
  let auth;
  let store;

  const TEST_EMAIL = "owner@test.local";
  const INITIAL_PASSWORD = "Initial-Strong-Password-2026!";
  const ROTATED_PASSWORD = "Rotated-Even-Stronger-2026!";
  const TEST_SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef";

  function extractCookie(res) {
    const raw = res.headers.get("set-cookie");
    if (!raw) return "";
    return raw.split(";")[0];
  }

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "fahad-dev-test-"));
    const initialHash = await hashPassword(INITIAL_PASSWORD);

    auth = new SingleAdminAuth({
      dataDir: tmpDir,
      env: {
        ADMIN_EMAIL: TEST_EMAIL,
        ADMIN_PASSWORD_HASH: initialHash,
        SESSION_SECRET: TEST_SECRET
      }
    });
    store = new SiteDataStore({ dataDir: tmpDir });
    await store.init();

    server = createAppServer({ auth, store });
    await new Promise((resolve) => {
      server.listen(0, "127.0.0.1", resolve);
    });
    const addr = server.address();
    baseUrl = `http://127.0.0.1:${addr.port}`;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("hashes and verifies passwords with scrypt securely without trimming", async () => {
    const hash = await hashPassword("MyTestSecret99!");
    assert.ok(hash.startsWith("scrypt$"));
    assert.equal(await verifyPassword("MyTestSecret99!", hash), true);
    assert.equal(await verifyPassword("WrongPassword", hash), false);

    const spacedPass = "  My Spaced Pass 2026!  ";
    const spacedHash = await hashPassword(spacedPass);
    assert.equal(await verifyPassword(spacedPass, spacedHash), true);
    assert.equal(await verifyPassword(spacedPass.trim(), spacedHash), false);
  });

  it("keeps public User Panel and public APIs accessible without authentication", async () => {
    const homeRes = await fetch(`${baseUrl}/`);
    assert.equal(homeRes.status, 200);
    const html = await homeRes.text();
    assert.match(html, /FAHAD DEV/);

    const bootRes = await fetch(`${baseUrl}/api/public/bootstrap`);
    assert.equal(bootRes.status, 200);
    const boot = await bootRes.json();
    assert.ok(Array.isArray(boot.categories));
    assert.ok(boot.categories.length >= 7);
  });

  it("protects admin APIs and sub-routes from unauthenticated requests", async () => {
    const overviewRes = await fetch(`${baseUrl}/api/admin/overview`);
    assert.equal(overviewRes.status, 401);

    const settingsRes = await fetch(`${baseUrl}/api/admin/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteName: "HACKED" })
    });
    assert.equal(settingsRes.status, 401);

    const subRouteRes = await fetch(`${baseUrl}/FAHAD/admin/overview`, { redirect: "manual" });
    assert.equal(subRouteRes.status, 302);
    assert.equal(subRouteRes.headers.get("location"), "/FAHAD/admin/");
  });

  it("blocks access to private server files and config artifacts", async () => {
    for (const privatePath of ["/server.js", "/package.json", "/.env", "/.env.example", "/lib/auth.js", "/data/site-data.json"]) {
      const res = await fetch(`${baseUrl}${privatePath}`);
      assert.equal(res.status, 404, `Expected 404 for ${privatePath}`);
    }
  });

  it("rejects unauthorized email addresses and invalid passwords", async () => {
    const wrongEmailRes = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Forwarded-For": "198.51.100.10" },
      body: JSON.stringify({ email: "intruder@example.com", password: INITIAL_PASSWORD })
    });
    assert.equal(wrongEmailRes.status, 401);

    const wrongPassRes = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Forwarded-For": "198.51.100.11" },
      body: JSON.stringify({ email: TEST_EMAIL, password: "wrong-password" })
    });
    assert.equal(wrongPassRes.status, 401);
  });

  it("authenticates the single admin, protects HttpOnly session cookie, and updates settings", async () => {
    const loginRes = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Forwarded-For": "203.0.113.5" },
      body: JSON.stringify({ email: TEST_EMAIL, password: INITIAL_PASSWORD, rememberMe: true })
    });
    assert.equal(loginRes.status, 200);
    const setCookieHeader = loginRes.headers.get("set-cookie") || "";
    assert.match(setCookieHeader, /HttpOnly/i);
    assert.match(setCookieHeader, /SameSite=Lax/i);

    const cookie = extractCookie(loginRes);
    assert.ok(cookie.startsWith("fahad_admin_session="));

    const overviewRes = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: { Cookie: cookie }
    });
    assert.equal(overviewRes.status, 200);
    const overview = await overviewRes.json();
    assert.equal(overview.totalAdmins, 1);

    const putRes = await fetch(`${baseUrl}/api/admin/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ siteName: "FAHAD DEV PRO", maintenance: false, animations: true, verifiedBadge: true })
    });
    assert.equal(putRes.status, 200);
    const putData = await putRes.json();
    assert.equal(putData.settings.siteName, "FAHAD DEV PRO");

    // Verify public panel reflects updated settings
    const bootRes = await fetch(`${baseUrl}/api/public/bootstrap`);
    const boot = await bootRes.json();
    assert.equal(boot.publicSettings.siteName, "FAHAD DEV PRO");

    // Verify logout revokes the session token immediately
    const logoutRes = await fetch(`${baseUrl}/api/admin/auth/logout`, {
      method: "POST",
      headers: { Cookie: cookie }
    });
    assert.equal(logoutRes.status, 200);

    const postLogoutOverview = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: { Cookie: cookie }
    });
    assert.equal(postLogoutOverview.status, 401);
  });

  it("validates current password on password change and invalidates ALL existing sessions", async () => {
    // Sign in twice to create two separate active sessions
    const loginA = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Forwarded-For": "203.0.113.50" },
      body: JSON.stringify({ email: TEST_EMAIL, password: INITIAL_PASSWORD })
    });
    const cookieA = extractCookie(loginA);

    const loginB = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Forwarded-For": "203.0.113.51" },
      body: JSON.stringify({ email: TEST_EMAIL, password: INITIAL_PASSWORD })
    });
    const cookieB = extractCookie(loginB);

    // Reject incorrect current password
    const badChange = await fetch(`${baseUrl}/api/admin/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({ currentPassword: "wrong-current-password", newPassword: ROTATED_PASSWORD })
    });
    assert.equal(badChange.status, 401);

    // Succeed with correct current password
    const goodChange = await fetch(`${baseUrl}/api/admin/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({ currentPassword: INITIAL_PASSWORD, newPassword: ROTATED_PASSWORD })
    });
    assert.equal(goodChange.status, 200);
    const changePayload = await goodChange.json();
    assert.equal(changePayload.sessionsInvalidated, true);

    // Both session A and session B must now be invalidated!
    const checkA = await fetch(`${baseUrl}/api/admin/overview`, { headers: { Cookie: cookieA } });
    const checkB = await fetch(`${baseUrl}/api/admin/overview`, { headers: { Cookie: cookieB } });
    assert.equal(checkA.status, 401);
    assert.equal(checkB.status, 401);

    // Old password no longer works
    const oldLogin = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Forwarded-For": "203.0.113.52" },
      body: JSON.stringify({ email: TEST_EMAIL, password: INITIAL_PASSWORD })
    });
    assert.equal(oldLogin.status, 401);

    // New password works cleanly
    const newLogin = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Forwarded-For": "203.0.113.53" },
      body: JSON.stringify({ email: TEST_EMAIL, password: ROTATED_PASSWORD })
    });
    assert.equal(newLogin.status, 200);
  });

  it("enforces brute-force lockout (429 + Retry-After) after repeated failures", async () => {
    for (let i = 0; i < 4; i++) {
      const res = await fetch(`${baseUrl}/api/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Forwarded-For": "198.51.100.25" },
        body: JSON.stringify({ email: "brute@test.local", password: "wrong-password" })
      });
      assert.equal(res.status, 401);
    }

    const lockoutRes = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Forwarded-For": "198.51.100.25" },
      body: JSON.stringify({ email: "brute@test.local", password: "wrong-password" })
    });
    assert.equal(lockoutRes.status, 429);
    assert.ok(Number(lockoutRes.headers.get("retry-after")) > 0);
  });

  it("verifies CLI hash-password output against original password & handles Termux/Render copy-paste artifacts", async () => {
    const { execFile } = await import("node:child_process");
    const { promisify } = await import("node:util");
    const execFileAsync = promisify(execFile);

    const samplePass = "Termux$Admin#2026!";
    const { stdout } = await execFileAsync(process.execPath, ["scripts/hash-password.js", samplePass]);

    const hashMatch = stdout.match(/^ADMIN_PASSWORD_HASH=(.+)$/m);
    const secretMatch = stdout.match(/^SESSION_SECRET=(.+)$/m);
    assert.ok(hashMatch, "Expected ADMIN_PASSWORD_HASH output line");
    assert.ok(secretMatch, "Expected SESSION_SECRET output line");

    const generatedHash = hashMatch[1].trim();
    const generatedSecret = secretMatch[1].trim();

    assert.equal(await verifyPassword(samplePass, generatedHash), true);

    // Simulate Termux wrapped newlines + quotes + accidental KEY= prefix pasted into Render
    const wrappedTermuxHash = `"ADMIN_PASSWORD_HASH=${generatedHash.slice(0, 40)}\n ${generatedHash.slice(40)}"`;
    const quotedEmail = ' "BgFahad0@gmail.com" ';
    const wrappedSecret = `'SESSION_SECRET=${generatedSecret.slice(0, 32)}\n${generatedSecret.slice(32)}'`;

    const termuxAuth = new SingleAdminAuth({
      dataDir: tmpDir,
      env: {
        NODE_ENV: "production",
        ADMIN_EMAIL: quotedEmail,
        ADMIN_PASSWORD_HASH: wrappedTermuxHash,
        SESSION_SECRET: wrappedSecret
      }
    });

    const cfg = await termuxAuth.isConfigured();
    assert.equal(cfg.configured, true);
    assert.equal(cfg.diagnostics.passwordHash.validFormat, true);
    assert.equal(cfg.diagnostics.passwordHash.saltBytes, 16);
    assert.equal(cfg.diagnostics.passwordHash.hashBytes, 64);

    // Ensure diagnostics never leak raw credentials
    const diagText = JSON.stringify(cfg.diagnostics);
    assert.equal(diagText.includes(samplePass), false);
    assert.equal(diagText.includes(generatedHash), false);
    assert.equal(diagText.includes(generatedSecret), false);

    // Authorized Gmail authenticates cleanly; unauthorized emails are rejected
    const okLogin = await termuxAuth.authenticate({
      email: "bgfahad0@gmail.com",
      password: samplePass,
      ip: "203.0.113.99"
    });
    assert.equal(okLogin.ok, true);

    const badEmailLogin = await termuxAuth.authenticate({
      email: "someone.else@gmail.com",
      password: samplePass,
      ip: "203.0.113.100"
    });
    assert.equal(badEmailLogin.ok, false);
    assert.equal(badEmailLogin.status, 401);
  });
});
