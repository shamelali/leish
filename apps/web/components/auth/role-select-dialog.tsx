"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { User, Palette, Building2 } from "lucide-react"
import type { UserRole } from "@/lib/routing"

const roles: { value: UserRole; label: string; description: string; icon: typeof User }[] = [
  { value: "customer", label: "Customer", description: "Book makeup artists and studios", icon: User },
  { value: "artist", label: "Makeup Artist", description: "List services and accept bookings", icon: Palette },
  { value: "studio", label: "Studio Owner", description: "Manage a studio and its artists", icon: Building2 },
]

export function RoleSelectDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (role: UserRole) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Continue with Google</DialogTitle>
          <DialogDescription>
            Select how you want to use Leish
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          {roles.map((r) => {
            const Icon = r.icon
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => onSelect(r.value)}
                className="flex items-center gap-4 rounded-lg border border-input bg-background p-4 text-left transition-colors hover:border-primary hover:bg-primary/5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{r.label}</div>
                  <div className="text-sm text-muted-foreground">{r.description}</div>
                </div>
              </button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
