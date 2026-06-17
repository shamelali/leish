"use client"

import { useState } from "react"
import { Mail, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ComingSoonProps {
  city?: string | null
}

export function ComingSoon({ city = null }: ComingSoonProps) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || status === "loading") return

    setStatus("loading")
    setMessage("")

    try {
      const res = await fetch("/api/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, city }),
      })

      if (res.ok) {
        setStatus("success")
        setEmail("")
      } else {
        const data = await res.json()
        setMessage(data.error || "Something went wrong")
        setStatus("error")
      }
    } catch {
      setMessage("Failed to sign up. Please try again.")
      setStatus("error")
    }
  }

  return (
    <div className="mx-auto max-w-2xl py-12 sm:py-16 lg:py-24">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
          <Mail className="h-8 w-8 text-accent" />
        </div>
        
        <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Coming Soon to Your City
        </h2>
        
        <p className="mt-4 text-lg text-muted-foreground">
          We&apos;re building our network of elite makeup artists in Malaysia. 
          Be the first to know when we launch in {city || "your area"}!
        </p>
      </div>

      {status === "success" ? (
        <div className="mt-8 flex items-center justify-center gap-2 text-green-600">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-medium">
            You&apos;re on the list! We&apos;ll notify you when we launch.
          </span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-2">
          <div className="flex-1">
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12"
              disabled={status === "loading"}
            />
          </div>
          <Button
            type="submit"
            disabled={status === "loading"}
            className="h-12 px-6"
          >
            {status === "loading" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing up...
              </>
            ) : (
              "Notify Me"
            )}
          </Button>
        </form>
      )}

      {message && (
        <p className="mt-3 text-sm text-red-500">{message}</p>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        Join {city ? city : "1,000+"} others waiting for launch. No spam, unsubscribe anytime.
      </p>
    </div>
  )
}