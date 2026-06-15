/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@leish/shared"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/object/**" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
  },
}
export default nextConfig
