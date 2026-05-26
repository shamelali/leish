import "dotenv/config"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  const emails = ["admin@example.com", "artist@example.com", "customer@example.com", "studio@example.com"]

  for (const email of emails) {
    const { data: users, error } = await supabase.auth.admin.listUsers()
    if (error) { console.error(error); return }
    const user = users.users.find(u => u.email === email)
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", user.id)
        .maybeSingle()
      console.log(`${email}: auth=✓  profile=${profile ? `${profile.role} (${profile.full_name})` : '✗ MISSING'}`)
    } else {
      console.log(`${email}: auth=✗ NOT FOUND`)
    }
  }
}

main().catch(console.error)
