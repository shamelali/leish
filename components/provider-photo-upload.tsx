"use client"

import { useState, useCallback } from "react"
import Image from "next/image"
import { Upload, X, Loader2, ImageIcon } from "lucide-react"

interface ProviderPhotoUploadProps {
  providerId: string
  onUploadComplete?: (urls: string[]) => void
  maxFiles?: number
  acceptedTypes?: string
}

export function ProviderPhotoUpload({
  providerId,
  onUploadComplete,
  maxFiles = 10,
  acceptedTypes = "image/*",
}: ProviderPhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previews, setPreviews] = useState<{ file: File; preview: string }[]>([])

  const validateFile = (file: File): boolean => {
    if (file.size > 5 * 1024 * 1024) {
      setError(`${file.name} is too large. Max size is 5MB.`)
      return false
    }
    
    if (!file.type.startsWith("image/")) {
      setError(`${file.name} is not an image file.`)
      return false
    }
    
    return true
  }

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (files.length + previews.length > maxFiles) {
      setError(`You can only upload up to ${maxFiles} images.`)
      return
    }

    const validFiles: { file: File; preview: string }[] = []
    
    files.forEach((file) => {
      if (validateFile(file)) {
        const reader = new FileReader()
        reader.onloadend = () => {
          validFiles.push({ file, preview: reader.result as string })
          if (validFiles.length === files.filter(validateFile).length) {
            setPreviews((prev) => [...prev, ...validFiles])
            setError(null)
          }
        }
        reader.readAsDataURL(file)
      }
    })
  }, [previews.length, maxFiles])

  const removePreview = (index: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (previews.length === 0) return

    setUploading(true)
    setError(null)

    try {
      const uploadedUrls: string[] = []

      for (const { file } of previews) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("providerId", providerId)
        formData.append("assetType", "portfolio")

        const res = await fetch("/api/provider/assets", {
          method: "POST",
          body: formData,
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || `Failed to upload ${file.name}`)
        }

        const data = await res.json()
        uploadedUrls.push(data.url)
      }

      setPreviews([])
      onUploadComplete?.(uploadedUrls)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded border border-destructive/20 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Upload area */}
      {previews.length < maxFiles && (
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-background p-6 transition-colors hover:border-accent hover:bg-accent/5">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <span className="mt-2 text-sm font-medium text-foreground">
            Click to upload photos
          </span>
          <span className="mt-1 text-xs text-muted-foreground">
            or drag and drop
          </span>
          <span className="mt-1 text-xs text-muted-foreground">
            Max 5MB per image, up to {maxFiles} images
          </span>
          <input
            type="file"
            accept={acceptedTypes}
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
      )}

      {/* Preview grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {previews.map(({ preview }, index) => (
            <div key={index} className="relative aspect-square">
              <Image
                src={preview}
                alt={`Preview ${index + 1}`}
                width={200}
                height={200}
                className="h-full w-full rounded-lg object-cover"
                unoptimized
              />
              <button
                onClick={() => removePreview(index)}
                disabled={uploading}
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white shadow-sm transition-colors hover:bg-destructive/90"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {previews.length > 0 && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-accent bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-60"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading {previews.length} image{previews.length > 1 ? "s" : ""}...
            </>
          ) : (
            <>
              <ImageIcon className="h-4 w-4" />
              Upload {previews.length} image{previews.length > 1 ? "s" : ""}
            </>
          )}
        </button>
      )}
    </div>
  )
}
