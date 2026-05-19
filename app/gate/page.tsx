"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Lock } from "lucide-react"

export default function GatePage() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (password === "leish788") {
      document.cookie = "leish_access=granted; path=/; max-age=86400; SameSite=Lax"
      router.push("/")
      router.refresh()
    } else {
      setError("Incorrect password")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4">
            <Lock className="h-8 w-8 text-accent" />
          </div>
          <h1 className="font-serif text-2xl font-medium text-foreground">
            Private Access
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter the password to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              autoFocus
              disabled={loading}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 px-4 rounded-lg bg-foreground text-primary-foreground font-medium text-sm transition-colors hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Verifying..." : "Enter"}
          </button>
        </form>
      </div>
    </div>
  )
}
