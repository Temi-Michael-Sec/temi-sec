import type { Metadata } from "next";

/**
 * Admin section shell. Inherits the site's root layout (header/footer, theme,
 * fonts) — deliberately, so an admin can jump straight to the live site — and
 * only adds a constrained content column plus a hard `noindex`. The auth
 * boundary is NOT here (layouts don't re-render on navigation): every admin page
 * calls `requireAdmin()` itself.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="mx-auto w-full max-w-6xl px-5 py-10">{children}</div>;
}
