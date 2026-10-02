import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      // `server-only` throws when imported outside a React Server Component
      // bundle. Tests run in plain Node, so stub it out.
      "server-only": path.resolve(__dirname, "test/stubs/server-only.ts"),
    },
  },
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "lcov"],
      // Measure the modules that hold business logic and are unit-testable.
      include: ["lib/**/*.ts", "app/api/cron/**/*.ts"],
      exclude: [
        "**/*.test.ts",
        "**/*.d.ts",
        "lib/supabase/database.types.ts",
        "lib/i18n/**",
        "lib/dashboard-mocks.ts",
      ],
      // Ratchet: these are the floor CI enforces. Raise them as coverage grows;
      // never lower them to make a PR pass.
      thresholds: {
        lines: 23,
        functions: 42,
        branches: 76,
        statements: 23,
      },
    },
  },
})
