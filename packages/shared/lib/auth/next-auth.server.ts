import "server-only"
import NextAuth from "next-auth"
import Google from "@auth/core/providers/google"
import Credentials from "@auth/core/providers/credentials"
import { authConfig } from "./config"

const fullAuthConfig = {
  ...authConfig,
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
      if (account?.provider === "google") {
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
