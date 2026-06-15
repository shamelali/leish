"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@leish/shared/lib/auth/client"

export function StudioOnboardingWizard({
  userId,
  initialName,
}: {
  userId: string
  initialName: string
}) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [name, setName] = useState(initialName)
  const [state, setState] = useState("")
  const [district, setDistrict] = useState("")
  const [bio, setBio] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error("Failed to connect")

      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")

      const { error: insertError } = await supabase.from("providers").insert({
        owner_id: userId,
        display_name: name,
        kind: "studio",
        slug,
        state,
        district: district || null,
        bio: bio || null,
        is_active: false,
      })

      if (insertError) throw insertError
      router.push("/")
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  if (step === 1) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">
          Step 1 of 2
        </p>
        <h1 className="mt-3 font-serif text-3xl font-semibold text-foreground">
          Tell us about your studio
        </h1>
        <div className="mt-8 space-y-4">
          <div>
            <label className="text-sm font-medium">Studio Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Leish Studio KL" />
          </div>
          <div>
            <label className="text-sm font-medium">State</label>
            <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="e.g. Kuala Lumpur" />
          </div>
          <div>
            <label className="text-sm font-medium">District (optional)</label>
            <Input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="e.g. Bukit Bintang" />
          </div>
          <div>
            <label className="text-sm font-medium">Bio (optional)</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell clients about your studio..."
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={() => setStep(2)} disabled={!name || !state}>
            Next
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">
        Step 2 of 2
      </p>
      <h1 className="mt-3 font-serif text-3xl font-semibold text-foreground">
        Almost done!
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Review your details and submit for approval.
      </p>
      <div className="mt-8 space-y-3 rounded-lg border border-border bg-card p-6">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Name</span>
          <span className="font-medium text-foreground">{name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Location</span>
          <span className="font-medium text-foreground">{state}{district ? `, ${district}` : ""}</span>
        </div>
        {bio && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Bio</span>
            <span className="font-medium text-foreground max-w-[200px] truncate">{bio}</span>
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      <div className="mt-6 flex gap-3">
        <Button variant="outline" onClick={() => setStep(1)}>
          Back
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Submitting..." : "Submit for Review"}
        </Button>
      </div>
    </div>
  )
}
