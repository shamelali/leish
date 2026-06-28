import { NextResponse } from "next/server"

export async function POST() {
  const { auth: getSession } = await import("@leish/shared/lib/auth/next-auth")
  const session = await getSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { prisma } = await import("@leish/shared/lib/auth/prisma")

  await prisma.user.update({
    where: { id: session.user.id },
    data: { mfaSecret: null, mfaEnabled: false },
  })

  return NextResponse.json({ success: true })
}
