import NextAuth from "next-auth"
import Google from "@auth/core/providers/google"
import Credentials from "@auth/core/providers/credentials"
import type { NextAuthConfig } from "next-auth"

const authConfig: NextAuthConfig = {
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
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

        const { prisma } = await import("./prisma")
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
  session: { strategy: "jwt" },
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
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const { prisma } = await import("./prisma")
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
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
  pages: { signIn: "/sign-in", error: "/auth/error" },
  secret: process.env.AUTH_SECRET,
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
