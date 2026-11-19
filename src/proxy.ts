import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/cookie";
import { clientIp } from "@/lib/client-ip";
import { loginRetryAfter } from "@/lib/ratelimit";

/**
 * Next 16's proxy (formerly middleware). Three jobs, in order:
 *
 *   1. Login throttle — answers a brute-forcer with a real HTTP 429 once their
 *      bucket is empty. A read-only peek; the login action consumes the token.
 *   2. Optimistic /admin gate — a presence check only, NOT the security
 *      boundary. requireAdmin() verifies the session on every admin page,
 *      Server Action and Route Handler; this just spares logged-out visitors a
 *      render before the redirect.
 *   3. Content-Security-Policy — a fresh nonce per request. Next reads the
 *      nonce back out of the request's CSP header and stamps it onto its own
 *      inline scripts; layout.tsx hands it to next-themes via `x-nonce`.
 *
 * Runs on the Node.js runtime (proxy's default in Next 16).
 */

const LOGIN_PATH = "/admin/login";

function buildCsp(nonce: string): string {
  // React uses eval() in development for its debugging overlays (rebuilding
  // server error stacks). Production never needs it.
  const isDev = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    // 'strict-dynamic': a nonce'd script may load further scripts (Next's
    // chunks); host allowlists like 'self' are ignored by browsers that
    // support it, so only nonce-bearing scripts start the chain.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Shiki writes per-token colours as inline style, and GSAP animates via
    // inline style. Inline STYLE is a far weaker concession than inline script.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-src https://www.youtube-nocookie.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

/** 128 random bits, base64 — unguessable and unique per request. */
function makeNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
}

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Login throttle. The login form POSTs its Server Action to this path.
  if (request.method === "POST" && pathname === LOGIN_PATH) {
    let retryAfter: number | null = null;
    try {
      retryAfter = await loginRetryAfter(clientIp(request.headers));
    } catch {
      // Redis unreachable: let the request through rather than take the login
      // page down. The action's own limit() call still runs (and fails loudly)
      // — that is the authoritative check.
    }
    if (retryAfter !== null) {
      return new NextResponse("Too many login attempts. Try again later.\n", {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }
  }

  // 2. Optimistic admin gate. Deliberately NOT the reverse (bouncing a
  // cookie-bearing request off the login page): an *invalid* cookie looks
  // logged in here but is rejected by requireAdmin, which would loop forever.
  // The login page does the real check and redirects a genuine admin.
  if (
    isAdminPath(pathname) &&
    pathname !== LOGIN_PATH &&
    !request.cookies.has(SESSION_COOKIE_NAME)
  ) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  // 3. CSP. Set on the REQUEST so Next's renderer can read the nonce, and on
  // the RESPONSE so the browser enforces it.
  const nonce = makeNonce();
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      // Everything except API routes, static assets, image optimisation, the
      // favicon and PDFs — none render HTML that needs a nonce. PDFs especially:
      // Chrome renders them in an embedded viewer that a page CSP's
      // `object-src 'none'` would blank out. The CV must open as a plain link.
      source: "/((?!api|_next/static|_next/image|favicon.ico|.*\\.pdf$).*)",
      // Skip <Link> prefetches: a prefetched payload can't use a nonce minted
      // for a request that never becomes the page.
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
