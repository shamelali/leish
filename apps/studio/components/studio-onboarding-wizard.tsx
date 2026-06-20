"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const SPECIALTIES = ["Bridal", "Event", "Natural", "Photoshoot", "SFX", "Lessons"] as const
const STUDIO_TYPES = ["Bridal Suite", "Creative Studio", "Multi-Service Salon", "Home Studio"] as const
const TEAM_SIZES = ["Solo (just me)", "2–5 artists", "6–10 artists", "10+ artists"] as const
const STATES = [
  "Wilayah Persekutuan Kuala Lumpur", "Selangor", "Pulau Pinang", "Johor",
  "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang", "Perak",
  "Perlis", "Sabah", "Sarawak", "Terengganu", "Wilayah Persekutuan Labuan",
  "Wilayah Persekutuan Putrajaya",
]

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 60)
}

import { getSupabaseBrowserClient } from "@leish/shared/lib/auth/client"

export function StudioOnboardingWizard({ userId, initialName }: { userId: string; initialName: string }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [studioName, setStudioName] = useState(initialName)
  const [studioType, setStudioType] = useState("")
  const [state, setState] = useState("")
  const [district, setDistrict] = useState("")
  const [address, setAddress] = useState("")
  const [bio, setBio] = useState("")
  const [specialties, setSpecialties] = useState<string[]>([])
  const [teamSize, setTeamSize] = useState("")
  const [startingRate, setStartingRate] = useState("")

  const step1Valid = studioName.trim().length >= 2 && studioType.length > 0 && state.length > 0 && district.trim().length > 0
  const step2Valid = specialties.length > 0 && teamSize.length > 0 && Number(startingRate) > 0
  const canNext = (step === 1 && step1Valid) || (step === 2 && step2Valid) || step === 3

  const handleSubmit = async () => {
    setSubmitting(true); setError(null)
    const baseSlug = slugify(studioName)
    const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
    try {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error("Failed to connect")

      const { data: provider, error: insertError } = await supabase.from("providers").insert({
        owner_id: userId, kind: "studio", slug,
        display_name: studioName.trim(), studio_type: studioType || null,
        state: state.trim(), district: district.trim(), address: address.trim() || null,
        bio: bio.trim() || null, specialties, team_size: teamSize,
        hourly_rate: Number(startingRate), starting_price: Number(startingRate),
        is_active: false, rating: 0, review_count: 0,
      }).select("id").single()

      if (insertError) {
        if (insertError.code === "23505") throw new Error("A studio with that name already exists.")
        throw insertError
      }

      router.push(`/${slug}?onboarded=1`)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
      setSubmitting(false)
    }
  }

  const toggleSpecialty = (s: string) => {
    setSpecialties((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">Studio Setup</p>
        <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">List your studio</h1>
        <p className="mt-2 text-sm text-muted-foreground">Complete all steps to publish your studio.</p>
      </div>

      <div className="border border-border bg-card p-6 sm:p-8">
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-serif text-xl font-medium text-foreground">Studio details</h2>
            <div>
              <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">Studio name <span className="text-accent">*</span></label>
              <input type="text" value={studioName} onChange={(e) => setStudioName(e.target.value)} placeholder="e.g. Glamour Studio KL"
                className="mt-2 w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">Studio type <span className="text-accent">*</span></label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {STUDIO_TYPES.map((t) => (
                  <button key={t} type="button" onClick={() => setStudioType(t)}
                    className={`border px-4 py-2.5 text-xs font-medium text-left transition-colors ${studioType === t ? "border-foreground bg-foreground text-primary-foreground" : "border-border bg-background text-muted-foreground hover:border-accent"}`}>{t}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">State <span className="text-accent">*</span></label>
                <select value={state} onChange={(e) => setState(e.target.value)}
                  className="mt-2 w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none">
                  <option value="">Select state</option>
                  {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">Area / District <span className="text-accent">*</span></label>
                <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="e.g. Mont Kiara"
                  className="mt-2 w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">Street address</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. No 12, Jalan Kiara 3, Mont Kiara"
                className="mt-2 w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">About your studio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
                placeholder="Describe your studio..."
                className="mt-2 w-full resize-none border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-serif text-xl font-medium text-foreground">Team & specialties</h2>
            <div>
              <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">Specialties <span className="text-accent">*</span></label>
              <div className="mt-3 flex flex-wrap gap-2">
                {SPECIALTIES.map((s) => {
                  const active = specialties.includes(s)
                  return (
                    <button key={s} type="button" onClick={() => toggleSpecialty(s)}
                      className={`px-4 py-2 text-xs font-medium uppercase tracking-widest transition-colors ${active ? "border border-foreground bg-foreground text-primary-foreground" : "border border-border bg-background text-muted-foreground hover:border-accent"}`}>{s}</button>
                  )
                })}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">Team size <span className="text-accent">*</span></label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {TEAM_SIZES.map((t) => (
                  <button key={t} type="button" onClick={() => setTeamSize(t)}
                    className={`border px-4 py-2.5 text-xs font-medium text-left transition-colors ${teamSize === t ? "border-foreground bg-foreground text-primary-foreground" : "border-border bg-background text-muted-foreground hover:border-accent"}`}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">Starting rate (MYR / session) <span className="text-accent">*</span></label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">MYR</span>
                <input type="number" min={0} value={startingRate} onChange={(e) => setStartingRate(e.target.value)} placeholder="300"
                  className="w-full border border-border bg-background py-2.5 pl-14 pr-3 text-sm text-foreground focus:border-accent focus:outline-none" />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h2 className="font-serif text-xl font-medium text-foreground">Review</h2>
            <div className="border border-border bg-background p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif text-2xl font-medium text-foreground">{studioName}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{studioType} · {state}{district ? `, ${district}` : ""}</p>
                  {address && <p className="mt-0.5 text-xs text-muted-foreground">{address}</p>}
                </div>
                <span className="text-sm font-medium text-accent">From MYR {startingRate}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {specialties.map((s) => (
                  <span key={s} className="border border-border px-3 py-1 text-[10px] uppercase tracking-widest text-muted-foreground">{s}</span>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                <span>Team: {teamSize}</span>
              </div>
              {bio && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{bio}</p>}
            </div>
            {error && <p className="rounded border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button type="button" onClick={() => setStep((s) => s - 1)} disabled={step === 1}
          className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-30">Back</button>
        {step < 3 ? (
          <button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canNext}
            className="flex items-center gap-2 border border-foreground bg-foreground px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent hover:border-accent disabled:pointer-events-none disabled:opacity-30">Continue</button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={submitting}
            className="flex items-center gap-2 border border-accent bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/80 disabled:pointer-events-none disabled:opacity-60">
            {submitting ? "Submitting..." : "Submit studio"}
          </button>
        )}
      </div>
    </div>
  )
}