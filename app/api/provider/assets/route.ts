import { NextResponse } from "next/server"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"

export async function POST(req: Request) {
  const supabase = await getSupabaseSsrClient()
  if (!supabase) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  // Verify provider ownership
  const formData = await req.formData()
  const file = formData.get("file") as File
  const providerId = formData.get("providerId") as string
  const assetType = formData.get("assetType") as string || "portfolio"

  if (!file || !providerId) {
    return NextResponse.json({ error: "Missing file or providerId" }, { status: 400 })
  }

  // Verify ownership
  const { data: provider } = await supabase
    .from("providers")
    .select("owner_id, tier")
    .eq("id", providerId)
    .single()

  if (!provider || provider.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Check tier limits
  const { data: photoCount } = await supabase
    .from("provider_assets")
    .select("id", { count: "exact" })
    .eq("provider_id", providerId)

  const maxPhotos = provider.tier === "pro" ? 50 : 20
  if ((photoCount?.length || 0) >= maxPhotos) {
    return NextResponse.json(
      { error: `Photo limit reached. Upgrade to Pro for more.` },
      { status: 403 }
    )
  }

  // Upload to Supabase Storage
  const fileExt = file.name.split(".").pop()
  const fileName = `${providerId}/${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from("provider-assets")
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error("[provider-assets] upload error:", uploadError)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from("provider-assets")
    .getPublicUrl(fileName)

  // Create thumbnail URL (for images)
  const thumbnailUrl = `${publicUrl}?width=400&height=400&resize=cover`

  // Save to database
  const { data: asset, error: dbError } = await supabase
    .from("provider_assets")
    .insert({
      provider_id: providerId,
      asset_type: assetType,
      url: publicUrl,
      thumbnail_url: thumbnailUrl,
      file_size: file.size,
      mime_type: file.type,
    })
    .select()
    .single()

  if (dbError) {
    console.error("[provider-assets] db error:", dbError)
    return NextResponse.json({ error: "Failed to save asset" }, { status: 500 })
  }

  return NextResponse.json({ 
    success: true, 
    url: publicUrl,
    thumbnailUrl,
    id: asset.id 
  })
}

export async function GET(req: Request) {
  const supabase = await getSupabaseSsrClient()
  if (!supabase) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const providerId = searchParams.get("providerId")

  if (!providerId) {
    return NextResponse.json({ error: "Missing providerId" }, { status: 400 })
  }

  // Verify ownership
  const { data: { user } } = await supabase.auth.getUser()
  const { data: provider } = await supabase
    .from("providers")
    .select("owner_id")
    .eq("id", providerId)
    .single()

  if (!provider || provider.owner_id !== user?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { data: assets, error } = await supabase
    .from("provider_assets")
    .select("*")
    .eq("provider_id", providerId)
    .order("is_primary", { ascending: false })
    .order("uploaded_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 })
  }

  return NextResponse.json({ assets })
}