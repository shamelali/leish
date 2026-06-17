'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface DynamicHoverCardProps {
  children: React.ReactNode
  className?: string
  revealContent?: React.ReactNode
  revealPosition?: 'top' | 'bottom' | 'left' | 'right'
  revealAnimation?: 'slide' | 'fade' | 'scale' | 'flip'
  gradient?: 'aurora' | 'ocean' | 'sunset' | 'forest' | 'rose' | 'violet' | 'none'
  showRevealOnHover?: boolean
}

const gradientStyles = {
  aurora: 'bg-linear-to-br from-emerald-200 via-cyan-200 to-blue-300 dark:from-emerald-900 dark:via-cyan-900 dark:to-blue-900',
  ocean: 'bg-linear-to-br from-blue-300 via-teal-200 to-cyan-300 dark:from-blue-900 dark:via-teal-900 dark:to-cyan-900',
  sunset: 'bg-linear-to-br from-orange-300 via-pink-200 to-rose-300 dark:from-orange-900 dark:via-pink-900 dark:to-rose-900',
  forest: 'bg-linear-to-br from-green-200 via-emerald-200 to-teal-300 dark:from-green-900 dark:via-emerald-900 dark:to-teal-900',
  rose: 'bg-linear-to-br from-rose-300 via-pink-200 to-fuchsia-300 dark:from-rose-900 dark:via-pink-900 dark:to-fuchsia-900',
  violet: 'bg-linear-to-br from-violet-300 via-purple-200 to-fuchsia-300 dark:from-violet-900 dark:via-purple-900 dark:to-fuchsia-900',
  none: '',
}

const revealPositionStyles = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-3',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-3',
  left: 'right-full top-1/2 -translate-y-1/2 mr-3',
  right: 'left-full top-1/2 -translate-y-1/2 ml-3',
}

const revealAnimationStyles = {
  slide: {
    top: 'animate-slide-in-top',
    bottom: 'animate-slide-in-bottom',
    left: 'animate-slide-in-left',
    right: 'animate-slide-in-right',
  },
  fade: 'animate-fade-in',
  scale: {
    top: 'animate-scale-in-bottom',
    bottom: 'animate-scale-in-bottom',
    left: 'animate-scale-in-left',
    right: 'animate-scale-in-right',
  },
  flip: {
    top: 'animate-flip-in-top',
    bottom: 'animate-flip-in-bottom',
    left: 'animate-flip-in-left',
    right: 'animate-flip-in-right',
  },
}

function DynamicHoverCard({
  children,
  className,
  revealContent,
  revealPosition = 'bottom',
  revealAnimation = 'slide',
  gradient = 'aurora',
  showRevealOnHover = true,
}: DynamicHoverCardProps) {
  const [isHovered, setIsHovered] = React.useState(false)

  return (
    <div
      className={cn('relative inline-block', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card Content */}
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border border-border/50 transition-all duration-300',
          'hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/20',
          isHovered && 'scale-[1.02]'
        )}
      >
        {/* Gradient Background */}
        {gradient !== 'none' && (
          <div
            className={cn(
              'absolute inset-0 opacity-0 transition-opacity duration-500',
              gradientStyles[gradient],
              isHovered && 'opacity-100'
            )}
          />
        )}
        
        {/* Content Layer */}
        <div className="relative z-10">
          {children}
        </div>
        
        {/* Shine Effect on Hover */}
        {isHovered && (
          <div
            className={cn(
              'pointer-events-none absolute inset-0 z-20',
              'bg-linear-to-tr from-white/0 via-white/20 to-white/0',
              'animate-shine'
            )}
          />
        )}
      </div>

      {/* Reveal Content */}
      {showRevealOnHover && revealContent && (
        <div
          className={cn(
            'absolute z-50 w-72 origin-center opacity-0 transition-all duration-300 ease-out',
            revealPositionStyles[revealPosition],
            typeof revealAnimationStyles[revealAnimation] === 'object' 
              ? revealAnimationStyles[revealAnimation][revealPosition]
              : revealAnimationStyles[revealAnimation],
            isHovered && 'opacity-100 visible'
          )}
        >
          <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-2xl">
            {revealContent}
          </div>
        </div>
      )}
    </div>
  )
}

// Card Header Component
function DynamicHoverCardHeader({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('p-4 pb-0', className)}>
      {children}
    </div>
  )
}

// Card Content Component
function DynamicHoverCardContent({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('p-4', className)}>
      {children}
    </div>
  )
}

// Card Footer Component
function DynamicHoverCardFooter({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-2 p-4 pt-0', className)}>
      {children}
    </div>
  )
}

// Avatar Component for the card
function DynamicHoverCardAvatar({
  src,
  alt,
  fallback,
  className,
}: {
  src?: string
  alt?: string
  fallback?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-primary/20 to-primary/10',
        className
      )}
    >
      {src ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src}
          alt={alt || ''}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-sm font-medium text-primary">
          {fallback || '?'}
        </span>
      )}
    </div>
  )
}

// Stat Badge Component
function DynamicHoverCardStat({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | number
  icon?: React.ElementType
}) {
  return (
    <div className="flex items-center gap-1.5">
      {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  )
}

export {
  DynamicHoverCard,
  DynamicHoverCardHeader,
  DynamicHoverCardContent,
  DynamicHoverCardFooter,
  DynamicHoverCardAvatar,
  DynamicHoverCardStat,
  gradientStyles,
}
