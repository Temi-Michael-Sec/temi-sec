import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col items-start px-5 py-24">
      <p className="font-mono text-sm text-faint">
        <span className="text-accent">temi@sec</span>
        <span className="text-muted">:~</span>
        <span className="text-faint">$</span> cd $_
      </p>
      <p className="mt-3 font-mono text-sm text-crit">
        bash: cd: no such file or directory
      </p>
      <h1 className="mt-6 text-3xl font-semibold tracking-[-0.02em]">
        404 — page not found
      </h1>
      <p className="mt-3 max-w-[50ch] text-muted">
        That path doesn&apos;t resolve. It may have moved, or never existed.
      </p>
      <Link
        href="/"
        className="mt-6 font-mono text-sm text-accent underline-offset-4 hover:underline"
      >
        cd ~ →
      </Link>
    </div>
  );
}
