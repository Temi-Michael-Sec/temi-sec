import { isProduction } from "@/lib/env";

/**
 * Session cookie constants, deliberately in their own module.
 *
 * `proxy.ts` needs the cookie *name* for its optimistic presence check, but must
 * not pull in `jose` or anything `server-only`. session.ts needs the same name
 * plus the TTL. Putting them here lets both import without coupling proxy to the
 * signing machinery.
 *
 * The `__Host-` prefix is a browser-enforced hardening: a cookie so named is
 * rejected unless it is Secure, has Path=/, and carries no Domain — which pins
 * it to this exact origin and blocks subdomain injection. That requires HTTPS,
 * so it is only used in production; local dev (plain http) uses the bare name.
 */
export const SESSION_COOKIE_NAME = isProduction ? "__Host-session" : "session";

/** 12 hours. Short-lived by design; refreshed on activity (see session.ts). */
export const SESSION_TTL_SECONDS = 12 * 60 * 60;
