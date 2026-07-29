import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/cookie";

/**
 * Optimistic auth gate for /admin (Next 16's proxy, formerly middleware).
 *
 * This is a pre-filter, NOT the security boundary. It only checks that a session
 * cookie is *present* — it does not verify the signature (that would mean
 * importing jose and the secret into the proxy, and Next explicitly warns proxy
 * "should not be used as a full session management or authorization solution").
 * The real check runs in requireAdmin() on every admin page, Server Action and
 * Route Handler. So a forged or expired cookie sails past here and is rejected
 * there; this just spares unauthenticated visitors a render before the redirect.
 *
 * Runs on the Node.js runtime (proxy's default in Next 16).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE_NAME);
  const isLoginPage = pathname === "/admin/login";

  // Unauthenticated and not already at the login page → send to login.
  //
  // Deliberately NOT the reverse (bouncing a cookie-bearing request off the
  // login page): this is a presence check, so an *invalid* cookie looks logged
  // in here but is rejected by requireAdmin on the dashboard — which would send
  // it back to /admin/login and loop forever. The login page itself does the
  // real check and redirects a genuinely-authenticated admin to the dashboard.
  if (!hasSession && !isLoginPage) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

// Scoped to /admin so nothing on the public site pays the proxy cost. Both
// entries so bare `/admin` and `/admin/anything` are covered.
export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
