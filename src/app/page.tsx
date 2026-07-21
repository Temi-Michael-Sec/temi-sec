export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-20">
      <p className="font-mono text-sm text-accent">Phase 0 — foundation</p>

      <h1 className="mt-4 max-w-[var(--measure)] text-4xl font-semibold tracking-tight">
        Security notes, CTF writeups, and a tool reference that gets used.
      </h1>

      <p className="mt-5 max-w-[var(--measure)] text-muted">
        Nothing is published yet. The content engine lands in Phase 1 and this
        page becomes a real home in Phase 2 — see{" "}
        <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-sm">
          implementation.md
        </code>
        .
      </p>
    </div>
  );
}
