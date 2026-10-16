import { useState, useEffect } from 'react'

/** Responsive breakpoints matching modern mobile-first design */
export const breakpoints = {
  sm: 640,   // Small phones
  md: 768,   // Tablets
  lg: 1024,  // Small laptops
  xl: 1280,  // Desktops
} as const

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') return window.matchMedia(query).matches
    return false
  })

  useEffect(() => {
    const mql = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', handler)
    setMatches(mql.matches)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}

/** Convenience hook returning all breakpoint states */
export function useResponsive() {
  const isMobile = !useMediaQuery(`(min-width: ${breakpoints.md}px)`)
  const isTablet = useMediaQuery(`(min-width: ${breakpoints.md}px)`) && !useMediaQuery(`(min-width: ${breakpoints.lg}px)`)
  const isDesktop = useMediaQuery(`(min-width: ${breakpoints.lg}px)`)
  const isWide = useMediaQuery(`(min-width: ${breakpoints.xl}px)`)
  return { isMobile, isTablet, isDesktop, isWide }
}
