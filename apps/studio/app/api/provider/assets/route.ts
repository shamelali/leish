import { NextResponse } from "next/server"
import { getSupabaseSsrClient } from "@leish/shared/lib/auth/ssr"

export async function POST(req: Request) {
  const supabase = await getSupabaseSsrClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File
  const providerId = formData.get("providerId") as string
  const assetType = formData.get("assetType") as string || "portfolio"
  const contentType = formData.get("contentType") as string || "image"
  const beforeFile = formData.get("beforeFile") as File | null
  const videoUrl = formData.get("videoUrl") as string | null

  if (!file || !providerId) {
    return NextResponse.json({ error: "Missing file or providerId" }, { status: 400 })
  }

  const { data: provider } = await supabase
    .from("providers")
    .select("owner_id, tier")
    .eq("id", providerId)
    .single()

  if (!provider || provider.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { count: photoCount } = await supabase
    .from("provider_assets")
    .select("id", { count: "exact", head: true })
    .eq("provider_id", providerId)

  const maxPhotos = provider.tier === "pro" ? 50 : 20
  if ((photoCount ?? 0) >= maxPhotos) {
    return NextResponse.json(
      { error: `Photo limit reached. Upgrade to Pro for more.` },
      { status: 403 }
    )
  }

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

  const { data: { publicUrl } } = supabase.storage
    .from("provider-assets")
    .getPublicUrl(fileName)

  let thumbnailUrl: string | null = null
  if (contentType === "beforeAfter" && beforeFile) {
    const beforeExt = beforeFile.name.split(".").pop()
    const beforeFileName = `${providerId}/${Date.now() - 1000}_before.${beforeExt}`

    const { error: beforeUploadError } = await supabase.storage
      .from("provider-assets")
      .upload(beforeFileName, beforeFile, {
        contentType: beforeFile.type,
        upsert: false,
      })

    if (!beforeUploadError) {
      const { data: { publicUrl: beforeUrl } } = supabase.storage
        .from("provider-assets")
        .getPublicUrl(beforeFileName)
      thumbnailUrl = beforeUrl
    }
  } else if (contentType === "video" && videoUrl) {
    thumbnailUrl = videoUrl
  } else {
    thumbnailUrl = `${publicUrl}?width=400&height=400&resize=cover`
  }

  const { data: asset, error: dbError } = await supabase
    .from("provider_assets")
    .insert({
      provider_id: providerId,
      asset_type: assetType,
      url: publicUrl,
      thumbnail_url: thumbnailUrl,
      content_type: contentType,
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
  const { searchParams } = new URL(req.url)
  const providerId = searchParams.get("providerId")

  if (!providerId) {
    return NextResponse.json({ error: "Missing providerId" }, { status: 400 })
  }

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
