/**
 * CSP violation sink. The report-only policy (next.config.ts) points here, so
 * browsers POST a JSON report whenever something *would* have been blocked. We
 * log it — Vercel captures console output — which is the data Phase 8 uses to
 * decide the enforcing policy before flipping report-only off.
 *
 * Deliberately minimal and unauthenticated: it only accepts reports and always
 * 204s, so it can't be probed for anything and can't fail a page.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Both the legacy report-uri shape and the newer report-to shape.
    const report = body?.["csp-report"] ?? body;
    console.warn("[csp-report]", JSON.stringify(report));
  } catch {
    // Ignore malformed bodies — never error on a report.
  }
  return new Response(null, { status: 204 });
}
