"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Route-level error boundary. A thrown Server Component (a bad query, a
 * transient DB blip) lands here instead of Next's raw stack trace — which
 * matters on a portfolio site. Header/Footer still wrap this, since it renders
 * inside the root layout.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Vercel captures console.error into its logs.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col items-start px-5 py-24">
      <p className="font-mono text-sm text-faint">
        <span className="text-accent">temi@sec</span>
        <span className="text-muted">:~</span>
        <span className="text-faint">$</span> ./render
      </p>
      <p className="mt-3 font-mono text-sm text-crit">
        Segmentation fault (core dumped)
      </p>
      <h1 className="mt-6 text-3xl font-semibold tracking-[-0.02em]">
        Something broke on our end
      </h1>
      <p className="mt-3 max-w-[50ch] text-muted">
        This page hit an error while rendering. It&apos;s been logged. Retry, or
        head back home.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-faint">ref: {error.digest}</p>
      )}
      <div className="mt-6 flex gap-4 font-mono text-sm">
        <button
          type="button"
          onClick={reset}
          className="text-accent underline-offset-4 hover:underline"
        >
          retry
        </button>
        <Link
          href="/"
          className="text-accent underline-offset-4 hover:underline"
        >
          cd ~ →
        </Link>
      </div>
    </div>
  );
}
