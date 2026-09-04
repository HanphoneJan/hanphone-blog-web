'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

/**
 * 路由变化时重置 window 滚动到顶部。
 *
 * 背景：Next.js 在 commit 时的滚动重置并非在所有导航流中都生效（实测
 * links/about 等页面互跳时零滚动调用），window 滚动位置会残留到新页面。
 * 此前部分页面依赖各自的 mount 回顶掩盖了该问题。
 *
 * 后退/前进（popstate）时不重置：浏览器会恢复历史条目的滚动位置，
 * 强制回顶会破坏该恢复行为。
 */
export function ScrollReset() {
  const pathname = usePathname()
  const isPopRef = useRef(false)

  useEffect(() => {
    const onPop = () => { isPopRef.current = true }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    if (isPopRef.current) {
      // 后退/前进：交给浏览器恢复滚动位置
      isPopRef.current = false
      return
    }
    window.scrollTo({ top: 0, left: 0 })
  }, [pathname])

  return null
}
