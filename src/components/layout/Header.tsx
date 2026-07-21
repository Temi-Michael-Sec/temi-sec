import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

// Routes are added as their phases land. See implementation.md.
const NAV = [
  { href: "/blog", label: "Blog" },
  { href: "/ctf", label: "CTF" },
  { href: "/tools", label: "Tools" },
  { href: "/policies", label: "Policies" },
  { href: "/series", label: "Series" },
];

export function Header() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-6 px-5">
        <Link
          href="/"
          className="font-mono text-sm font-semibold tracking-tight"
        >
          <span className="text-accent">$</span> temi.sec
        </Link>

        <nav aria-label="Main" className="hidden gap-5 text-sm sm:flex">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-muted transition-colors hover:text-foreground"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
