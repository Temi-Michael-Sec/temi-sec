import "server-only";
import { cookies } from "next/headers";
import { isProduction } from "@/lib/env";
import { SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from "./cookie";
import { signSession, verifySession, type SessionPayload } from "./jwt";

/**
 * Session cookie I/O. The signing/verification lives in jwt.ts; this is the
 * request-bound half that reads and writes the httpOnly cookie.
 */

export type { SessionPayload } from "./jwt";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict" as const,
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};

/** Signs a fresh token for `payload` and writes the session cookie. */
export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await signSession(payload);
  (await cookies()).set(SESSION_COOKIE_NAME, token, cookieOptions);
}

/** Reads and verifies the session cookie. */
export async function readSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  return verifySession(token);
}

/**
 * Clears the session cookie (logout).
 *
 * NOT `cookies().delete(name)`: that emits a bare `name=; Path=/; Expires=…`
 * with no `Secure`, and browsers reject ANY Set-Cookie for a `__Host-` name that
 * lacks Secure — so in production the delete would be silently dropped and the
 * session would survive logout. Expiring it with the same attributes it was set
 * with is the only form the browser will accept.
 */
export async function deleteSession(): Promise<void> {
  (await cookies()).set(SESSION_COOKIE_NAME, "", {
    ...cookieOptions,
    maxAge: 0,
    expires: new Date(0),
  });
}
