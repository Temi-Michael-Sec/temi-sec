import Link from "next/link";
import { logout } from "@/lib/admin/auth-actions";

/**
 * Top bar for authenticated admin pages. Rendered by each page after its own
 * `requireAdmin()` — it is not an auth boundary itself.
 */
export function AdminNav({ email }: { email: string }) {
  return (
    <nav className="mb-8 flex items-center justify-between border-b border-border pb-4">
      <div className="flex items-center gap-4 font-mono text-sm">
        <Link href="/admin" className="font-semibold text-accent">
          &gt;_ admin
        </Link>
        <Link href="/admin/posts" className="text-muted hover:text-foreground">
          posts
        </Link>
        <Link
          href="/admin/posts/new"
          className="text-muted hover:text-foreground"
        >
          new
        </Link>
      </div>
      <div className="flex items-center gap-3 text-xs text-faint">
        <span className="hidden sm:inline">{email}</span>
        <form action={logout}>
          <button
            type="submit"
            className="text-muted underline-offset-4 hover:text-crit hover:underline"
          >
            logout
          </button>
        </form>
      </div>
    </nav>
  );
}
