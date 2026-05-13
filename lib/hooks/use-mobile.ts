'use client'

import * as React from 'react'

export function useIsMobile(breakpoint = 768) {
  const subscribe = React.useCallback(
    (callback: () => void) => {
      const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
      mql.addEventListener('change', callback)
      return () => mql.removeEventListener('change', callback)
    },
    [breakpoint],
  )

  const getSnapshot = React.useCallback(() => {
    return window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches
  }, [breakpoint])

  const isMobile = React.useSyncExternalStore(subscribe, getSnapshot, () => false)

  return isMobile
}