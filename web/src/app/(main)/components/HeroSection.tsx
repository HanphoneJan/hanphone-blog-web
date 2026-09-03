'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { ASSETS, STORAGE_KEYS, HOME_CONFIG } from '@/lib/constants'
import  BgOverlay  from './BgOverlay'

export function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const scrollIndicatorRef = useRef<HTMLDivElement>(null)
  const tickingRef = useRef(false)
  const [bgImage, setBgImage] = useState<string>(ASSETS.BACKGROUND_WEBP)
  const [subtitleText, setSubtitleText] = useState('')
  const [showCursor, setShowCursor] = useState(false)
  const [fontsReady, setFontsReady] = useState(false)

  // 加载用户设置的背景图片
  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = localStorage.getItem(STORAGE_KEYS.BACKGROUND_CUSTOM)
    if (!raw || raw === 'default') {
      setBgImage(ASSETS.BACKGROUND_WEBP)
    } else if (raw.startsWith('url:')) {
      setBgImage(raw.slice(4))
    } else if (raw.startsWith('data:image')) {
      setBgImage(raw)
    }

    // 监听背景图变化
    const handler = () => {
      const updated = localStorage.getItem(STORAGE_KEYS.BACKGROUND_CUSTOM)
      if (!updated || updated === 'default') {
        setBgImage(ASSETS.BACKGROUND_WEBP)
      } else if (updated.startsWith('url:')) {
        setBgImage(updated.slice(4))
      } else if (updated.startsWith('data:image')) {
        setBgImage(updated)
      }
    }
    window.addEventListener('blog-bg-change', handler)
    return () => window.removeEventListener('blog-bg-change', handler)
  }, [])

  useEffect(() => {
    if (!document.fonts) {
      setFontsReady(true)
      return
    }
    let cancelled = false
    const load = Promise.all([
      document.fonts.load('900 4rem "Noto Serif SC"', '云林有风'),
      document.fonts.load('400 1rem "Noto Serif SC"', '欢迎来到寒枫的博客……')
    ]).catch(() => {})
    const timeout = new Promise<void>(resolve => setTimeout(resolve, 1500))
    Promise.race([load, timeout]).then(() => {
      if (!cancelled) setFontsReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // 逐字拆分标题动画 + 副标题打字机效果
  useEffect(() => {
    if (!fontsReady) return
    const heroTitle = titleRef.current
    if (!heroTitle) return
    const titleText = heroTitle.textContent || ""
    heroTitle.innerHTML = ''
    let charIndex = 0
    for (let i = 0; i < titleText.length; i++) {
      const char = titleText[i]
      const span = document.createElement('span')
      if (char === ' ') {
        span.className = 'char char-space'
      } else {
        span.className = 'char'
        span.textContent = char
        span.style.animationDelay = (0.1 + charIndex * 0.06) + 's'
        charIndex++
      }
      heroTitle.appendChild(span)
    }

    // 副标题打字机效果：循环打字 + 退格
    const fullSubtitle = '欢迎来到寒枫的博客……'
    let idx = 0
    let deleting = false
    let timeoutId: NodeJS.Timeout
    const mountedRef = { current: true }

    const tick = () => {
      if (!mountedRef.current) return
      if (!deleting) {
        if (idx < fullSubtitle.length) {
          idx++
          setSubtitleText(fullSubtitle.slice(0, idx))
          setShowCursor(true)
          timeoutId = setTimeout(tick, HOME_CONFIG.TYPEWRITER_CHAR_DELAY)
        } else {
          timeoutId = setTimeout(() => {
            deleting = true
            tick()
          }, HOME_CONFIG.TYPEWRITER_RESET_DELAY)
        }
      } else {
        if (idx > 0) {
          idx--
          setSubtitleText(fullSubtitle.slice(0, idx))
          setShowCursor(true)
          timeoutId = setTimeout(tick, HOME_CONFIG.TYPEWRITER_DELETE_DELAY)
        } else {
          timeoutId = setTimeout(() => { deleting = false; tick() }, HOME_CONFIG.TYPEWRITER_PAUSE_AFTER_DELETE)
        }
      }
    }

    timeoutId = setTimeout(tick, HOME_CONFIG.TYPEWRITER_START_DELAY)

    return () => {
      mountedRef.current = false
      clearTimeout(timeoutId)
    }
  }, [fontsReady])

  // 视差滚动效果
const updateParallax = useCallback(() => {
  const parallaxHero = heroRef.current
  if (!parallaxHero) return

  const rect = parallaxHero.getBoundingClientRect()
  const viewportHeight = window.innerHeight

  if (rect.bottom > 0 && rect.top < viewportHeight) {
    const scrollProgress = -rect.top / viewportHeight

    // 隐藏滚动指示器（保持原逻辑）
    if (scrollIndicatorRef.current) {
      if (scrollProgress > 0.15) {
        scrollIndicatorRef.current.classList.add('hidden')
      } else {
        scrollIndicatorRef.current.classList.remove('hidden')
      }
    }

    // 普通视差层（保持原速度）
    const layers = parallaxHero.querySelectorAll<HTMLElement>('.parallax-layer')
    layers.forEach(layer => {
      const speed = parseFloat(layer.dataset.speed || '0.3')
      const translateY = scrollProgress * viewportHeight * speed
      layer.style.transform = `translateY(${translateY}px)`
    })

    // 光斑视差（保持原效果）
    const orbs = parallaxHero.querySelectorAll<HTMLElement>('.parallax-orb')
    orbs.forEach((orb, index) => {
      const speed = parseFloat(orb.dataset.speed || '0.4')
      const rotate = scrollProgress * (index % 2 === 0 ? 15 : -10)
      const translateY = scrollProgress * viewportHeight * speed
      const translateX = scrollProgress * (index % 2 === 0 ? 20 : -15)
      orb.style.transform = `translateY(${translateY}px) translateX(${translateX}px) rotate(${rotate}deg)`
    })

    // 背景图片效果 ———— 初始时完全不显示 mask 渐变层，滚动后才逐渐出现
    if (bgRef.current) {
      // 🔥 修改点：当滚动进度极小（初始状态）时，完全移除 mask 渐变层
      if (scrollProgress <= 0.01) {
        bgRef.current.style.maskImage = 'none'
        bgRef.current.style.webkitMaskImage = 'none'
      } else {
        // 渐进出现的 mask 参数（保持原有减轻后的系数）
        const fadeStart = Math.max(40, 85 - scrollProgress * 25)
        const fadeEnd   = Math.max(55, 92 - scrollProgress * 15)
        const mask = `linear-gradient(to bottom, black ${fadeStart}%, transparent ${fadeEnd}%)`
        bgRef.current.style.maskImage = mask
        bgRef.current.style.webkitMaskImage = mask
      }

      // 背景垂直移动幅度（初始为 0，符合预期）
      const translateY = scrollProgress * 15
      bgRef.current.style.transform = `translateY(${translateY}px)`

      // 背景淡出速度（初始 opacity = 1）
      bgRef.current.style.opacity = String(1 - scrollProgress * 0.15)
    }

    // 英雄区内容淡出（保持原逻辑）
    const heroContent = parallaxHero.querySelector<HTMLElement>('.hero-content')
    if (heroContent) {
      const fadeProgress = Math.min(scrollProgress * 0.6, 1)
      heroContent.style.opacity = String(1 - fadeProgress)
      heroContent.style.transform = `translateY(${scrollProgress * 12}px)`
    }
  }

  tickingRef.current = false
}, [])
  useEffect(() => {
    const handleScroll = () => {
      if (!tickingRef.current) {
        requestAnimationFrame(updateParallax)
        tickingRef.current = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    updateParallax()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [updateParallax])

  // 平滑滚动到内容区（减去 header 高度避免遮挡）
  const scrollToContent = () => {
    const mainContent = document.getElementById('mainContent')
    if (mainContent) {
      const headerHeight = document.querySelector('.site-header')?.clientHeight || 56
      window.scrollTo({ top: mainContent.offsetTop - headerHeight, behavior: 'smooth' })
    }
  }

  return (
    <section className="parallax-hero" id="parallaxHero" ref={heroRef}>
      {/* 背景图片层（用户设置，完全不透明） */}
      <div
        ref={bgRef}
        className="hero-bg-layer absolute inset-0 z-0 bg-no-repeat bg-cover bg-center transition-[background-image] duration-300 ease-in-out"
        style={{
          backgroundImage: `url(${bgImage})`,
          opacity: 1,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden'
        }}
      />
    <BgOverlay bgColor="0,0,0" opacity={0.4} />

      {/* 视差层1：渐变网格背景 */}
      <div className="parallax-layer parallax-layer-1" data-speed="0.2" />

      {/* 视差层2：光斑 */}
      <div className="parallax-layer parallax-layer-2" data-speed="0.4">
        <div className="parallax-orb parallax-orb-1" data-speed="0.5" />
        <div className="parallax-orb parallax-orb-2" data-speed="0.3" />
        <div className="parallax-orb parallax-orb-3" data-speed="0.6" />
        <div className="parallax-orb parallax-orb-4" data-speed="0.35" />
      </div>

      {/* 视差层3：粒子网格 */}
      <div className="parallax-layer parallax-layer-3" data-speed="0.15" />

      {/* 视差层4：装饰线 */}
      <div className="parallax-layer parallax-layer-4" data-speed="0.25">
        <div className="parallax-line" style={{ top: '25%', left: 0, width: '100%' }} data-speed="0.2" />
        <div className="parallax-line" style={{ top: '75%', left: 0, width: '100%' }} data-speed="0.3" />
        <div className="parallax-line-v" style={{ left: '20%', top: 0, height: '100%' }} data-speed="0.15" />
        <div className="parallax-line-v" style={{ left: '80%', top: 0, height: '100%' }} data-speed="0.25" />
      </div>

      {/* 文字对比度遮罩层 */}
      <div className="hero-overlay" />

      {/* 英雄区内容 */}
      <div className="hero-content" style={{ visibility: fontsReady ? 'visible' : 'hidden' }}>
        <h1 className="hero-title" ref={titleRef}>
          {`云林有风`}
        </h1>
        <p className="hero-subtitle">
          {subtitleText}
          {showCursor && <span className="typing-cursor" />}
        </p>
      </div>

      {/* 滚动指示器 */}
      <div className="scroll-indicator" id="scrollIndicator" ref={scrollIndicatorRef} onClick={scrollToContent}>
        <div className="scroll-indicator-arrow" />
      </div>
    </section>
  )
}
