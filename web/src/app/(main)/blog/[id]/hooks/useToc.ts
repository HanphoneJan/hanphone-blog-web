'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { Heading } from '../types'

interface UseTocOptions {
  content: string
  headerHeight: number
  dispatch: React.Dispatch<any>
}

export function useToc({ content, headerHeight, dispatch }: UseTocOptions) {
  const blogContentRef = useRef<HTMLDivElement>(null)
  const isHashHandledRef = useRef(false)

  // 提取标题
  useEffect(() => {
    if (!blogContentRef.current || !content) return

    const timer = setTimeout(() => {
      const headingElements = blogContentRef.current?.querySelectorAll('h1, h2, h3, h4, h5, h6')
      const extractedHeadings: Heading[] = []

      headingElements?.forEach(heading => {
        const originalId = heading.id
        if (!originalId) return
        extractedHeadings.push({
          originalId,
          text: heading.textContent || '',
          level: parseInt(heading.tagName.substring(1))
        })
      })

      dispatch({ type: 'SET_HEADINGS', payload: extractedHeadings })
    }, 0)

    return () => clearTimeout(timer)
  }, [content, dispatch])

  // 滚动到标题 - 在中间内容区域内滚动
  const scrollToHeading = useCallback((originalId: string, updateHash: boolean = true) => {
    if (!blogContentRef.current) return

    const element = document.getElementById(originalId)
    if (element) {
      const container = blogContentRef.current
      const headerOffset = headerHeight + 24
      const elementTop = (element as HTMLElement).offsetTop - headerOffset

      container.scrollTo({
        top: Math.max(0, elementTop),
        behavior: 'smooth'
      })

      // 更新 URL hash（不触发页面跳转）
      if (updateHash && typeof window !== 'undefined') {
        const newUrl = `${window.location.pathname}#${originalId}`
        window.history.replaceState(null, '', newUrl)
      }

      if (window.innerWidth < 1024) {
        dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false })
      }
    }
  }, [headerHeight, dispatch])

  // 处理哈希跳转 / 内容变化时的滚动重置 - 在中间内容区域内滚动
  // 注意：Next.js 路由只重置 window 滚动，正文滚动发生在内部容器中，
  // 切换文章时必须显式重置，否则新文章会停留在上一篇文章的滚动位置
  useEffect(() => {
    if (typeof window === 'undefined' || !content || !blogContentRef.current) return

    const hash = window.location.hash
    if (hash && !isHashHandledRef.current) {
      const targetId = decodeURIComponent(hash.slice(1))
      if (document.getElementById(targetId)) {
        setTimeout(() => {
          // 使用 scrollToHeading 但不更新 hash（避免重复替换）
          scrollToHeading(targetId, false)
          isHashHandledRef.current = true
        }, 100)
        return
      }
      isHashHandledRef.current = true
    }

    // 无哈希（或哈希已处理/失效）时滚动到顶部
    blogContentRef.current.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [content, headerHeight, scrollToHeading])

  // 监听URL变化
  useEffect(() => {
    const handlePopState = () => {
      isHashHandledRef.current = false
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return {
    blogContentRef,
    scrollToHeading
  }
}

export default useToc