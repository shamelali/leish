"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react"

const SPECIALTIES = ["Bridal", "Event", "Natural", "Photoshoot", "SFX", "Lessons"] as const
const STATES = [
  "Wilayah Persekutuan Kuala Lumpur",
  "Selangor",
  "Pulau Pinang",
  "Johor",
  "Kedah",
  "Kelantan",
  "Melaka",
  "Negeri Sembilan",
  "Pahang",
  "Perak",
  "Perlis",
  "Sabah",
  "Sarawak",
  "Terengganu",
  "Wilayah Persekutuan Labuan",
  "Wilayah Persekutuan Putrajaya",
]

interface FormData {
  // Step 1 — About
  displayName: string
  state: string
  district: string
  experience: string
  bio: string
  // Step 2 — Specialties & Rate
  specialties: string[]
  hourlyRate: string
  // Step 3 — Services
  services: { name: string; durationMinutes: number; priceMyr: number }[]
}

const STEPS = [
  { label: "About You", number: 1 },
  { label: "Specialties", number: 2 },
  { label: "Services", number: 3 },
  { label: "Review", number: 4 },
]

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60)
}

export function ArtistOnboardingWizard({
  userId,
  initialName,
}: {
  userId: string
  initialName: string
}) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<FormData>({
    displayName: initialName,
    state: "",
    district: "",
    experience: "",
    bio: "",
    specialties: [],
    hourlyRate: "",
    services: [{ name: "", durationMinutes: 60, priceMyr: 0 }],
  })

  const update = (patch: Partial<FormData>) => setForm((f) => ({ ...f, ...patch }))

  // ── Step validation ──────────────────────────────────────────────────────────
  const step1Valid =
    form.displayName.trim().length >= 2 &&
    form.state.trim().length > 0 &&
    form.district.trim().length > 0

  const step2Valid = form.specialties.length > 0 && Number(form.hourlyRate) > 0

  const step3Valid =
    form.services.length > 0 &&
    form.services.every(
      (s) => s.name.trim().length > 0 && s.durationMinutes > 0 && s.priceMyr > 0
    )

  const canNext =
    (step === 1 && step1Valid) ||
    (step === 2 && step2Valid) ||
    (step === 3 && step3Valid) ||
    step === 4

  // ── Service helpers ──────────────────────────────────────────────────────────
  const addService = () =>
    update({
      services: [...form.services, { name: "", durationMinutes: 60, priceMyr: 0 }],
    })

  const updateService = (
    i: number,
    patch: Partial<{ name: string; durationMinutes: number; priceMyr: number }>
  ) => {
    const next = form.services.map((s, idx) => (idx === i ? { ...s, ...patch } : s))
    update({ services: next })
  }

  const removeService = (i: number) =>
    update({ services: form.services.filter((_, idx) => idx !== i) })

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)

    const baseSlug = slugify(form.displayName)
    const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`

    try {
      const res = await fetch("/api/onboarding/artist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          slug,
          displayName: form.displayName.trim(),
          state: form.state,
          district: form.district.trim(),
          experience: form.experience.trim(),
          bio: form.bio.trim(),
          specialties: form.specialties,
          hourlyRate: Number(form.hourlyRate),
          services: form.services.map((s) => ({
            name: s.name.trim(),
            durationMinutes: s.durationMinutes,
            priceMyr: s.priceMyr,
          })),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create profile")

      router.replace("/artist?onboarded=1")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-10">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">
          Artist Setup
        </p>
        <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Build your profile
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Complete all steps to publish your profile and start receiving bookings.
        </p>
      </div>

      {/* Step indicator */}
      <div className="mb-10 flex items-center gap-0">
        {STEPS.map((s, idx) => (
          <div key={s.number} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-medium transition-colors ${
                  step > s.number
                    ? "border-accent bg-accent text-accent-foreground"
                    : step === s.number
                    ? "border-foreground bg-foreground text-primary-foreground"
                    : "border-border bg-background text-muted-foreground"
                }`}
              >
                {step > s.number ? <Check className="h-4 w-4" /> : s.number}
              </div>
              <span
                className={`mt-1.5 hidden text-[10px] uppercase tracking-widest sm:block ${
                  step === s.number ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`mx-1 h-px flex-1 transition-colors ${
                  step > s.number ? "bg-accent" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="border border-border bg-card p-6 sm:p-8">

        {/* ── Step 1: About ── */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-serif text-xl font-medium text-foreground">About you</h2>
            <div>
              <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Display name <span className="text-accent">*</span>
              </label>
              <input
                type="text"
                value={form.displayName}
                onChange={(e) => update({ displayName: e.target.value })}
                placeholder="e.g. Aisyah Razak"
                className="mt-2 w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                This is how clients will find you on Leish.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  State <span className="text-accent">*</span>
                </label>
                <select
                  value={form.state}
                  onChange={(e) => update({ state: e.target.value })}
                  className="mt-2 w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
                >
                  <option value="">Select state</option>
                  {STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Area / District <span className="text-accent">*</span>
                </label>
                <input
                  type="text"
                  value={form.district}
                  onChange={(e) => update({ district: e.target.value })}
                  placeholder="e.g. Petaling Jaya"
                  className="mt-2 w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Years of experience
              </label>
              <input
                type="text"
                value={form.experience}
                onChange={(e) => update({ experience: e.target.value })}
                placeholder="e.g. 5 years"
                className="mt-2 w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Bio
              </label>
              <textarea
                value={form.bio}
                onChange={(e) => update({ bio: e.target.value })}
                rows={4}
                placeholder="Tell clients about your style, experience, and what makes you stand out..."
                className="mt-2 w-full resize-none border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
              />
              <p className="mt-1 text-right text-xs text-muted-foreground">
                {form.bio.length} / 500
              </p>
            </div>
          </div>
        )}

        {/* ── Step 2: Specialties ── */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-serif text-xl font-medium text-foreground">
              Specialties & rate
            </h2>
            <div>
              <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                What do you specialise in? <span className="text-accent">*</span>
              </label>
              <p className="mt-1 text-xs text-muted-foreground">Select all that apply.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SPECIALTIES.map((s) => {
                  const active = form.specialties.includes(s)
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() =>
                        update({
                          specialties: active
                            ? form.specialties.filter((x) => x !== s)
                            : [...form.specialties, s],
                        })
                      }
                      className={`px-4 py-2 text-xs font-medium uppercase tracking-widest transition-colors ${
                        active
                          ? "border border-foreground bg-foreground text-primary-foreground"
                          : "border border-border bg-background text-muted-foreground hover:border-accent"
                      }`}
                    >
                      {s}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Starting rate (MYR / hr) <span className="text-accent">*</span>
              </label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  MYR
                </span>
                <input
                  type="number"
                  min={0}
                  value={form.hourlyRate}
                  onChange={(e) => update({ hourlyRate: e.target.value })}
                  placeholder="150"
                  className="w-full border border-border bg-background py-2.5 pl-14 pr-3 text-sm text-foreground focus:border-accent focus:outline-none"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                This is shown on your profile card. You can set specific prices per service in the next step.
              </p>
            </div>
          </div>
        )}

        {/* ── Step 3: Services ── */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-medium text-foreground">Services</h2>
              <button
                type="button"
                onClick={addService}
                className="text-xs font-medium uppercase tracking-widest text-accent hover:text-foreground"
              >
                + Add service
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Add at least one service. These appear on your profile and clients select one when booking.
            </p>
            <div className="space-y-4">
              {form.services.map((svc, i) => (
                <div key={i} className="border border-border bg-background p-4">
                  <div className="flex items-start justify-between">
                    <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                      Service {i + 1}
                    </p>
                    {form.services.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeService(i)}
                        className="text-xs text-muted-foreground hover:text-destructive"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="mt-3 space-y-3">
                    <input
                      type="text"
                      value={svc.name}
                      onChange={(e) => updateService(i, { name: e.target.value })}
                      placeholder="e.g. Bridal Makeup, Event Glam, Trial Session"
                      className="w-full border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-muted-foreground">
                          Duration (minutes)
                        </label>
                        <input
                          type="number"
                          min={15}
                          step={15}
                          value={svc.durationMinutes}
                          onChange={(e) =>
                            updateService(i, { durationMinutes: parseInt(e.target.value) || 60 })
                          }
                          className="mt-1 w-full border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground">
                          Price (MYR)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={svc.priceMyr}
                          onChange={(e) =>
                            updateService(i, { priceMyr: parseInt(e.target.value) || 0 })
                          }
                          className="mt-1 w-full border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 4: Review ── */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="font-serif text-xl font-medium text-foreground">
              Review your profile
            </h2>
            <p className="text-sm text-muted-foreground">
              This is how you&apos;ll appear to clients. You can edit everything from your dashboard after publishing.
            </p>

            {/* Preview card */}
            <div className="border border-border bg-background p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif text-2xl font-medium text-foreground">
                    {form.displayName}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {form.state}{form.district ? `, ${form.district}` : ""}
                  </p>
                  {form.experience && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{form.experience} experience</p>
                  )}
                </div>
                <span className="text-sm font-medium text-accent">
                  From MYR {form.hourlyRate}/hr
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {form.specialties.map((s) => (
                  <span
                    key={s}
                    className="border border-border px-3 py-1 text-[10px] uppercase tracking-widest text-muted-foreground"
                  >
                    {s}
                  </span>
                ))}
              </div>
              {form.bio && (
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {form.bio}
                </p>
              )}
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Services
                </p>
                <div className="mt-2 space-y-1">
                  {form.services.map((s, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-foreground">
                        {s.name} · {s.durationMinutes} min
                      </span>
                      <span className="font-medium text-accent">MYR {s.priceMyr}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <p className="rounded border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              Your profile will be live immediately after publishing. Leish may
              contact you within 24 hours to verify your work.
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 1}
          className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {step < 4 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canNext}
            className="flex items-center gap-2 border border-foreground bg-foreground px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent hover:border-accent disabled:pointer-events-none disabled:opacity-30"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 border border-accent bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/80 disabled:pointer-events-none disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                Publish profile
                <Check className="h-4 w-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
