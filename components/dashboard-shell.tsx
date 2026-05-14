import Link from "next/link"
import { cn } from "@/lib/utils"

export function DashboardShell({
  title,
  subtitle,
  nav,
  children,
}: {
  title: string
  subtitle: string
  nav: { href: string; label: string; active?: boolean }[]
  children: React.ReactNode
}) {
  return (
    <section className="bg-background py-10 lg:py-14">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">Dashboard</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>

        <div className="mt-8 flex flex-wrap gap-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition-all",
                item.active
                  ? "border-accent bg-secondary text-foreground"
                  : "border-border text-muted-foreground hover:border-accent hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="mt-8">{children}</div>
      </div>
    </section>
  )
}

export function StatGrid({
  stats,
}: {
  stats: { label: string; value: string; hint: string }[]
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="border border-border bg-card p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</p>
          <p className="mt-2 font-serif text-2xl font-semibold text-foreground">{s.value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>
        </div>
      ))}
    </div>
  )
}

export function Panel({
  title,
  children,
  action,
}: {
  title: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-serif text-xl font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  )
}

