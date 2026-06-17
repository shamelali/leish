import Image from "next/image"

export function Logo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="Leish"
      width={1440}
      height={720}
      className={className}
      priority
    />
  )
}