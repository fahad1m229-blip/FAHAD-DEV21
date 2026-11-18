/**
 * FAHAD DEV — Termux-Safe Admin Password Hash & Session Secret Generator
 * Usage:
 *   npm run hash-password
 *   node scripts/hash-password.js "YourStrongPassword"
 *   node scripts/hash-password.js --verify "YourStrongPassword" "scrypt$..."
 */

import crypto from "node:crypto";
import readline from "node:readline";
import { Writable } from "node:stream";
import { hashPassword, normalizeStoredHash, verifyPassword } from "../lib/auth.js";

function promptHidden(promptText) {
  return new Promise((resolve) => {
    let muted = false;
    const mutableStdout = new Writable({
      write(chunk, encoding, callback) {
        if (!muted) {
          process.stdout.write(chunk, encoding);
        }
        callback();
      }
    });

    const isTty = Boolean(process.stdin.isTTY);
    const rl = readline.createInterface({
      input: process.stdin,
      output: mutableStdout,
      terminal: isTty
    });

    process.stdout.write(promptText);
    if (isTty) {
      muted = true;
    }

    rl.question("", (answer) => {
      muted = false;
      rl.close();
      if (isTty) process.stdout.write("\n");
      resolve(answer);
    });
  });
}

async function runVerifyMode(pwdArg, hashArg) {
  const password = pwdArg || (await promptHidden("Enter Admin Password to verify: "));
  const rawHash = hashArg || (await promptHidden("Paste ADMIN_PASSWORD_HASH (scrypt$...): "));
  const normalized = normalizeStoredHash(rawHash);
  const ok = await verifyPassword(password, normalized);
  console.log(ok ? "VERIFY_OK: Password matches the provided scrypt hash." : "VERIFY_FAILED: Password does NOT match the provided hash.");
  process.exit(ok ? 0 : 1);
}

async function main() {
  if (process.argv[2] === "--verify") {
    await runVerifyMode(process.argv[3], process.argv[4]);
    return;
  }

  let password = process.argv[2];
  if (!password) {
    password = await promptHidden("Enter Admin Password (min 8 chars, 10+ recommended): ");
    if (process.stdin.isTTY) {
      const confirm = await promptHidden("Confirm Admin Password: ");
      if (password !== confirm) {
        console.error("Error: Passwords did not match. Please try again.");
        process.exit(1);
      }
    }
  }

  if (!password || password.length < 8) {
    console.error("Error: Password must be at least 8 characters long.");
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const selfCheck = await verifyPassword(password, passwordHash);
  if (!selfCheck) {
    console.error("Error: Internal hash self-verification failed.");
    process.exit(1);
  }

  const hashFingerprint = crypto.createHash("sha256").update(passwordHash).digest("hex").slice(0, 8);
  const sessionSecret = crypto.randomBytes(48).toString("hex");
  const hasEdgeSpaces = password !== password.trim();

  console.log("\n=== Render Environment Variables (Paste VALUES only, no quotes) ===");
  console.log(`ADMIN_PASSWORD_HASH=${passwordHash}`);
  console.log(`SESSION_SECRET=${sessionSecret}`);
  console.log(`Self-verification: PASSED (${password.length} chars, scrypt 16B salt / 64B key)`);
  console.log(`Hash Fingerprint (check /api/health after deploy): ${hashFingerprint}`);
  if (hasEdgeSpaces) {
    console.warn("WARNING: Leading or trailing space detected in password input (check Termux keyboard).");
  }
  console.log("Note: In Render dashboard, put ONLY 'scrypt$...' in the Value box");
  console.log("      (without quotes or extra spaces/newlines from line wrapping).");
  console.log("====================================================================\n");
}

main();
