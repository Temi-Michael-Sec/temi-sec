"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * next-themes injects a small inline <script> that sets the theme class before
 * first paint (no flash of the wrong theme). Under the enforced CSP an inline
 * script only runs if it carries the request's nonce, so it's threaded through.
 */
export function ThemeProvider({
  children,
  nonce,
}: {
  children: React.ReactNode;
  nonce?: string;
}) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      nonce={nonce}
    >
      {children}
    </NextThemesProvider>
  );
}
