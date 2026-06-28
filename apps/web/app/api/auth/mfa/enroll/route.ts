import { NextResponse } from "next/server"
import { auth } from "@leish/shared/lib/auth/next-auth.server"
import { generateSecret, generateURI } from "otplib"
import QRCode from "qrcode"

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { prisma } = await import("@leish/shared/lib/auth/prisma.server")

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (user?.mfaEnabled) {
    return NextResponse.json({ error: "MFA already enabled" }, { status: 400 })
  }

  const secret = generateSecret()
  const uri = generateURI({
    issuer: "Leish!",
    label: session.user.email!,
    secret,
    algorithm: "sha1",
    digits: 6,
    period: 30,
  })
  const qrCode = await QRCode.toDataURL(uri)

  await prisma.user.update({
    where: { id: session.user.id },
    data: { mfaSecret: secret },
  })

  return NextResponse.json({ secret, uri, qrCode })
}
