'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'

// 明确主题类型
type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  isInitializing: boolean // 新增：标记主题是否初始化完成
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [isInitializing, setIsInitializing] = useState<boolean>(true)

  // 初始化主题（提取为独立函数增强可读性）
  const initializeTheme = useCallback(() => {
    try {
      // 检查本地存储的主题设置
      const savedTheme = localStorage.getItem('theme') as Theme | null
      // 检查系统主题偏好
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

      // 确定最终主题（优先级：本地存储 > 系统偏好 > 默认浅色）
      let finalTheme: Theme = 'light'
      if (savedTheme) {
        finalTheme = savedTheme
      } else if (prefersDark) {
        finalTheme = 'dark'
      }

      // 同步HTML类名（避免过渡动画）
      document.documentElement.classList.toggle('dark', finalTheme === 'dark')
      document.documentElement.classList.toggle('light', finalTheme === 'light')

      // 标记初始化完成
      setTheme(finalTheme)
    } catch (error) {
      console.error('主题初始化失败:', error)
      // 出错时使用默认主题
      document.documentElement.classList.add('light')
      setTheme('light')
    } finally {
      setIsInitializing(false)
    }
  }, [])

  // 初始化主题 - 只在客户端挂载时执行一次
  useEffect(() => {
    // 确保在DOM加载完成后执行
    if (document.readyState === 'complete') {
      initializeTheme()
    } else {
      const handleLoad = () => {
        initializeTheme()
        window.removeEventListener('load', handleLoad)
      }
      window.addEventListener('load', handleLoad)
    }

    // 清理函数
    return () => {
      window.removeEventListener('load', initializeTheme)
    }
  }, [initializeTheme])

  // 同步更新主题相关元数据
  useEffect(() => {
    if (isInitializing) return // 初始化完成前不执行

    // 更新主题颜色
    const themeColor = theme === 'dark' ? '#111827' : '#f8fafc'
    const metaThemeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')

    if (metaThemeColor) {
      metaThemeColor.content = themeColor
    } else {
      const newMeta = document.createElement('meta')
      newMeta.name = 'theme-color'
      newMeta.content = themeColor
      document.head.appendChild(newMeta)
    }

    // 更新Apple状态栏样式
    const appleMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="apple-mobile-web-app-status-bar-style"]'
    )

    if (appleMeta) {
      appleMeta.content = theme === 'dark' ? 'black-translucent' : 'default'
    } else {
      const newAppleMeta = document.createElement('meta')
      newAppleMeta.name = 'apple-mobile-web-app-status-bar-style'
      newAppleMeta.content = theme === 'dark' ? 'black-translucent' : 'default'
      document.head.appendChild(newAppleMeta)
    }
  }, [theme, isInitializing])

  // 切换主题方法（优化动画和状态同步）
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'

    // 先更新状态
    setTheme(newTheme)

    // 同步本地存储
    localStorage.setItem('theme', newTheme)

    // 应用类名切换（触发CSS过渡）
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
    document.documentElement.classList.toggle('light', newTheme === 'light')

    // 添加主题切换动画类（可选，配合CSS使用）
    document.documentElement.classList.add('theme-transition')
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transition')
    }, 300)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isInitializing }}>
      {/* 初始化完成前可以显示过渡UI，避免闪烁 */}
      {!isInitializing && children}
    </ThemeContext.Provider>
  )
}

// 自定义Hook，增加类型保护
export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
