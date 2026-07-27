import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-5 py-8 text-sm text-muted sm:flex-row sm:items-center">
        <p>© {new Date().getFullYear()} Temi Michael</p>

        <nav aria-label="Footer" className="flex gap-5 sm:ml-auto">
          {/* /security ships in Phase 8, once there's a hardening story to tell. */}
          <Link href="/about" className="transition-colors hover:text-foreground">
            About
          </Link>
          <Link href="/rss.xml" className="transition-colors hover:text-foreground">
            RSS
          </Link>
          <a
            href="https://github.com/Temi-Michael-Sec"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
