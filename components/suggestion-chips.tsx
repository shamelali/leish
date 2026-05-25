"use client"

type SuggestionChipsProps = {
  suggestions: string[]
  onSelect: (suggestion: string) => void
}

export function SuggestionChips({ suggestions, onSelect }: SuggestionChipsProps) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          onClick={() => onSelect(suggestion)}
          className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-all hover:border-accent hover:text-foreground"
        >
          {suggestion}
        </button>
      ))}
    </div>
  )
}
