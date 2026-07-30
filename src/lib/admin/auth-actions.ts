"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { createSession, deleteSession } from "@/lib/auth/session";
import { checkLoginRate } from "@/lib/ratelimit";

/**
 * Admin login as a Server Action.
 *
 * Server Actions carry Next's built-in origin check, so a same-site strict
 * cookie plus this is a solid CSRF posture without hand-rolling tokens. The
 * action is still POSTed to /admin/login, which the proxy lets through
 * unauthenticated (it is the one admin path that must be reachable logged-out).
 */

// One bcrypt hash computed once, compared against when no user matches, so a
// missing account and a wrong password take the same time. Without this, a fast
// "no such user" response is a user-enumeration oracle.
const DUMMY_HASH = bcrypt.hashSync("no-such-user-timing-equalizer", 12);

// Same string for every failure — email wrong, password wrong, or rate-limited
// on the credential path — so nothing distinguishes "unknown email" from
// "known email, wrong password".
const GENERIC_ERROR = "Invalid email or password.";

export interface LoginState {
  error?: string;
}

function clientIp(headerList: Headers): string {
  // Prefer x-real-ip: on Vercel the platform sets it to the connecting client,
  // so unlike the LEFTMOST x-forwarded-for value it is not client-controllable
  // (a spoofed leftmost XFF could otherwise be rotated to evade the throttle).
  // Fall back to the LAST x-forwarded-for hop — the one the trusted proxy
  // appended — then to a constant so unknowns share one bucket.
  const realIp = headerList.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const parts = (headerList.get("x-forwarded-for") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.at(-1) ?? "unknown";
}

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  const ip = clientIp(await headers());
  if (!(await checkLoginRate(ip))) {
    return { error: "Too many attempts. Try again in a few minutes." };
  }

  await connectDB();
  const user = await User.findOne({ email })
    .select("+passwordHash")
    .lean<{ _id: unknown; email: string; passwordHash: string } | null>();

  // Always run one compare, against the real hash or the dummy, so timing does
  // not reveal whether the email exists.
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) {
    return { error: GENERIC_ERROR };
  }

  await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });
  await createSession({
    userId: String(user._id),
    email: user.email,
    role: "admin",
  });

  redirect("/admin");
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/admin/login");
}
