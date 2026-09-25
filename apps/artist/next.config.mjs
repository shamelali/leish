/** @type {import('next').NextConfig} */
import { fileURLToPath } from "url"
import path from "path"
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const nextConfig = {
  transpilePackages: ["@leish/shared"],
  outputFileTracingRoot: path.join(__dirname, "../.."),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/object/**" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
  },
  turbopack: {
    root: __dirname,
    resolveAlias: {
      "@leish/shared": path.join(__dirname, "../../packages/shared"),
      "@leish/server": path.join(__dirname, "../../packages/server"),
    },
  },
}
export default nextConfig