import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const TEST_CUSTOMER_ID = "22222222-2222-2222-2222-222222222222"
const TEST_PROVIDER_ID = "11111111-1111-1111-1111-111111111111"
const REAL_ARTIST_ID = "11111111-1111-1111-1111-111111111111"

async function seed() {
  console.log("Seeding test services & slots...")

  try {
    // Insert services for seeded artist (11111111...)
    const { error: serviceError1 } = await supabase.from("services").insert({
      provider_id: TEST_PROVIDER_ID,
      name: "Test Makeup Service",
      price_myr: 25000,
      duration_minutes: 60,
      is_active: true,
    })
    if (serviceError1) console.log("Service 1:", serviceError1.message)

    const { error: serviceError2 } = await supabase.from("services").insert({
      provider_id: TEST_PROVIDER_ID,
      name: "Bridal Makeup",
      price_myr: 35000,
      duration_minutes: 90,
      is_active: true,
    })
    if (serviceError2) console.log("Service 2:", serviceError2.message)

    // Insert availability slots
    for (let i = 1; i <= 3; i++) {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + i + 1)
      futureDate.setHours(10 + i, 0, 0, 0)

      const { error: slotError } = await supabase.from("availability_slots").insert({
        provider_id: REAL_ARTIST_ID,
        starts_at: futureDate.toISOString(),
        ends_at: new Date(futureDate.getTime() + 30 * 60 * 1000).toISOString(),
        is_booked: false,
      })
      if (slotError) console.log(`Slot ${i}:`, slotError.message)
    }

    console.log("\n✅ Seed complete!")
    console.log(`Artist ID (seeded): ${TEST_PROVIDER_ID}`)
    console.log(`Customer ID (seeded): ${TEST_CUSTOMER_ID}`)
  } catch (err) {
    console.error("Seed error:", err)
    process.exit(1)
  }

  process.exit(0)
}

seed()