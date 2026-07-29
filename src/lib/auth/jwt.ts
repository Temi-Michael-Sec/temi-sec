import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { getJwtSecret } from "@/lib/env";

/**
 * Session JWT sign/verify — the pure crypto half, with no cookie or request
 * dependency, so it is unit-testable and reusable.
 *
 * `getJwtSecret()` runs at module load: importing the auth subsystem with no
 * (or a too-short) secret throws immediately rather than silently signing with
 * a weak key — the fail-at-boot contract db.test.ts describes. Nothing public
 * imports this, so a missing secret disables the admin without downing the site.
 */
const encodedKey = new TextEncoder().encode(getJwtSecret());

const ALG = "HS256";
const EXPIRY = "12h";

/** Minimum, non-sensitive claims: no password hash, no PII beyond the email. */
export interface SessionPayload {
  userId: string;
  email: string;
  role: "admin";
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(encodedKey);
}

/** Verifies a token and returns its claims, or null if invalid/expired/tampered. */
export async function verifySession(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: [ALG],
    });
    if (
      typeof payload.userId === "string" &&
      typeof payload.email === "string" &&
      payload.role === "admin"
    ) {
      return { userId: payload.userId, email: payload.email, role: "admin" };
    }
    return null;
  } catch {
    // Any failure — bad signature, expiry, malformed — is just "no session".
    return null;
  }
}
