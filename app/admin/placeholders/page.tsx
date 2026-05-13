"use client"

import { useState } from "react"
import { DashboardShell, Panel } from "@/components/dashboard-shell"

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/providers", label: "Providers" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/moderation", label: "Moderation" },
]

type ProviderType = "artist" | "studio"

interface PlaceholderOption {
  id: string
  name: string
  description: string
  defaultImage: string
  colors: string[]
}

const PLACEHOLDER_OPTIONS: PlaceholderOption[] = [
  {
    id: "artist-default",
    name: "Artist Default",
    description: "Default placeholder for individual makeup artists",
    defaultImage: "/artists/placeholder.jpg",
    colors: ["#fce7f3", "#fbcfe8", "#f9a8d4"],
  },
  {
    id: "studio-default",
    name: "Studio Default",
    description: "Default placeholder for beauty studios",
    defaultImage: "/studios/placeholder.jpg",
    colors: ["#e0e7ff", "#c7d2fe", "#a5b4fc"],
  },
  {
    id: "team-placeholder",
    name: "Team Placeholder",
    description: "Placeholder for studio team photos",
    defaultImage: "/artists/placeholder.jpg",
    colors: ["#fef3c7", "#fde68a", "#fcd34d"],
  },
  {
    id: "portfolio-placeholder",
    name: "Portfolio Placeholder",
    description: "Placeholder for portfolio images",
    defaultImage: "/studios/placeholder.jpg",
    colors: ["#d1fae5", "#a7f3d0", "#6ee7b7"],
  },
]

export default function AdminPlaceholdersPage() {
  const [selectedType, setSelectedType] = useState<ProviderType>("artist")
  const [generatedPlaceholders, setGeneratedPlaceholders] = useState<string[]>(() => [
    "artist-john-doe-1700000000001",
    "artist-jane-smith-1700000000002",
    "studio-beauty-haven-1700000000003",
  ])
  const [providerName, setProviderName] = useState("")
  const [selectedOption, setSelectedOption] = useState<PlaceholderOption>(PLACEHOLDER_OPTIONS[0])

  const generatePlaceholder = () => {
    if (!providerName.trim()) return

    // Generate a unique placeholder identifier
    const timestamp = Date.now()
    const placeholderId = `${selectedType}-${providerName.toLowerCase().replace(/\s+/g, "-")}-${timestamp}`
    setGeneratedPlaceholders((prev) => [...prev, placeholderId])
    setProviderName("")
  }

  return (
    <DashboardShell
      title="Image Placeholders"
      subtitle="Create and manage placeholder images for providers without profile photos."
      nav={NAV}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Create New Placeholder">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Provider Type</label>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => {
                    setSelectedType("artist")
                    setSelectedOption(PLACEHOLDER_OPTIONS[0])
                  }}
                  className={`flex-1 rounded-md border px-4 py-2 text-sm transition-colors ${
                    selectedType === "artist"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:bg-accent"
                  }`}
                >
                  Artist
                </button>
                <button
                  onClick={() => {
                    setSelectedType("studio")
                    setSelectedOption(PLACEHOLDER_OPTIONS[1])
                  }}
                  className={`flex-1 rounded-md border px-4 py-2 text-sm transition-colors ${
                    selectedType === "studio"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:bg-accent"
                  }`}
                >
                  Studio
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Provider Name</label>
              <input
                type="text"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                placeholder="Enter provider name"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Placeholder Style</label>
              <div className="mt-2 space-y-2">
                {PLACEHOLDER_OPTIONS.filter(
                  (opt) =>
                    (selectedType === "artist" && opt.id.includes("artist")) ||
                    (selectedType === "studio" && opt.id.includes("studio")) ||
                    opt.id.includes("placeholder")
                ).map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedOption(option)}
                    className={`w-full rounded-md border p-3 text-left transition-colors ${
                      selectedOption.id === option.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background hover:bg-accent"
                    }`}
                  >
                    <p className="text-sm font-medium text-foreground">{option.name}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                    <div className="mt-2 flex gap-1">
                      {option.colors.map((color, idx) => (
                        <div
                          key={idx}
                          className="h-4 w-4 rounded-full border border-border"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={generatePlaceholder}
              disabled={!providerName.trim()}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Generate Placeholder
            </button>
          </div>
        </Panel>

        <Panel title="Generated Placeholders">
          <div className="space-y-4">
            {generatedPlaceholders.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No placeholders generated yet. Use the form to create one.
              </p>
            ) : (
              <div className="space-y-3">
                {generatedPlaceholders.map((placeholder, idx) => (
                  <div
                    key={`${placeholder}-${idx}`}
                    className="flex items-center justify-between border border-border bg-background p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-12 w-12 rounded-md border border-border bg-[${selectedOption.colors[idx % selectedOption.colors.length]}]`}
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {placeholder.split("-").slice(0, -1).join(" ").replace(/^\w/, (c) => c.toUpperCase())}
                        </p>
                        <p className="text-xs text-muted-foreground">{selectedOption.defaultImage}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedOption.defaultImage)
                        }}
                        className="rounded border border-border px-2 py-1 text-xs text-foreground hover:bg-accent transition-colors"
                      >
                        Copy URL
                      </button>
                      <button
                        onClick={() =>
                          setGeneratedPlaceholders((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="rounded border border-border px-2 py-1 text-xs text-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-border pt-4">
              <p className="text-sm font-medium text-foreground mb-3">Available Default Placeholders</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border border-border p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">Artist</p>
                      <p className="text-[10px] text-muted-foreground">/artists/placeholder.jpg</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-md border border-border p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                        <path d="M3 21h18" />
                        <path d="M5 21V7l8-4v18" />
                        <path d="M19 21V11l-6-4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">Studio</p>
                      <p className="text-[10px] text-muted-foreground">/studios/placeholder.jpg</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </DashboardShell>
  )
}
