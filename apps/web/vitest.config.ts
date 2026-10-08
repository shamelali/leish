import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      // `server-only` throws unless the `react-server` export condition is
      // active, which vitest never sets. Its guard is a bundler concern that
      // unit tests cannot exercise, so map it to a no-op module — otherwise
      // every test whose import graph touches it fails on import.
      // See test/stubs/server-only.ts.
      "server-only": path.resolve(__dirname, "test/stubs/server-only.ts"),
    },
  },
  test: {
    server: {
      deps: {
        // next-auth@5 is pure ESM and does `import { NextRequest } from
        // "next/server"`, but Next 16 ships no `exports` map — only the file
        // `server.js`. Native Node ESM refuses extensionless subpaths
        // (ERR_MODULE_NOT_FOUND), so externalizing next-auth makes any test
        // that reaches it fail on import. Bundler-style resolution accepts it,
        // so transform next-auth through Vite instead of running it natively.
        inline: ["next-auth"],
      },
    },
  },
})
