'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Menu,
  User,
  Home,
  FileText,
  Github,
  MessageSquare,
  MessageCircle,
  UserCircle,
  X,
  LogOut,
  Settings,
  Sun,
  Moon,
  Heart,
  Zap,
  Link,
  UserPen,
  ImageIcon,
  BookOpen,
  Archive,
  Share2,
  ChevronDown,
  Send,
  LogIn,
  Wrench,
  Gamepad2,
  Code,
  Music
} from 'lucide-react'
import { useUser } from '@/contexts/UserContext'
import RegisterForm from './RegisterForm'
import LoginForm from './LoginForm'
import { ENDPOINTS } from '@/lib/api'
import apiClient from '@/lib/utils'
import { useTheme } from '@/contexts/ThemeProvider'
import { alertSuccess } from '@/lib/Alert'
import { ASSETS, ROUTES, API_CODE, TIME } from '@/lib/constants'
import { AUTH_LABELS } from '@/lib/labels'
import UserInfoForm from './UserInfoForm'
import BackgroundSettings from './BackgroundSettings'
import ModalOverlay from './shared/ModalOverlay'

interface MenuItem {
  id: number
  authName: string
  path: string
  enName: string
  children?: MenuItem[]
  newTab?: boolean
}

interface SearchResult {
  id: number
  title: string
  description?: string
  contentType: 'BLOG' | 'ESSAY' | 'PROJECT' | 'DOC'
  url: string
  external?: boolean
}

interface GlobalSearchApiResponse {
  flag: boolean
  code: number
  message: string
  data: Array<{
    id: number
    title: string
    description: string
    contentType: string
    url: string
    external: boolean
  }>
}

