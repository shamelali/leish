export function formatCurrency(amount: number, currency = "MYR"): string {
  return `${currency} ${amount.toLocaleString("en-MY", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

export function formatPercentage(value: number): string {
  const sign = value > 0 ? "+" : ""
  const rounded = value.toFixed(1).replace(/\.0$/, "")
  return `${sign}${rounded}%`
}

export function formatNumber(num: number): string {
  return num.toLocaleString("en-MY")
}

export function getChangeIndicator(change: number): string {
  if (change > 0) return "↑"
  if (change < 0) return "↓"
  return "→"
}

export function calculateGrowthRate(current: number, previous: number): number {
  if (current === 0) return 0
  return ((previous - current) / current) * 100
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    completed: "green",
    canceled: "red",
    pending: "yellow",
    payment_required: "orange",
    confirmed: "blue",
    paid_deposit: "purple",
    paid_full: "purple",
    refunded: "gray",
  }
  return colors[status] || "gray"
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + "..."
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function calculateDateRange(period: "day" | "week" | "month" | "year"): { start: Date; end: Date } {
  const end = new Date()
  const start = new Date()

  switch (period) {
    case "day":
      start.setDate(start.getDate() - 1)
      break
    case "week":
      start.setDate(start.getDate() - 7)
      break
    case "month":
      start.setMonth(start.getMonth() - 1)
      break
    case "year":
      start.setFullYear(start.getFullYear() - 1)
      break
  }

  return { start, end }
}