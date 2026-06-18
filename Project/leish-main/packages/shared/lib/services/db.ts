import { getSupabaseServerClient } from "../auth/server"

export async function getUser() {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) return null
  return data.user
}

export function validateBookingTransition(current: string, next: string) {
  const allowed: Record<string, string[]> = {
    pending: ["payment_required", "canceled"],
    payment_required: ["confirmed", "canceled"],
    confirmed: ["paid_deposit", "paid_full", "canceled"],
    paid_deposit: ["completed", "canceled"],
    paid_full: ["completed", "refunded"],
    completed: [],
    canceled: [],
    refunded: [],
  }
  if (current === next) return true
  if (!allowed[current] || !allowed[current].includes(next)) {
    throw new Error(`invalid transition ${current} -> ${next}`)
  }
  return true
}
