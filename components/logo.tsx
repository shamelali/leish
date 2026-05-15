export function Logo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 400 120" 
      width="120" 
      height="40" 
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <rect width="400" height="120" fill="#0F0E0D" rx="12"/>
      <text x="20" y="85" fontFamily="Georgia, serif" fontSize="90" fontWeight="500" fill="#F5F0E8" letterSpacing="-2">Lei</text>
      <text x="178" y="85" fontFamily="Georgia, serif" fontSize="90" fontWeight="400" fontStyle="italic" fill="#C23B2E" letterSpacing="-2">sh!</text>
      <path d="M 370 95 L 372 100 L 377 102 L 372 104 L 370 109 L 368 104 L 363 102 L 368 100 Z" fill="#8A8279" opacity="0.6"/>
    </svg>
  )
}