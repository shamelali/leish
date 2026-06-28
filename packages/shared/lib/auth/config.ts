import type { NextAuthConfig } from "next-auth"

// Edge-compatible partial config (no Node.js-only imports like bcrypt, prisma)
// Used for middleware and client-side session reading
export const authConfig: NextAuthConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [], // Providers added in full config (server only)
  cookies: {
    sessionToken: {
      options: {
        domain: ".leish.my",
        secure: true,
        sameSite: "lax",
      },
    },
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.mfaEnabled = (user as any).mfaEnabled ?? false
      }
      if (trigger === "update" && session?.mfaVerified) {
        token.mfaVerified = true
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        const mfaEnabled = (token.mfaEnabled as boolean) ?? false
        const mfaVerified = (token.mfaVerified as boolean | undefined) ?? !mfaEnabled
        ;(session.user as any).mfaEnabled = mfaEnabled
        ;(session.user as any).mfaVerified = mfaVerified
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
  pages: { signIn: "/sign-in", error: "/auth/error" },
  secret: process.env.AUTH_SECRET,
}
