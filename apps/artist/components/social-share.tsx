"use client"

export function SocialShare({ url, title, description, hashtags }: { url: string; title: string; description: string; hashtags: string[] }) {
  const shareText = `${title} - ${description}`
  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText + " " + url)}`, "_blank")} className="border border-border px-3 py-1.5 text-xs hover:border-accent">WhatsApp</button>
      <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank")} className="border border-border px-3 py-1.5 text-xs hover:border-accent">Facebook</button>
      <button onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}&hashtags=${encodeURIComponent(hashtags.join(","))}`, "_blank")} className="border border-border px-3 py-1.5 text-xs hover:border-accent">X</button>
      <button onClick={() => { navigator.clipboard.writeText(url) }} className="border border-border px-3 py-1.5 text-xs hover:border-accent">Copy link</button>
    </div>
  )
}
