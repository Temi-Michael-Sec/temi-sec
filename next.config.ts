import type { NextConfig } from "next";

/**
 * Static security headers.
 *
 * Moved to Phase 0 from the original Phase 8 plan: these have zero
 * dependencies, so there is no reason to run the whole build without them.
 *
 * CSP lands here in Phase 2 as **report-only** (below), so violations are
 * reported but nothing is blocked. Phase 8 tightens it (nonces for scripts) and
 * flips it to enforcing once the reports show a clean run. See implementation.md.
 */

/**
 * Report-only CSP — the intended target policy, not yet enforced.
 *
 * `style-src` keeps 'unsafe-inline' on purpose: Shiki emits inline style for
 * per-token colours, a far weaker concession than inline scripts. `script-src`
 * omits 'unsafe-inline' deliberately so Next's inline bootstrap shows up in
 * reports — that's the signal Phase 8 needs to decide on nonces vs hashes.
 * `frame-src` allows only the privacy-friendly YouTube host used by embeds.
 */
const contentSecurityPolicyReportOnly = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src https://www.youtube-nocookie.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");
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

  // Report-only: evaluated by the browser, but nothing is blocked. Phase 8
  // flips this to an enforcing `Content-Security-Policy`.
  {
    key: "Content-Security-Policy-Report-Only",
    value: contentSecurityPolicyReportOnly,
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
