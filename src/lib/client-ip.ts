/**
 * The client IP used as the rate-limit key.
 *
 * Shared by the proxy (which returns the HTTP 429) and the login Server Action
 * (which consumes the limit), so both bucket a request identically. It lives in
 * its own pure module because a "use server" file may only export async
 * actions, and the proxy must not import anything server-only.
 *
 * Prefer x-real-ip: on Vercel the platform sets it to the connecting client, so
 * unlike the LEFTMOST x-forwarded-for value it is not client-controllable (a
 * spoofed leftmost XFF could otherwise be rotated to evade the throttle). Fall
 * back to the LAST x-forwarded-for hop (the one the trusted proxy appended),
 * then to a constant so unknowns share one bucket.
 */
export function clientIp(headerList: Headers): string {
  const realIp = headerList.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const parts = (headerList.get("x-forwarded-for") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.at(-1) ?? "unknown";
}
