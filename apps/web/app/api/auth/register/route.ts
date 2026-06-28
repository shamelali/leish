import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  const { email, password, role, fullName, phone } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
  }

  const { prisma } = await import("@leish/shared/lib/auth/prisma")
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "User already exists" }, { status: 409 })
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      email,
      hashedPassword,
      name: fullName || null,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const response = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseKey!,
      Authorization: `Bearer ${supabaseKey!}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      id: user.id,
      full_name: fullName || null,
      phone: phone || null,
      role: role || "customer",
    }),
  })

  if (!response.ok) {
    await prisma.user.delete({ where: { id: user.id } })
    return NextResponse.json({ error: "Failed to create profile" }, { status: 500 })
  }

  return NextResponse.json({ success: true, userId: user.id })
}
