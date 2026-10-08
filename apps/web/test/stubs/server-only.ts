/**
 * Test-only stand-in for the `server-only` package, wired up through the
 * `server-only` alias in `vitest.config.ts`.
 *
 * The real package ships two entry points selected by the `react-server`
 * export condition: `empty.js` under that condition, and `index.js`
 * everywhere else — and `index.js` throws unconditionally:
 *
 *   This module cannot be imported from a Client Component module.
 *   It should only be used from a Server Component.
 *
 * Vitest does not evaluate in a `react-server` environment, so any test whose
 * import graph reaches `server-only` (for example `lib/services/db.test.ts`,
 * which reaches it via `@/lib/supabase/ssr` -> `@leish/shared` ->
 * `auth/next-auth.server`) dies before the code under test runs. The guard it
 * implements is a bundler-time concern, not something unit tests can exercise,
 * so under vitest the import is a no-op.
 */
export {}
