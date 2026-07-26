import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "tests/**/*.test.ts"],
    passWithNoTests: true,
    // Shiki loads two themes + language grammars on its first call (~several
    // seconds cold), and the render/toc suites each pay that once. Under
    // parallel workers on a busy or CI machine that first render can exceed the
    // 5s default. Every later render is cached and fast; this headroom only
    // covers the cold start.
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
