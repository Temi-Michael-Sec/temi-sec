import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { Logo } from "./Logo";
import { MobileNav } from "./MobileNav";

// Routes appear as their sections exist. See implementation.md.
const NAV = [
  { href: "/blog", label: "Blog" },
  { href: "/ctf", label: "CTF" },
  { href: "/tools", label: "Tools" },
  { href: "/policies", label: "Policies" },
  { href: "/glossary", label: "Glossary" },
];

export function Header() {
  return (
    <header className="relative border-b border-border">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-6 px-5">
        <Link href="/" aria-label="temi.sec home">
          <Logo />
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

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <MobileNav items={NAV} />
        </div>
      </div>
    </header>
  );
}
