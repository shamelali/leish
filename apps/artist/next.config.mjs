/** @type {import('next').NextConfig} */
import { fileURLToPath } from "url"
import path from "path"
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const monorepoRoot = path.join(__dirname, "../..")

const nextConfig = {
  transpilePackages: ["@leish/shared"],
  outputFileTracingRoot: monorepoRoot,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/object/**" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
  },
  turbopack: {
    root: monorepoRoot,
    resolveAlias: {
      "@leish/shared": path.join(monorepoRoot, "packages/shared"),
      "@leish/server": path.join(monorepoRoot, "packages/server"),
    },
  },
}
export default nextConfig