import "server-only"
import NextAuth from "next-auth"
import Google from "@auth/core/providers/google"
import TikTok from "@auth/core/providers/tiktok"
import Facebook from "@auth/core/providers/facebook"
import Credentials from "@auth/core/providers/credentials"
import { authConfig } from "./config"

// AUTH_SECRET signs session JWTs. Surface a misconfiguration from the first
// log line, but do NOT throw: this module is reached by route handlers and,
// via @/lib/supabase/ssr -> auth/ssr, by unit tests, and a top-level throw
// turns a missing variable into an import-time crash that fails `next build`
// and the test suite in environments where it is legitimately absent (CI
// checks out no .env.local, and ci.yml declares no env). NextAuth still fails
// fast at the point of use with its own MissingSecret error.
const authSecret = process.env.AUTH_SECRET
if (!authSecret) {
  console.warn(
    "[auth] AUTH_SECRET is not set — session JWTs cannot be signed. Set it in .env.local (see .env.example).",
  )
}

const fullAuthConfig = {
  ...authConfig,
  secret: authSecret,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
    }),
    TikTok({
      clientId: process.env.AUTH_TIKTOK_ID ?? "",
      clientSecret: process.env.AUTH_TIKTOK_SECRET ?? "",
    }),
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID ?? "",
      clientSecret: process.env.AUTH_FACEBOOK_SECRET ?? "",
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined
        const password = credentials?.password as string | undefined
        if (!email || !password) return null

        const { prisma } = await import("./prisma.server")
        const bcrypt = (await import("bcryptjs")).default

        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, name: true, image: true, hashedPassword: true, mfaEnabled: true },
        })

        if (!user?.hashedPassword) return null

        const isValid = await bcrypt.compare(password, user.hashedPassword)
        if (!isValid) return null

        return { id: user.id, email: user.email, name: user.name, image: user.image, mfaEnabled: user.mfaEnabled }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }: any) {
      if (account?.provider === "google" || account?.provider === "tiktok" || account?.provider === "facebook") {
        const { prisma } = await import("./prisma.server")
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { mfaEnabled: true },
        })
        if (dbUser?.mfaEnabled) {
          return "/sign-in/mfa"
        }
      }
      return true
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(fullAuthConfig as any)
