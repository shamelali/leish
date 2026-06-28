import { redirect } from "next/navigation"
import { handleAuthCallback } from "@leish/shared/lib/auth/callback"

type Props = {
  searchParams: Promise<{ role?: string }>
}

export default async function AuthCallbackPage({ searchParams }: Props) {
  const params = await searchParams
  const role = params.role

  if (role === "artist" || role === "studio" || role === "customer") {
    const { cookies } = await import("next/headers")
    const cookieStore = await cookies()
    cookieStore.set("pendingOAuthRole", role, {
      path: "/",
      maxAge: 600,
      sameSite: "none",
      secure: true,
    })
  }

  try {
    const { redirect: target } = await handleAuthCallback()
    let finalTarget = target
    if (target.startsWith("/artist/")) {
      finalTarget = `https://artist.leish.my${target.replace("/artist", "") || "/"}`
    } else if (target.startsWith("/studio/")) {
      finalTarget = `https://studio.leish.my${target === "/studio/dashboard" ? "" : target.replace("/studio", "") || "/"}`
    }
    redirect(finalTarget)
  } catch (e) {
    console.error("[Leish] Auth callback error:", e)
    redirect("/sign-in?error=auth_failed")
  }
}
