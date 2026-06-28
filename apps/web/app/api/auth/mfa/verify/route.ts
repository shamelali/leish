import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { code } = await request.json()
  if (!code || code.length < 6) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 })
  }

  const { auth: getSession } = await import("@leish/shared/lib/auth/next-auth.server")
  const session = await getSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { prisma } = await import("@leish/shared/lib/auth/prisma.server")
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user?.mfaSecret) {
    return NextResponse.json({ error: "MFA not set up" }, { status: 400 })
  }

  const { verifySync } = await import("otplib")
  const isValid = verifySync({ token: code, secret: user.mfaSecret })
  if (!isValid) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { mfaEnabled: true },
  })

  return NextResponse.json({ success: true })
}
