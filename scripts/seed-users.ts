import "dotenv/config"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const users = [
  {
    email: "artist@example.com",
    password: "password123",
    user_metadata: { role: "artist", full_name: "Artist Owner" },
  },
  {
    email: "customer@example.com",
    password: "password123",
    user_metadata: { role: "customer", full_name: "Sample Customer" },
  },
  {
    email: "admin@example.com",
    password: "password123",
    user_metadata: { role: "admin", full_name: "Admin User" },
  },
  {
    email: "studio@example.com",
    password: "password123",
    user_metadata: { role: "studio", full_name: "Studio Owner" },
  },
]

async function main() {
  for (const u of users) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: u.user_metadata,
    })
    if (error) {
      console.error(`${u.email}: ${error.message}`)
    } else {
      console.log(`✓ ${u.email} (id: ${data.user.id})`)
    }
  }
}

main().catch(console.error)
