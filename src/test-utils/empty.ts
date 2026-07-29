// Empty module. Aliased in vitest.config.ts to stand in for `server-only`,
// whose real export throws outside a React Server Components bundle — which is
// exactly the environment vitest runs in. Server-only modules are still
// importable in tests; the runtime guard is simply a no-op here.
export {};
