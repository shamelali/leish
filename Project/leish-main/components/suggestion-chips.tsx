"use client"

export function SuggestionChips({
  suggestions,
  onSelect,
}: {
  suggestions: string[]
  onSelect: (suggestion: string) => void
}) {
  if (!suggestions.length) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          onClick={() => onSelect(suggestion)}
          className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-accent hover:text-accent"
        >
          {suggestion}
        </button>
      ))}
    </div>
  )
}
