import type { NextConfig } from "next";

/**
 * Static security headers.
 *
 * Moved to Phase 0 from the original Phase 8 plan: these have zero
 * dependencies, so there is no reason to run the whole build without them.
 *
 * The Content-Security-Policy is NOT here. It is enforced, nonce-based, and so
 * minted per request in src/proxy.ts — a static header can't carry a nonce.
 */
const securityHeaders = [
  // Stop browsers guessing content types. Mitigates a whole class of upload
  // and injection tricks that rely on a response being sniffed as HTML.
  { key: "X-Content-Type-Options", value: "nosniff" },

  // Send the full URL to same-origin, only the origin cross-origin. Post URLs
  // shouldn't leak in referrers to third parties.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // Nothing here needs these. Deny by default.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },

  // Legacy defence-in-depth; modern browsers use frame-ancestors from CSP.
  { key: "X-Frame-Options", value: "DENY" },

  // HSTS. Vercel serves HTTPS only, so this is safe from day one.
  // No `preload` — that is a one-way door and needs a custom domain first.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
