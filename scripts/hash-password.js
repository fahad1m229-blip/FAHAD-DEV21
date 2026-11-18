/**
 * FAHAD DEV — Secure Admin Password Hash & Session Secret Generator
 * Usage:
 *   npm run hash-password
 *   node scripts/hash-password.js "YourStrongPassword"
 */

import crypto from "node:crypto";
import readline from "node:readline";
import { hashPassword } from "../lib/auth.js";

function promptHidden(promptText) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const onData = (char) => {
      const s = String(char);
      if (s === "\n" || s === "\r" || s === "\u0004") {
        process.stdin.off("data", onData);
      } else {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(promptText + "*".repeat(rl.line.length));
      }
    };
    if (process.stdin.isTTY) {
      process.stdin.on("data", onData);
    }
    rl.question(promptText, (answer) => {
      rl.close();
      if (process.stdin.isTTY) process.stdout.write("\n");
      resolve(answer);
    });
  });
}

async function main() {
  let password = process.argv[2];
  if (!password) {
    password = await promptHidden("Enter Admin Password (min 10 chars recommended): ");
  }

  if (!password || password.length < 8) {
    console.error("Error: Password must be at least 8 characters long.");
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const sessionSecret = crypto.randomBytes(48).toString("hex");

  console.log("\n=== Configure these in Render Environment Variables ===");
  console.log(`ADMIN_PASSWORD_HASH=${passwordHash}`);
  console.log(`SESSION_SECRET=${sessionSecret}`);
  console.log("=======================================================\n");
}

main();
