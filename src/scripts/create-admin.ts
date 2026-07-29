/**
 * Creates (or resets the password of) the admin user.
 *
 *   npm run create-admin
 *
 * Prompts for an email and password on the terminal, hashing the password with
 * bcrypt before it ever touches the database. Set ADMIN_EMAIL and ADMIN_PASSWORD
 * in the environment to run it non-interactively (handy for a one-shot setup),
 * otherwise it asks — with the password echo muted.
 *
 * Idempotent by email: run it again to rotate the password. Relative imports and
 * loadEnvConfig mirror seed.ts so it runs under `tsx` without path-alias setup.
 */

import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

loadEnvConfig(process.cwd());

import { connectDB } from "../lib/db";
import { User } from "../models/User";

const BCRYPT_COST = 12;
const MIN_PASSWORD_LENGTH = 12;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Control characters, by code point so no raw bytes appear in source.
const CTRL_C = 0x03; // ETX — abort
const CTRL_D = 0x04; // EOT — end of input
const BACKSPACE = 0x08; // BS
const NEWLINE = 0x0a; // LF
const RETURN = 0x0d; // CR
const DELETE = 0x7f; // DEL — the key most terminals send for Backspace

/** Reads a line from stdin. When `hidden`, keystrokes are not echoed. */
function prompt(query: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    process.stdout.write(query);
    stdin.resume();
    stdin.setEncoding("utf8");
    const raw = hidden && stdin.isTTY;
    if (raw) stdin.setRawMode(true);

    let input = "";
    const onData = (chunk: string) => {
      for (const ch of chunk) {
        const code = ch.charCodeAt(0);
        if (code === NEWLINE || code === RETURN || code === CTRL_D) {
          if (raw) stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener("data", onData);
          process.stdout.write("\n");
          resolve(input);
          return;
        }
        if (code === CTRL_C) {
          process.stdout.write("\n");
          process.exit(130);
        }
        if (code === BACKSPACE || code === DELETE) {
          input = input.slice(0, -1);
        } else if (code >= 0x20) {
          input += ch;
        }
      }
    };
    stdin.on("data", onData);
  });
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error(
      "\n  MONGODB_URI is not set. Add it to .env.local (see .env.example) and retry.\n",
    );
    process.exit(1);
  }

  const email = (process.env.ADMIN_EMAIL ?? (await prompt("Admin email: ")))
    .trim()
    .toLowerCase();
  if (!EMAIL_RE.test(email)) {
    console.error(`\n  "${email}" is not a valid email.\n`);
    process.exit(1);
  }

  let password: string;
  if (process.env.ADMIN_PASSWORD) {
    password = process.env.ADMIN_PASSWORD;
  } else {
    password = await prompt("Password (min 12 chars): ", true);
    const confirm = await prompt("Confirm password: ", true);
    if (password !== confirm) {
      console.error("\n  Passwords did not match.\n");
      process.exit(1);
    }
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(
      `\n  Password must be at least ${MIN_PASSWORD_LENGTH} characters.\n`,
    );
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  await connectDB();
  const existing = await User.findOne({ email }).lean();
  await User.findOneAndUpdate(
    { email },
    { $set: { passwordHash, role: "admin" } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  console.log(
    `\n  ${existing ? "Password reset for" : "Created admin"} ${email}.\n`,
  );
  await mongoose.connection.close();
  process.exit(0);
}

main().catch(async (err) => {
  console.error("\ncreate-admin failed:\n", err);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
