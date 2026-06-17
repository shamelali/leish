"use client"

import { useState } from "react"
import { MessageSquare, Send } from "lucide-react"

export function ArtistChat({
  artistId: _artistId,
  artistName,
}: {
  artistId: string
  artistName: string
}) {
  const [message, setMessage] = useState("")
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setSent(true)
    setMessage("")
  }

  return (
    <div className="border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-accent" />
        <h3 className="font-serif text-lg font-medium text-foreground">
          Contact {artistName}
        </h3>
      </div>

      {sent ? (
        <div className="mt-4 rounded-lg border border-accent/20 bg-accent/5 p-4 text-center">
          <p className="text-sm text-foreground">Message sent!</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {artistName} will get back to you soon.
          </p>
          <button
            onClick={() => setSent(false)}
            className="mt-3 text-xs font-medium uppercase tracking-widest text-accent hover:underline"
          >
            Send another
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Hi ${artistName}, I'd like to book...`}
            rows={3}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            Send Message
          </button>
        </form>
      )}
    </div>
  )
}
