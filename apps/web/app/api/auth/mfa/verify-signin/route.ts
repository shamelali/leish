import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { code } = await request.json()
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Code is required" }, { status: 400 })
  }

  const { auth: getSession } = await import("@leish/shared/lib/auth/next-auth")
  const session = await getSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { prisma } = await import("@leish/shared/lib/auth/prisma")
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { mfaSecret: true },
  })

  if (!user?.mfaSecret) {
    return NextResponse.json({ error: "MFA not configured" }, { status: 400 })
  }

  const { verifySync } = await import("otplib")
  const isValid = verifySync({ token: code, secret: user.mfaSecret })
  if (!isValid) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
