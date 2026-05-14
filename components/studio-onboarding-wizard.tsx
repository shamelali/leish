"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react"

const SPECIALTIES = ["Bridal", "Event", "Natural", "Photoshoot", "SFX", "Lessons"] as const
const STUDIO_TYPES = ["Bridal Suite", "Creative Studio", "Multi-Service Salon", "Home Studio"] as const
const TEAM_SIZES = ["Solo (just me)", "2–5 artists", "6–10 artists", "10+ artists"] as const
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

interface ServiceInput {
  name: string
  durationMinutes: number
  priceMyr: number
}

interface FormData {
  // Step 1 — Studio Details
  studioName: string
  studioType: string
  state: string
  district: string
  address: string
  bio: string
  // Step 2 — Team & Specialties
  specialties: string[]
  teamSize: string
  startingRate: string
  // Step 3 — Services
  services: ServiceInput[]
  // Step 4 — Operating Hours (simplified for MVP)
  operatingHours: string
}

const STEPS = [
  { label: "Studio", number: 1 },
  { label: "Team", number: 2 },
  { label: "Services", number: 3 },
  { label: "Hours", number: 4 },
  { label: "Review", number: 5 },
]

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60)
}

export function StudioOnboardingWizard({
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
    studioName: initialName,
    studioType: "",
    state: "",
    district: "",
    address: "",
    bio: "",
    specialties: [],
    teamSize: "",
    startingRate: "",
    services: [{ name: "", durationMinutes: 60, priceMyr: 0 }],
    operatingHours: "Mon–Fri: 9am–7pm, Sat–Sun: 9am–5pm",
  })

  const update = (patch: Partial<FormData>) => setForm((f) => ({ ...f, ...patch }))

  const step1Valid =
    form.studioName.trim().length >= 2 &&
    form.studioType.length > 0 &&
    form.state.length > 0 &&
    form.district.trim().length > 0

  const step2Valid = form.specialties.length > 0 && form.teamSize.length > 0 && Number(form.startingRate) > 0

  const step3Valid =
    form.services.length > 0 &&
    form.services.every((s) => s.name.trim().length > 0 && s.durationMinutes > 0 && s.priceMyr > 0)

  const step4Valid = form.operatingHours.trim().length > 0

  const canNext =
    (step === 1 && step1Valid) ||
    (step === 2 && step2Valid) ||
    (step === 3 && step3Valid) ||
    (step === 4 && step4Valid) ||
    step === 5

  const addService = () =>
    update({ services: [...form.services, { name: "", durationMinutes: 60, priceMyr: 0 }] })

  const updateService = (i: number, patch: Partial<ServiceInput>) => {
    const next = form.services.map((s, idx) => (idx === i ? { ...s, ...patch } : s))
    update({ services: next })
  }

  const removeService = (i: number) =>
    update({ services: form.services.filter((_, idx) => idx !== i) })

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)

    const baseSlug = slugify(form.studioName)
    const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`

    try {
      const res = await fetch("/api/onboarding/studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          slug,
          studioName: form.studioName.trim(),
          studioType: form.studioType,
          state: form.state,
          district: form.district.trim(),
          address: form.address.trim(),
          bio: form.bio.trim(),
          specialties: form.specialties,
          teamSize: form.teamSize,
          startingRate: Number(form.startingRate),
          services: form.services,
          operatingHours: form.operatingHours.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create studio")

      router.replace("/studios/dashboard?onboarded=1")
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
          Studio Setup
        </p>
        <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          List your studio
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Complete all steps to publish your studio and start receiving bookings from clients.
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

      <div className="border border-border bg-card p-6 sm:p-8">

        {/* ── Step 1: Studio Details ── */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-serif text-xl font-medium text-foreground">Studio details</h2>
            <div>
              <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Studio name <span className="text-accent">*</span>
              </label>
              <input
                type="text"
                value={form.studioName}
                onChange={(e) => update({ studioName: e.target.value })}
                placeholder="e.g. Glamour Studio KL"
                className="mt-2 w-full border border-border bg-background min-h-11 px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Studio type <span className="text-accent">*</span>
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {STUDIO_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => update({ studioType: t })}
                    className={`border px-4 py-2.5 text-xs font-medium text-left transition-colors ${
                      form.studioType === t
                        ? "border-foreground bg-foreground text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-accent"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  State <span className="text-accent">*</span>
                </label>
                <select
                  value={form.state}
                  onChange={(e) => update({ state: e.target.value })}
                  className="mt-2 w-full border border-border bg-background min-h-11 px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
                >
                  <option value="">Select state</option>
                  {STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
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
                  placeholder="e.g. Mont Kiara"
                  className="mt-2 w-full border border-border bg-background min-h-11 px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Street address
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => update({ address: e.target.value })}
                placeholder="e.g. No 12, Jalan Kiara 3, Mont Kiara"
                className="mt-2 w-full border border-border bg-background min-h-11 px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                About your studio
              </label>
              <textarea
                value={form.bio}
                onChange={(e) => update({ bio: e.target.value.slice(0, 500) })}
                rows={3}
                placeholder="Describe your studio — what makes it special, what clients can expect..."
                className="mt-2 w-full resize-none border border-border bg-background min-h-11 px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
              />
              <p className="mt-1 text-right text-xs text-muted-foreground">
                {form.bio.length} / 500
              </p>
            </div>
          </div>
        )}

        {/* ── Step 2: Team & Specialties ── */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-serif text-xl font-medium text-foreground">Team & specialties</h2>
            <div>
              <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Specialties <span className="text-accent">*</span>
              </label>
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
                Team size <span className="text-accent">*</span>
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {TEAM_SIZES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => update({ teamSize: t })}
                    className={`border px-4 py-2.5 text-xs font-medium text-left transition-colors ${
                      form.teamSize === t
                        ? "border-foreground bg-foreground text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-accent"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Starting rate (MYR / session) <span className="text-accent">*</span>
              </label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  MYR
                </span>
                <input
                  type="number"
                  min={0}
                  value={form.startingRate}
                  onChange={(e) => update({ startingRate: e.target.value })}
                  placeholder="300"
                  className="w-full border border-border bg-background py-2.5 pl-14 pr-3 text-sm text-foreground focus:border-accent focus:outline-none"
                />
              </div>
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
                      placeholder="e.g. Full Bridal Package, Bridesmaid Glam"
                      className="w-full border border-border bg-card min-h-11 px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-muted-foreground">Duration (minutes)</label>
                        <input
                          type="number"
                          min={15}
                          step={15}
                          value={svc.durationMinutes}
                          onChange={(e) => updateService(i, { durationMinutes: parseInt(e.target.value) || 60 })}
                          className="mt-1 w-full border border-border bg-card min-h-11 px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground">Price (MYR)</label>
                        <input
                          type="number"
                          min={0}
                          value={svc.priceMyr}
                          onChange={(e) => updateService(i, { priceMyr: parseInt(e.target.value) || 0 })}
                          className="mt-1 w-full border border-border bg-card min-h-11 px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 4: Operating Hours ── */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="font-serif text-xl font-medium text-foreground">Operating hours</h2>
            <p className="text-sm text-muted-foreground">
              Let clients know when your studio is available. You can set detailed availability slots from your dashboard after publishing.
            </p>
            <div>
              <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground">
                General hours <span className="text-accent">*</span>
              </label>
              <textarea
                value={form.operatingHours}
                onChange={(e) => update({ operatingHours: e.target.value })}
                rows={4}
                placeholder="e.g. Mon–Fri: 9am–7pm&#10;Sat–Sun: 9am–5pm&#10;Public holidays: Closed"
                className="mt-2 w-full resize-none border border-border bg-background min-h-11 px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                You can manage bookable time slots from the studio dashboard after publishing.
              </p>
            </div>
          </div>
        )}

        {/* ── Step 5: Review ── */}
        {step === 5 && (
          <div className="space-y-6">
            <h2 className="font-serif text-xl font-medium text-foreground">Review your listing</h2>
            <p className="text-sm text-muted-foreground">
              Your studio listing is ready to publish. You can edit everything from the studio dashboard.
            </p>

            <div className="border border-border bg-background p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif text-2xl font-medium text-foreground">{form.studioName}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {form.studioType} · {form.state}{form.district ? `, ${form.district}` : ""}
                  </p>
                  {form.address && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{form.address}</p>
                  )}
                </div>
                <span className="text-sm font-medium text-accent">
                  From MYR {form.startingRate}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {form.specialties.map((s) => (
                  <span key={s} className="border border-border px-3 py-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                    {s}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                <span>Team: {form.teamSize}</span>
              </div>
              {form.bio && (
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{form.bio}</p>
              )}
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Services</p>
                <div className="mt-2 space-y-1">
                  {form.services.map((s, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-foreground">{s.name} · {s.durationMinutes} min</span>
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
              Studio listings are reviewed by the Leish team before going live. We&apos;ll confirm within 24–48 hours.
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

        {step < 5 ? (
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
                Submitting...
              </>
            ) : (
              <>
                Submit studio
                <Check className="h-4 w-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
