"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Eye, EyeOff, Loader2 } from "lucide-react"

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "PASSWORD_RECOVERY") {
        setSessionReady(true)
      }
    })

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSessionReady(true)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (password.length < 12) {
      setMessage({ type: "error", text: "Password must be at least 12 characters." })
      setLoading(false)
      return
    }

    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setMessage({ type: "error", text: "Client not initialized." })
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setMessage({ type: "error", text: error.message })
    } else {
      setMessage({ type: "success", text: "Password updated successfully! Redirecting..." })
      setTimeout(() => router.push("/sign-in"), 2000)
    }
    setLoading(false)
  }

  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="mx-auto max-w-md px-6 lg:px-8">
        <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">
          Update password
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Enter your new password below.
        </p>

        {!sessionReady ? (
          <p className="mt-8 text-sm text-muted-foreground">
            Verifying your reset link...
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium">
                New password
              </label>
              <div className="relative mt-1">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={12}
                  placeholder="••••••••"
                  className="block w-full rounded-md border border-input bg-background px-3 py-2 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Must be at least 12 characters
              </p>
            </div>

            {message && (
              <div
                className={`rounded-md p-3 text-sm ${
                  message.type === "success"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary px-4 py-2.5 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </span>
              ) : (
                "Update password"
              )}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
