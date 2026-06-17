"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react"
import { DashboardShell, Panel } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useTranslation } from "@/lib/i18n/language-context"

interface Room {
  id: string
  studio_id: string
  name: string
  description: string | null
  capacity: string | null
  price_per_hour: number
  is_active: boolean
  sort_order: number
}

const defaultRoom: Room = {
  id: "",
  studio_id: "",
  name: "",
  description: "",
  capacity: "",
  price_per_hour: 0,
  is_active: true,
  sort_order: 0,
}

// eslint-disable-next-line sonarjs/cognitive-complexity
export default function StudioRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Room>(defaultRoom)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const { lang } = useTranslation()

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/studio/rooms")
        if (res.ok && !cancelled) {
          const data = await res.json()
          setRooms(data.rooms || [])
        }
      } catch {
        if (!cancelled) console.error("Failed to fetch rooms")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const openNew = () => {
    setEditing(defaultRoom)
    setDialogOpen(true)
  }

  const openEdit = (room: Room) => {
    setEditing({ ...room })
    setDialogOpen(true)
  }

  const saveRoom = async () => {
    setSaving(true)
    try {
      const isNew = !editing.id
      const url = isNew ? "/api/studio/rooms" : `/api/studio/rooms/${editing.id}`
      const res = await fetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editing.name,
          description: editing.description || null,
          capacity: editing.capacity || null,
          price_per_hour: editing.price_per_hour,
        }),
      })
      if (!res.ok) return
      setDialogOpen(false)
      const reload = await fetch("/api/studio/rooms")
      if (!reload.ok) return
      const data = await reload.json()
      setRooms(data.rooms || [])
    } catch (error) {
      console.error("Failed to save room:", error)
    } finally {
      setSaving(false)
    }
  }

  const deleteRoom = async (id: string) => {
    const msg = lang === "ms" ? "Padamkan bilik ini?" : "Delete this room?"
    if (!confirm(msg)) return
    try {
      const res = await fetch(`/api/studio/rooms/${id}`, { method: "DELETE" })
      if (res.ok) setRooms((prev) => prev.filter((r) => r.id !== id))
    } catch (error) {
      console.error("Failed to delete room:", error)
    }
  }

  const nav = [
    { href: "/studio/dashboard", label: "Overview" },
    { href: "/studio/rooms", label: "Rooms", active: true },
    { href: "/studio/photos", label: "Photos" },
  ]

  let dialogTitle: string
  if (editing.id) {
    dialogTitle = lang === "ms" ? "Edit Bilik" : "Edit Room"
  } else {
    dialogTitle = lang === "ms" ? "Bilik Baru" : "New Room"
  }

  let saveLabel: string
  if (saving) {
    saveLabel = lang === "ms" ? "Menyimpan..." : "Saving..."
  } else {
    saveLabel = lang === "ms" ? "Simpan" : "Save"
  }

  return (
    <DashboardShell
      title={lang === "ms" ? "Pengurusan Bilik" : "Room Management"}
      subtitle={lang === "ms" ? "Urus bilik dan ruang studio anda" : "Manage your studio rooms and spaces"}
      nav={nav}
    >
      <Panel
        title={lang === "ms" ? "Bilik" : "Rooms"}
        action={
          <Button size="sm" onClick={openNew}>
            <Plus className="h-4 w-4 mr-1" />
            {lang === "ms" ? "Tambah" : "Add Room"}
          </Button>
        }
      >
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse bg-muted rounded" />
            ))}
          </div>
        ) : null}
        {!loading && rooms.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {lang === "ms"
                ? "Tiada bilik lagi. Tambah bilik pertama anda."
                : "No rooms yet. Add your first room."}
            </p>
          </div>
        ) : null}
        {!loading && rooms.length > 0 ? (
          <div className="space-y-2">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="flex items-center gap-3 border border-border bg-background p-4"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {room.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {room.capacity && `${room.capacity} · `}
                    MYR {room.price_per_hour}/hr
                    {room.description && ` · ${room.description}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEdit(room)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => deleteRoom(room.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </Panel>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                {lang === "ms" ? "Nama" : "Name"}
              </label>
              <Input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder={lang === "ms" ? "Cth: Studio Utama" : "e.g. Main Studio"}
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                {lang === "ms" ? "Penerangan" : "Description"}
              </label>
              <Textarea
                value={editing.description || ""}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                placeholder={lang === "ms" ? "Terangkan bilik ini..." : "Describe this room..."}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">
                  {lang === "ms" ? "Kapasiti" : "Capacity"}
                </label>
                <Input
                  value={editing.capacity || ""}
                  onChange={(e) => setEditing({ ...editing, capacity: e.target.value })}
                  placeholder="e.g. 10 people"
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  {lang === "ms" ? "Harga (MYR/jam)" : "Price (MYR/hr)"}
                </label>
                <Input
                  type="number"
                  value={editing.price_per_hour}
                  onChange={(e) =>
                    setEditing({ ...editing, price_per_hour: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                {lang === "ms" ? "Batal" : "Cancel"}
              </Button>
              <Button onClick={saveRoom} disabled={saving || !editing.name}>
                {saveLabel}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
