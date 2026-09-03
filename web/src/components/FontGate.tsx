'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { beginGate, endGate, settleFonts } from '@/lib/font-gate'

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export default function FontGate() {
  const pathname = usePathname()
  const mounted = useRef(false)

  useIsoLayoutEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    beginGate()
    let cancelled = false
    void settleFonts(1500).finally(() => {
      if (!cancelled) endGate()
    })
    return () => {
      cancelled = true
      endGate()
    }
  }, [pathname])

  return null
}
