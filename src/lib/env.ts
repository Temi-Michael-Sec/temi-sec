/**
 * Typed environment access.
 *
 * Two contrasting contracts live here, both deliberate:
 *
 *   - `MONGODB_URI` is read lazily in db.ts so the public site boots and serves
 *     static pages even when it is unset — only DB-backed routes fail.
 *   - `JWT_SECRET` is the opposite: `getJwtSecret()` throws, and session.ts
 *     calls it at module load, so importing the auth subsystem with no secret
 *     fails immediately (see db.test.ts's note). A site that signs sessions with
 *     an absent or weak key is worse than one that refuses to start the admin.
 *     The public site is unaffected — nothing public imports the auth modules.
 */

export const isProduction = process.env.NODE_ENV === "production";

/** A required string var, or a pointed error naming what to set and where. */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set. Add it to .env.local — see .env.example.`);
  }
  return value;
}

/**
 * The session-signing secret. Throws if unset or too short to be a safe HS256
 * key. 32 bytes is the floor for a 256-bit key; `openssl rand -base64 32`
 * produces a suitable value.
 */
export function getJwtSecret(): string {
  const secret = requireEnv("JWT_SECRET");
  if (secret.length < 32) {
    throw new Error(
      "JWT_SECRET is too short — use at least 32 characters " +
        "(e.g. `openssl rand -base64 32`).",
    );
  }
  return secret;
}

/** Cloudinary credentials, or null when uploads are not configured. */
export function getCloudinaryConfig(): {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
} | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}