const Header: React.FC = () => {
  const {
    userInfo,
    administrator,
    loginFormVisiable,
    registorFormVisiable,
    setRegistorFormVisiable,
    setLoginFormVisiable,
    onLogout,
    onShowLogin,
    onShowRegister,
    onManageBlog
  } = useUser()
  const router = useRouter()
  const pathname = usePathname() || ''
  const { theme, toggleTheme } = useTheme()

  // 新增：控制主题切换放射动画的状态
  const [animateThemeToggle, setAnimateThemeToggle] = useState(false)

  const [query, setQuery] = useState<string>('')
  const [searching, setSearching] = useState<boolean>(false)
  const [searchList, setSearchList] = useState<SearchResult[]>([])
  const [activeIndex, setActiveIndex] = useState<string>(pathname)
  const [menuHiddenVisible, setMenuHiddenVisible] = useState<boolean>(false)
  const [expandedMobileMenu, setExpandedMobileMenu] = useState<number | null>(null)
  const [userOptionVisible, setUserOptionVisible] = useState<boolean>(false)
  const [mobileSearchVisible, setMobileSearchVisible] = useState<boolean>(false)
  const [isClient, setIsClient] = useState<boolean>(false)
  const [userInfoFormVisible, setUserInfoFormVisible] = useState<boolean>(false)
  const [backgroundSettingsOpen, setBackgroundSettingsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const lastHeaderTap = useRef(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // 双击/双触 Header 回到顶部（兼容桌面鼠标 + 移动端触屏）
  const handleHeaderDoubleTap = () => {
    const now = Date.now()
    if (now - lastHeaderTap.current < 350) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      lastHeaderTap.current = 0
    } else {
      lastHeaderTap.current = now
    }
  }
  const mobileSearchInputRef = useRef<HTMLInputElement>(null)

  const isHomePage = pathname === '/'
  const isTransparent = isHomePage && !isScrolled

  // 监听路径变化，更新激活状态
  useEffect(() => {
    setActiveIndex(pathname)
  }, [pathname])

  // 管理body的home-page class（控制main-content的padding-top）
  useEffect(() => {
    if (isHomePage) {
      document.body.classList.add('home-page')
    } else {
      document.body.classList.remove('home-page')
    }
    return () => {
      document.body.classList.remove('home-page')
    }
  }, [isHomePage])

  useEffect(() => {
    setIsClient(true)

    if (mobileSearchVisible && mobileSearchInputRef.current) {
      mobileSearchInputRef.current.focus()
    }

    // 页面加载完成后移除exit类，确保初始状态正确
    const pageElement = document.querySelector('.page-transition')
    if (pageElement) {
      pageElement.classList.remove('exit')
    }
  }, [mobileSearchVisible])

  // 菜单列表数据
  const menuList: MenuItem[] = [
    { id: 1, authName: '首页', enName: 'home', path: '' },
    { id: 2, authName: '归档', enName: 'archive', path: 'blog' },
    { id: 3, authName: '项目', enName: 'projects', path: 'projects', children: [
      { id: 31, authName: '完整项目', enName: 'full-projects', path: 'projects' },
      { id: 32, authName: '工具箱', enName: 'tools', path: 'tools' },
      { id: 33, authName: '小游戏', enName: 'games', path: 'games' },
      { id: 34, authName: '小练习', enName: 'play', path: 'play' }
    ]},
    { id: 4, authName: '随笔', enName: 'essays', path: 'essays' },
    { id: 5, authName: '分享', enName: 'share', path: '', children: [
      { id: 51, authName: '文库', enName: 'docs', path: 'docs' },
      { id: 52, authName: '照片墙', enName: 'photo-wall', path: 'atlas', newTab: true },
      { id: 53, authName: '音乐库', enName: 'music', path: 'music' }
    ]},
    { id: 6, authName: '交流', enName: 'community', path: '', children: [
      { id: 61, authName: '留言', enName: 'messages', path: 'messages' },
      { id: 62, authName: '聊天室', enName: 'chat', path: 'chat/public', newTab: true },
      { id: 63, authName: '私信', enName: 'private-messages', path: 'chat', newTab: true }
    ]},
    { id: 7, authName: '友链', enName: 'links', path: 'links' },
    { id: 8, authName: '关于', enName: 'about', path: 'about' }
  ]

  const getMenuIcon = (id: number) => {
    switch (id) {
      case 1:
        return <Home className="w-4 h-4" />
      case 2:
        return <Archive className="w-4 h-4" />
      case 3:
        return <Github className="w-4 h-4" />
      case 31:
        return <Github className="w-4 h-4" />
      case 32:
        return <Wrench className="w-4 h-4" />
      case 33:
        return <Gamepad2 className="w-4 h-4" />
      case 34:
        return <Code className="w-4 h-4" />
      case 4:
        return <FileText className="w-4 h-4" />
      case 5:
        return <Share2 className="w-4 h-4" />
      case 51:
        return <BookOpen className="w-4 h-4" />
      case 52:
        return <ImageIcon className="w-4 h-4" />
      case 53:
        return <Music className="w-4 h-4" />
      case 6:
        return <MessageCircle className="w-4 h-4" />
      case 61:
        return <MessageSquare className="w-4 h-4" />
      case 62:
        return <MessageCircle className="w-4 h-4" />
      case 63:
        return <Send className="w-4 h-4" />
      case 7:
        return <Link className="w-4 h-4" />
      case 8:
        return <UserCircle className="w-4 h-4" />
      default:
        return <User className="w-4 h-4" />
    }
  }

  const fetchSearchResults = useCallback(async (query: string): Promise<SearchResult[]> => {
    try {
      const response = await apiClient.get<GlobalSearchApiResponse>(
        `${ENDPOINTS.SEARCH}?query=${encodeURIComponent(query)}`
      )

      const data = response.data

      if (!data.flag || data.code !== API_CODE.SUCCESS) {
        throw new Error(`搜索失败: ${data.message || '未知错误'}`)
      }

      const results: SearchResult[] = (data.data || []).map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        contentType: item.contentType as SearchResult['contentType'],
        url: item.url,
        external: item.external
      }))

      console.log(`搜索成功: 找到 ${results.length} 条结果`)
      return results
    } catch (error) {
      console.error('搜索操作失败:', error)
      if (error instanceof Error) {
        throw new Error(`获取搜索结果失败: ${error.message}`)
      } else {
        throw new Error('获取搜索结果失败，请稍后再试')
      }
    }
  }, [])

  const handleSearch = useCallback(
    async (value: string) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      if (!value.trim()) {
        setSearching(false)
        setSearchList([])
        return
      }

      timerRef.current = setTimeout(async () => {
        try {
          const results = await fetchSearchResults(value)
          setSearchList(results.slice(0, 10))
          setSearching(true)
        } catch (error) {
          console.log('搜索失败:', error)
          setSearchList([])
          setSearching(false)
        }
      }, TIME.DEBOUNCE_DELAY)
    },
    [fetchSearchResults]
  )

  useEffect(() => {
    handleSearch(query)
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [query, handleSearch])

  // 路由跳转前添加退场动画 - 修复当前路由导航bug
  const navigateWithTransition = (url: string) => {
    // 归一化后比较：usePathname 带尾斜杠（如 /about/），菜单目标不带（/about），根路径为 /
    // 若不归一化，同页导航会走进退场分支：.exit 类被添加后，push 被 Next 去重、
    // 页面不重挂载，.exit 无人移除，页面停留在 fadeOut 后的不可见状态
    const normalizePath = (p: string) => {
      const trimmed = p.replace(/\/+$/, '')
      return trimmed === '' ? '/' : trimmed
    }

    // 如果导航到当前页面，不执行动画和跳转，仅回到顶部
    if (normalizePath(pathname) === normalizePath(url)) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    const pageElement = document.querySelector('.page-transition')
    if (pageElement) {
      // 添加退场类以触发退场动画
      pageElement.classList.add('exit')

      // 等待动画完成后再进行页面跳转
      setTimeout(() => {
        router.push(url)
      }, TIME.SUCCESS_CLOSE_DELAY)
    } else {
      // 如果没有找到页面元素，直接跳转
      router.push(url)
    }
  }

  const isMenuActive = (item: MenuItem) => {
    if (item.children?.length) {
      return item.children.some(child => {
        const childPath = `/${child.path}`
        return activeIndex === childPath || activeIndex.startsWith(childPath + '/')
      })
    }
    const routePath = `/${item.path}`
    return activeIndex === routePath || (routePath !== '/' && activeIndex.startsWith(routePath + '/'))
  }

  const changePage = (path: string) => {
    const routePath = `/${path}`
    setActiveIndex(routePath)
    navigateWithTransition(routePath)
    setMenuHiddenVisible(false) // 关闭侧边栏
    setMobileSearchVisible(false)
    setExpandedMobileMenu(null)
  }

  const handleMenuClick = (path: string, newTab?: boolean) => {
    if (newTab) {
      window.open(`/${path}`, '_blank')
      setMenuHiddenVisible(false)
      return
    }
    changePage(path)
  }

  const navigateToResult = (result: SearchResult, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    if (result.external) {
      window.open(result.url, '_blank')
    } else {
      router.push(result.url)
    }
    setSearching(false)
    setQuery('')
    setMobileSearchVisible(false)
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > window.innerHeight * 0.8)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // 初始检查
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const getContentTypeLabel = (type: SearchResult['contentType']) => {
    switch (type) {
      case 'BLOG':
        return '博客'
      case 'ESSAY':
        return '随笔'
      case 'PROJECT':
        return '项目'
      case 'DOC':
        return '文库'
      default:
        return ''
    }
  }

  const renderSearchResults = () => {
    if (!searching) return null

    if (searchList.length === 0) {
      return (
        <ul
          className={`${mobileSearchVisible
            ? 'mt-4 flex-1 min-h-[200px] max-h-[calc(100vh-180px)] overflow-y-auto'
            : 'absolute top-full left-0 right-0 mt-2 max-h-96 overflow-y-auto'}
          bg-[rgb(var(--card))] border border-[rgb(var(--border))]
          rounded-lg shadow-lg z-50 transition-none`}
        >
          <li className="px-4 py-3 text-sm text-[rgb(var(--text-muted))] text-center">
            未找到相关内容
          </li>
        </ul>
      )
    }

    return (
      <ul
        className={`${mobileSearchVisible
          ? 'mt-4 flex-1 min-h-[200px] max-h-[calc(100vh-180px)] overflow-y-auto'
          : 'absolute top-full left-0 right-0 mt-2 max-h-96 overflow-y-auto'}
        bg-[rgb(var(--card))] border border-[rgb(var(--border))]
        rounded-lg shadow-lg z-50 transition-none`}
      >
        {searchList.map((result) => (
          <li
            key={`${result.contentType}-${result.id}`}
            onMouseDown={(e) => navigateToResult(result, e)}
            className="px-4 py-3 cursor-pointer transition-none hover:bg-[rgb(var(--hover))] border-b border-[rgb(var(--border))] last:border-0"
          >
            <div className="flex items-start gap-2">
              <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))]">
                {getContentTypeLabel(result.contentType)}
              </span>
              <div className="min-w-0 flex-1">
                <span className="font-medium truncate block text-[rgb(var(--text))]">
                  {result.title}
                </span>
                {result.description && (
                  <span className="text-xs mt-1 block line-clamp-1 text-[rgb(var(--text-muted))]">
                    {result.description}
                  </span>
                )}
              </div>
              {result.external && (
                <svg className="w-3 h-3 text-[rgb(var(--text-muted))] shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              )}
            </div>
          </li>
        ))}
      </ul>
    )
  }

  // 退出登录处理
  const handleLogout = () => {
    onLogout()
    alertSuccess(AUTH_LABELS.LOGOUT_SUCCESS)
  }

  // 主题切换按钮渲染 - 提取为独立函数避免在renderAuthSection内定义组件
  const renderThemeToggleButton = () => {
    // 点击触发：先开启动画，再切换主题，动画结束后重置状态
    const handleToggleTheme = () => {
      setAnimateThemeToggle(true)
      toggleTheme()
      // 动画时长 500ms，结束后重置状态避免残留
      setTimeout(() => setAnimateThemeToggle(false), TIME.LONG_PRESS_DURATION)
    }

    // 根据主题返回对应的图标和 aria-label
    const getThemeIcon = () => {
      switch (theme) {
        case 'light':
          return <Sun className="h-5 w-5 text-yellow-500" />
        case 'dark':
          return <Moon className="h-5 w-5 text-blue-300" />
        case 'macaron':
          return <Heart className="h-5 w-5 text-pink-400" />
        case 'cyber':
          return <Zap className="h-5 w-5 text-cyan-300" />
        default:
          return <Sun className="h-5 w-5 text-yellow-500" />
      }
    }

    const getThemeLabel = () => {
      switch (theme) {
        case 'light':
          return '当前：浅色模式'
        case 'dark':
          return '当前：深色模式'
        case 'macaron':
          return '当前：马卡龙主题'
        case 'cyber':
          return '当前：赛博朋克主题'
        default:
          return '切换主题'
      }
    }

    return (
      // 外层容器：相对定位，承载绝对定位的渐变遮罩；flex items-center 与背景按钮对齐
      <div className="relative flex items-center">
        <button
          onClick={handleToggleTheme}
          className={`relative z-10 w-10 h-10 flex items-center justify-center shrink-0 rounded-full transition-none ${
            isTransparent
              ? 'hover:bg-[rgb(var(--bg)/0.2)]'
              : 'bg-[rgb(var(--card))] hover:bg-[rgb(var(--hover))] border border-[rgb(var(--border))]'
          }`}
          aria-label={getThemeLabel()}
          title={getThemeLabel()}
        >
          {getThemeIcon()}
        </button>

        {/* 放射渐变遮罩：绝对定位，以按钮为中心扩散 */}
        <div
          className={`fixed inset-0 z-100 transition-all duration-500 ease-out pointer-events-none ${
            animateThemeToggle
              ? 'opacity-100 scale-200' // 动画激活：淡入+放大（从中心扩散）
              : 'opacity-0 scale-0' // 默认状态：隐藏+缩小到中心
          }`}
          style={{ transformOrigin: 'center center' }}
        />
      </div>
    )
  }

  const renderAuthSection = () => {
    return (
      <div className="flex items-center gap-2 z-1000 shrink-0">
        {renderThemeToggleButton()}
        <button
          onClick={() => setBackgroundSettingsOpen(true)}
          className={`w-10 h-10 flex items-center justify-center shrink-0 rounded-full transition-none ${
            isTransparent
              ? 'hover:bg-[rgb(var(--bg)/0.2)]'
              : 'bg-[rgb(var(--card))] hover:bg-[rgb(var(--hover))] border border-[rgb(var(--border))]'
          }`}
          aria-label="自定义背景"
          title="自定义背景"
        >
          <ImageIcon className="h-5 w-5 text-[rgb(var(--primary))]" />
        </button>
        <div
          className="relative flex items-center cursor-pointer"
          onClick={() => setUserOptionVisible(!userOptionVisible)}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center lg:mr-2 ${
            isTransparent
              ? 'hover:bg-[rgb(var(--bg)/0.2)]'
              : 'bg-[rgb(var(--card))] hover:bg-[rgb(var(--hover))] border border-[rgb(var(--border))]'
          }`}>
            <Image
              src={userInfo?.avatar || ASSETS.DEFAULT_AVATAR}
              alt={userInfo?.nickname || '默认头像'}
              width={32}
              height={32}
              priority
              className="object-cover rounded-full block"
            />
          </div>

          {userOptionVisible && (
            <div className="absolute top-full right-0 mt-3 w-48 bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-lg shadow-sm z-1000 overflow-hidden">
              {userInfo ? (
                <>
                  <div className="px-4 py-3 border-b border-[rgb(var(--border))] bg-[rgb(var(--card))]/50">
                    <h3 className="text-sm font-medium text-[rgb(var(--text))]">
                      {userInfo.nickname}，欢迎您
                    </h3>
                  </div>
                  <div
                    onClick={() => {
                      setUserInfoFormVisible(true)
                      setUserOptionVisible(false)
                    }}
                    className="px-4 py-3 text-sm cursor-pointer transition-none flex items-center text-[rgb(var(--text))] hover:bg-[rgb(var(--hover))]"
                  >
                    <UserPen className="w-4 h-4 mr-2 text-[rgb(var(--primary))]" />
                    修改个人信息
                  </div>
                  {administrator && (
                    <div
                      onClick={() => {
                        onManageBlog()
                        setUserOptionVisible(false)
                      }}
                      className="px-4 py-3 text-sm cursor-pointer transition-none flex items-center text-[rgb(var(--text))] hover:bg-[rgb(var(--hover))]"
                    >
                      <Settings className="w-4 h-4 mr-2 text-[rgb(var(--primary))]" />
                      管理博客
                    </div>
                  )}
                  <div
                    onClick={() => {
                      handleLogout()
                      setUserOptionVisible(false)
                    }}
                    className="px-4 py-3 text-sm cursor-pointer transition-none flex items-center text-[rgb(var(--text))] hover:bg-[rgb(var(--hover))]"
                  >
                    <LogOut className="w-4 h-4 mr-2 text-[rgb(var(--danger))]" />
                    退出登录
                  </div>
                </>
              ) : (
                <>
                  <div className="px-4 py-3 border-b border-[rgb(var(--border))] bg-[rgb(var(--card))]/50">
                    <h3 className="text-sm font-medium text-[rgb(var(--text-muted))]">
                      您尚未登录
                    </h3>
                  </div>
                  <div
                    onClick={() => {
                      onShowLogin()
                      setUserOptionVisible(false)
                    }}
                    className="px-4 py-3 text-sm cursor-pointer transition-none flex items-center text-[rgb(var(--text))] hover:bg-[rgb(var(--hover))]"
                  >
                    <LogIn className="w-4 h-4 mr-2 text-[rgb(var(--primary))]" />
                    登录
                  </div>
                  <div
                    onClick={() => {
                      onShowRegister()
                      setUserOptionVisible(false)
                    }}
                    className="px-4 py-3 text-sm cursor-pointer transition-none flex items-center text-[rgb(var(--text))] hover:bg-[rgb(var(--hover))]"
                  >
                    <User className="w-4 h-4 mr-2 text-[rgb(var(--primary))]" />
                    注册
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* 侧边导航栏 */}
      <div
        className={`fixed inset-y-0 left-0 z-999 w-64 bg-[rgb(var(--bg))] transform transition-transform duration-100 ease-in-out shadow-lg md:hidden ${
          menuHiddenVisible ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div
          className="mt-12 flex justify-between items-center"
        ></div>
        <nav className="p-2">
          {menuList.map(item => {
            const hasChildren = !!item.children?.length
            const isExpanded = expandedMobileMenu === item.id
            return (
              <div key={item.id}>
                <button
                  onClick={() => {
                    if (hasChildren) {
                      setExpandedMobileMenu(isExpanded ? null : item.id)
                    } else {
                      changePage(item.path)
                    }
                  }}
                  className={`flex items-center w-full px-4 py-3 rounded-md mb-1 transition-none ${
                    isMenuActive(item)
                      ? 'bg-[rgb(var(--primary))] text-white font-semibold'
                      : 'text-[rgb(var(--text))] hover:bg-[rgb(var(--hover))]'
                  }`}
                >
                  {getMenuIcon(item.id)}
                  <span className="ml-3 font-medium">{item.authName}</span>
                  {hasChildren && (
                    <ChevronDown className={`w-4 h-4 ml-auto transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  )}
                </button>
                <AnimatePresence>
                  {hasChildren && isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="overflow-hidden pl-4"
                    >
                      {item.children!.map((child, childIndex) => {
                        const childPath = `/${child.path}`
                        return (
                          <motion.button
                            key={child.id}
                            onClick={() => handleMenuClick(child.path, child.newTab)}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: childIndex * 0.05 }}
                            className={`flex items-center w-full px-4 py-2.5 rounded-md mb-0.5 transition-none ${
                              activeIndex === childPath
                                ? 'bg-[rgb(var(--primary)/0.15)] text-[rgb(var(--primary))] font-medium'
                                : 'text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--hover))] hover:text-[rgb(var(--text))]'
                            }`}
                          >
                            {getMenuIcon(child.id)}
                            <span className="ml-3 font-medium">{child.authName}</span>
                          </motion.button>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}

          {/* 移动端注册按钮 */}
          {!userInfo && (
            <button
              onClick={() => {
                onShowRegister()
                setMenuHiddenVisible(false)
              }}
              className="w-full mt-4 px-4 py-2.5 text-white text-sm rounded-lg transition-none bg-[rgb(var(--primary))] hover:bg-[rgb(var(--primary-hover))] font-semibold shadow-sm"
            >
              注册
            </button>
          )}
        </nav>
      </div>

      {/* 半透明遮罩层 */}
      {menuHiddenVisible && (
        <ModalOverlay className="md:hidden" onClick={() => setMenuHiddenVisible(false)} zIndex={40} />
      )}

      <header
        onClick={handleHeaderDoubleTap}
        className={`site-header w-full h-14 fixed top-0 left-0 right-0 z-1000 text-[rgb(var(--text))] transition-all duration-300 select-none ${
          isTransparent
            ? 'header-transparent bg-transparent border-0'
            : 'backdrop-blur-sm bg-[rgb(var(--bg))]/95 border-b border-[rgb(var(--border))]/30'
        }`}
      >
        <div className="w-full h-full container mx-auto pl-1 pr-2">
          <div className="flex items-center justify-between gap-2 h-full">
            {/* Logo */}
            <div className="flex items-center gap-1">
              <div
                className="text-xl font-bold bg-clip-text text-transparent cursor-pointer flex items-center whitespace-nowrap bg-gradient-to-r from-[rgb(var(--primary))] to-[rgb(var(--primary-hover))]"
                onClick={() => changePage('')}
              >
                <span className="hidden text-md lg:inline">Hanphone&apos;s Blog</span>
              </div>

              {/* 移动端/中等屏搜索按钮：<xl 时显示，与主题按钮同尺寸 */}
              <button
                className={`xl:hidden w-10 h-10 flex items-center justify-center shrink-0 rounded-full transition-none ${
                  isTransparent
                    ? 'hover:bg-[rgb(var(--bg)/0.2)]'
                    : 'bg-[rgb(var(--card))] hover:bg-[rgb(var(--hover))] border border-[rgb(var(--border))]'
                }`}
                onClick={() => setMobileSearchVisible(true)}
                aria-label="搜索"
              >
                <Search className="w-5 h-5 text-[rgb(var(--primary))]" />
              </button>
            </div>

              {/* 桌面端导航菜单 */}
            <nav
              className={`hidden md:flex items-center flex-nowrap shrink-0 gap-0.5 p-1 rounded-xl min-w-0 ${
                isTransparent ? '' : 'bg-[rgb(var(--card))]/20 border border-[rgb(var(--border))]/30'
              }`}
            >
              {menuList.map(item => {
                const hasChildren = !!item.children?.length
                const isActive = isMenuActive(item)
                if (hasChildren) {
                  return (
                    <div key={item.id} className="relative group">
                      <button
                        title={item.authName}
                        className={`flex items-center shrink-0 rounded-lg transition-none whitespace-nowrap ${
                          isActive
                            ? isTransparent
                              ? 'text-white font-semibold'
                              : 'bg-[rgb(var(--primary))] text-white shadow-md font-semibold'
                            : isTransparent
                              ? 'hover:bg-[rgb(var(--bg)/0.15)] text-white'
                              : 'hover:bg-[rgb(var(--hover))] text-[rgb(var(--text))]'
                        } min-[1100px]:px-2.5 min-[1100px]:py-1.5 px-2 py-1.5 ${item.enName}`}
                      >
                        {getMenuIcon(item.id)}
                        <span className="ml-1.5 font-medium text-sm hidden min-[1100px]:inline">{item.authName}</span>
                        <ChevronDown className="w-3 h-3 ml-0.5 hidden min-[1100px]:inline opacity-70" />
                      </button>
                      <div className={`absolute top-full left-0 mt-1 py-1.5 px-1.5 rounded-xl opacity-0 invisible -translate-y-1 scale-[0.97] transition-all duration-200 ease-out group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:scale-100 min-w-[140px] z-50 origin-top-left ${
                        isTransparent
                          ? 'bg-transparent border-0 shadow-none'
                          : 'bg-[rgb(var(--bg))] border border-[rgb(var(--border))] shadow-xl'
                      }`}>
                        {item.children!.map((child, childIndex) => {
                          const childActive = activeIndex === `/${child.path}`
                          return (
                            <motion.button
                              key={child.id}
                              onClick={() => handleMenuClick(child.path, child.newTab)}
                              title={child.authName}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.2, delay: childIndex * 0.04 }}
                              className={`flex items-center w-full px-3 py-2 rounded-lg text-sm transition-none whitespace-nowrap ${
                                childActive
                                  ? 'bg-[rgb(var(--primary)/0.12)] text-[rgb(var(--primary))] font-medium'
                                  : isTransparent
                                    ? 'text-white hover:bg-[rgb(var(--bg)/0.15)]'
                                    : 'text-[rgb(var(--text))] hover:bg-[rgb(var(--hover))]'
                              }`}
                            >
                              {getMenuIcon(child.id)}
                              <span className="ml-2">{child.authName}</span>
                            </motion.button>
                          )
                        })}
                      </div>
                    </div>
                  )
                }
                return (
                  <button
                    key={item.id}
                    onClick={() => changePage(item.path)}
                    title={item.authName}
                    className={`flex items-center shrink-0 rounded-lg transition-none whitespace-nowrap ${
                      isActive
                        ? isTransparent
                          ? 'text-white font-semibold'
                          : 'bg-[rgb(var(--primary))] text-white shadow-md font-semibold'
                        : isTransparent
                          ? 'hover:bg-[rgb(var(--bg)/0.15)] text-white'
                          : 'hover:bg-[rgb(var(--hover))] text-[rgb(var(--text))]'
                    } min-[1100px]:px-2.5 min-[1100px]:py-1.5 px-2 py-1.5 ${item.enName}`}
                  >
                    {getMenuIcon(item.id)}
                    <span className="ml-1.5 font-medium text-sm hidden min-[1100px]:inline">{item.authName}</span>
                  </button>
                )
              })}
            </nav>

            {/* 搜索和用户区域：xl 以下使用搜索按钮避免拥挤 */}
            <div className="flex items-center gap-2 flex-1 justify-end md:flex-initial min-w-0">
              {/* 桌面端搜索框：xl+ 显示，确保 nav+search+auth 有足够空间 */}
              <div className="hidden xl:block relative w-full min-w-0 max-w-[16rem]">
                <div className="relative flex items-center">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-muted))] pointer-events-none shrink-0" />
                  <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onFocus={() => setSearching(query.trim() !== '')}
                    onBlur={() => setTimeout(() => setSearching(false), TIME.ANIMATION_DURATION)}
                    placeholder="搜索..."
                    className={`w-full px-4 py-1.5 pl-9 text-[rgb(var(--text))] placeholder-[rgb(var(--text-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))] rounded-lg transition-none text-sm ${
                      isTransparent
                        ? 'bg-[rgb(var(--bg)/0.15)] border border-[rgb(var(--text)/0.15)]'
                        : 'bg-[rgb(var(--card))] border border-[rgb(var(--border))]'
                    }`}
                  />
                </div>
                {renderSearchResults()}
              </div>

              {/* 登录/注册区域（含主题切换按钮） */}
              {renderAuthSection()}

              {/* 移动端菜单按钮：与主题按钮同尺寸 */}
              <button
                className={`md:hidden w-10 h-10 flex items-center justify-center shrink-0 rounded-full transition-none ${
                  isTransparent
                    ? 'hover:bg-[rgb(var(--bg)/0.2)]'
                    : 'bg-[rgb(var(--card))] hover:bg-[rgb(var(--hover))] border border-[rgb(var(--border))]'
                }`}
                onClick={() => setMenuHiddenVisible(!menuHiddenVisible)}
                aria-label="菜单"
              >
                <Menu className="w-5 h-5 text-[rgb(var(--primary))]" />
              </button>
            </div>
          </div>
        </div>

        {/* 移动端全屏搜索框 */}
        {mobileSearchVisible && (
          <div className="fixed inset-0 bg-[rgb(var(--bg))] z-[1100] p-4 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold bg-gradient-to-r from-[rgb(var(--primary))] to-[rgb(var(--primary-hover))] bg-clip-text text-transparent">
                搜索
              </h2>
              <button
                onClick={() => {
                  setMobileSearchVisible(false)
                  setQuery('')
                }}
                className="p-2 rounded-full bg-[rgb(var(--card))] hover:bg-[rgb(var(--hover))] transition-none"
                aria-label="关闭搜索"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="relative">
              <input
                ref={mobileSearchInputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setSearching(query.trim() !== '')}
                placeholder="输入关键词搜索..."
                className="w-full px-4 py-2.5 pl-11 bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-[rgb(var(--text))] placeholder-[rgb(var(--text-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))] rounded-lg text-base"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--text-muted))]" />
            </div>
            {renderSearchResults()}
          </div>
        )}

        {/* 登录表单 */}
        <LoginForm visible={loginFormVisiable} onClose={() => setLoginFormVisiable(false)} />

        {/* 注册表单 */}
        <RegisterForm
          visible={registorFormVisiable}
          onClose={() => setRegistorFormVisiable(false)}
        />

        {/* 用户信息修改表单 */}
        <UserInfoForm
          visible={userInfoFormVisible}
          onClose={() => setUserInfoFormVisible(false)}
        />

        {/* 背景设置 */}
        <BackgroundSettings
          open={backgroundSettingsOpen}
          onClose={() => setBackgroundSettingsOpen(false)}
        />
      </header>
    </>
  )
}

export default Header
