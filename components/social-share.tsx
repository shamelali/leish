"use client"

import { useState } from "react"
import { Share2, Facebook, Twitter, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/lib/hooks/use-toast"
import { useTranslation } from "@/lib/i18n/language-context"

interface SocialShareProps {
  url: string
  title: string
  description?: string
  image?: string
  hashtags?: string[]
}

export function SocialShare({ url, title, description, hashtags = [] }: SocialShareProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()
  const { lang } = useTranslation()

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}${url}` : url
  const shareText = description || title

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}&hashtags=${hashtags.join(",")}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast({
        title: lang === "ms" ? "Pautan disalin!" : "Link copied!",
        description: lang === "ms" ? "Pautan telah disalin ke papan keratan" : "The link has been copied to your clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({
        title: lang === "ms" ? "Ralat" : "Error",
        description: lang === "ms" ? "Gagal menyalin pautan" : "Failed to copy link",
        variant: "destructive",
      })
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: shareUrl,
        })
      } catch {
        // User cancelled or share failed, fallback to copy
        handleCopyLink()
      }
    } else {
      handleCopyLink()
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Native Share / Copy Link */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleNativeShare}
        className="flex items-center gap-2"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <Share2 className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">
          {copied
            ? (lang === "ms" ? "Disalin!" : "Copied!")
            : (lang === "ms" ? "Kongsi" : "Share")
          }
        </span>
      </Button>

      {/* Social Media Links */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open(shareLinks.facebook, "_blank")}
          className="h-8 w-8 p-0"
          title={lang === "ms" ? "Kongsi di Facebook" : "Share on Facebook"}
        >
          <Facebook className="h-4 w-4 text-blue-600" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open(shareLinks.twitter, "_blank")}
          className="h-8 w-8 p-0"
          title={lang === "ms" ? "Kongsi di Twitter" : "Share on Twitter"}
        >
          <Twitter className="h-4 w-4 text-blue-400" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open(shareLinks.whatsapp, "_blank")}
          className="h-8 w-8 p-0"
          title={lang === "ms" ? "Kongsi di WhatsApp" : "Share on WhatsApp"}
        >
          <svg className="h-4 w-4 text-green-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
          </svg>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyLink}
          className="h-8 w-8 p-0"
          title={lang === "ms" ? "Salin pautan" : "Copy link"}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}