import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { readSession, type SessionPayload } from "./session";

/**
 * The authorization boundary. Every admin page, Server Action and Route Handler
 * routes through here — the proxy gate is only an optimistic pre-filter (see
 * proxy.ts), never trusted on its own.
 *
 * Two tiers, per the Next auth guidance:
 *   1. Verify the signed cookie (cheap, no DB).
 *   2. Confirm the user still exists and is still an admin (secure, hits the DB)
 *      — so deleting or demoting the user invalidates live sessions, and a
 *      forged-but-somehow-valid token for a nonexistent user is rejected.
 *
 * `cache()` memoizes the result for one request, so a page plus its Server
 * Components share a single verification and DB read.
 */
export const getAdmin = cache(async (): Promise<SessionPayload | null> => {
  const session = await readSession();
  if (!session || session.role !== "admin") return null;

  await connectDB();
  const user = await User.findById(session.userId).select("_id role").lean();
  if (!user || user.role !== "admin") return null;

  return session;
});

/**
 * Returns the admin session or redirects to the login page. For pages and
 * Server Actions — anything that renders or acts on behalf of the admin.
 */
export async function requireAdmin(): Promise<SessionPayload> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
