"use client";

/**
 * Last-resort boundary for an error in the root layout itself. It replaces the
 * whole document (no Header/Footer/theme), so it renders its own <html>/<body>
 * with inline styles. Rarely hit, but without it a layout-level throw shows a
 * blank white page.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0a0a0b",
          color: "#e4e4e7",
          fontFamily: "ui-monospace, Menlo, monospace",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: "40ch" }}>
          <p style={{ color: "#f87171", fontSize: "0.85rem" }}>
            kernel panic — not syncing
          </p>
          <h1 style={{ fontSize: "1.5rem", margin: "0.75rem 0 0" }}>
            The site failed to load
          </h1>
          <p style={{ color: "#a1a1aa", fontSize: "0.9rem" }}>
            A fault occurred before the page could render. Try reloading.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.25rem",
              background: "transparent",
              color: "#2dd4bf",
              border: "1px solid #27272a",
              borderRadius: 4,
              padding: "0.4rem 0.9rem",
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            reload
          </button>
        </div>
      </body>
    </html>
  );
}
