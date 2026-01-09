'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import {
  Search,
  Menu,
  User,
  Home,
  FileText,
  Github,
  MessageSquare,
  UserCircle,
  X,
  LogOut,
  Settings,
  Sun,
  Moon,
  Link
} from 'lucide-react'
import { useUser } from '@/contexts/UserContext'
import RegisterForm from './RegisterForm'
import LoginForm from './LoginForm'
import { ENDPOINTS } from '@/lib/api'
import apiClient from '@/lib/utils'
import { useTheme } from '@/contexts/ThemeProvider'

interface MenuItem {
  id: number
  authName: string
  path: string
  enName: string
}

interface SearchResult {
  id: number
  title: string
  content?: string
  firstPicture?: string
  flag?: string
  views?: number
  description?: string
  type?: {
    id: number
    name: string
    pic_url?: string
  }
  user?: {
    id: number
    nickname: string
    avatar?: string
  }
}

interface SearchApiResponse {
  flag: boolean
  code: number
  message: string
  data: {
    content: Array<{
      id: number
      title: string
      content: string
      firstPicture: string
      flag: string
      views: number
      description: string
      type: {
        id: number
        name: string
        pic_url: string
      }
      user: {
        id: number
        nickname: string
        avatar: string
      }
    }>
    totalElements: number
  }
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
  const [userOptionVisible, setUserOptionVisible] = useState<boolean>(false)
  const [mobileSearchVisible, setMobileSearchVisible] = useState<boolean>(false)
  const [isClient, setIsClient] = useState<boolean>(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const mobileSearchInputRef = useRef<HTMLInputElement>(null)

  // 监听路径变化，更新激活状态
  useEffect(() => {
    setActiveIndex(pathname)
  }, [pathname])

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
    { id: 2, authName: '项目', enName: 'projects', path: 'project' },
    { id: 3, authName: '随笔', enName: 'essay', path: 'essay' },
    { id: 4, authName: '留言', enName: 'messages', path: 'message' },
    { id: 5, authName: '友链', enName: 'friends-link', path: 'link' },
    { id: 6, authName: '我', enName: 'me', path: 'personal' }
  ]

  const getMenuIcon = (id: number) => {
    switch (id) {
      case 1:
        return <Home className="w-4 h-4" />
      case 2:
        return <Github className="w-4 h-4" />
      case 3:
        return <FileText className="w-4 h-4" />
      case 4:
        return <MessageSquare className="w-4 h-4" />
      case 5:
        return <Link className="w-4 h-4" />
      case 6:
        return <UserCircle className="w-4 h-4" />
      default:
        return <User className="w-4 h-4" />
    }
  }

  const fetchSearchResults = useCallback(async (query: string): Promise<SearchResult[]> => {
    try {
      const response = await apiClient.get<SearchApiResponse>(
        `${ENDPOINTS.SEARCH}?query=${encodeURIComponent(query)}`
      )

      const data = response.data

      if (!data.flag || data.code !== 200) {
        throw new Error(`搜索失败: ${data.message || '未知错误'}`)
      }

      const results: SearchResult[] = data.data.content.map(item => ({
        id: item.id,
        title: item.title,
        content: item.content,
        firstPicture: item.firstPicture,
        flag: item.flag,
        views: item.views,
        description: item.description,
        type: item.type
          ? {
              id: item.type.id,
              name: item.type.name,
              pic_url: item.type.pic_url
            }
          : undefined,
        user: item.user
          ? {
              id: item.user.id,
              nickname: item.user.nickname,
              avatar: item.user.avatar
            }
          : undefined
      }))

      console.log(`搜索成功: 找到 ${data.data.totalElements} 条结果`)
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
          setSearching(results.length > 0)
        } catch (error) {
          console.log('搜索失败:', error)
          setSearchList([])
          setSearching(false)
        }
      }, 300)
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
    // 关键修复：检查目标路由是否与当前路由相同
    const normalizedCurrentPath = pathname === '/' ? '' : pathname
    const normalizedTargetPath = url

    // 如果导航到当前页面，不执行动画和跳转
    if (normalizedCurrentPath === normalizedTargetPath) {
      // 可以添加滚动到顶部的行为
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
      }, 1000) // 时间应与动画持续时间一致
    } else {
      // 如果没有找到页面元素，直接跳转
      router.push(url)
    }
  }

  const changePage = (path: string) => {
    const routePath = `/${path}`
    setActiveIndex(routePath)
    navigateWithTransition(routePath)
    setMenuHiddenVisible(false) // 关闭侧边栏
    setMobileSearchVisible(false)
  }

  const getBlogInfo = (blogId: number, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    const url = `/blog/${blogId}`
    console.log('Navigating to blog URL:', url)
    router.push(url)
    setSearching(false)
    setQuery('')
    setMobileSearchVisible(false)
  }

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        document.querySelector('header')?.classList.add('header-scrolled')
      } else {
        document.querySelector('header')?.classList.remove('header-scrolled')
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const renderSearchResults = () => {
    if (!searching || searchList.length === 0) return null

    return (
      <ul
        className={`${mobileSearchVisible ? 'mt-4' : 'absolute top-full left-0 right-0 mt-2'} 
        bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-700
        rounded-lg shadow-sm z-50 overflow-hidden max-h-96 overflow-y-auto transition-all duration-300`}
      >
        {searchList.map((blog, index) => (
          <li
            key={blog.id}
            onMouseDown={(e) => getBlogInfo(blog.id, e)}
            className={`px-4 py-3 cursor-pointer transition-all duration-300
              ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              dark:${index % 2 === 0 ? 'bg-gray-900' : 'bg-gray-850'}
              hover:bg-gray-100 dark:hover:bg-gray-800
              border-b border-gray-100 dark:border-gray-800 last:border-0`}
          >
            <div className="flex items-start">
              <div>
                <span className={`font-medium truncate block text-gray-800 dark:text-gray-100`}>
                  {blog.title}
                </span>
                {blog.description && (
                  <span
                    className={`text-xs mt-1 block line-clamp-1 text-gray-500 dark:text-gray-400`}
                  >
                    {blog.description}
                  </span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    )
  }

  const renderAuthSection = () => {
    // 带放射动画的主题切换按钮
    const ThemeToggleButton = () => {
      // 点击触发：先开启动画，再切换主题，动画结束后重置状态
      const handleToggleTheme = () => {
        setAnimateThemeToggle(true)
        toggleTheme()
        // 动画时长 500ms，结束后重置状态避免残留
        setTimeout(() => setAnimateThemeToggle(false), 500)
      }

      return (
        // 外层容器：相对定位，承载绝对定位的渐变遮罩
        <div className="relative">
          {/* 原有主题切换按钮：z-index 10 确保在遮罩上方，不被遮挡 */}
          <button
            onClick={handleToggleTheme}
            className="relative z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-current/10 dark:hover:bg-current/20 transition-colors"
            aria-label={theme === 'dark' ? '切换为浅色模式' : '切换为深色模式'}
          >
            <Sun className="h-5 w-5 text-yellow-400 dark:hidden" />
            <Moon className="h-5 w-5 text-blue-300 hidden dark:block" />
          </button>

          {/* 放射渐变遮罩：绝对定位，以按钮为中心扩散 */}
          <div
            className={`fixed inset-0 rounded-full z-100 transition-all duration-500 ease-out ${
              animateThemeToggle
                ? 'opacity-100 scale-200' // 动画激活：淡入+放大（从中心扩散）
                : 'opacity-0 scale-0' // 默认状态：隐藏+缩小到中心
            }`}
          />
        </div>
      )
    }

    // 未登录状态：显示登录、注册、主题按钮
    if (!userInfo) {
      return (
        <div className="flex gap-2">
          <button
            onClick={onShowLogin}
            className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-md whitespace-nowrap"
          >
            登录
          </button>
          <button
            onClick={onShowRegister}
            className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm rounded-lg hover:from-indigo-600 hover:to-indigo-700 transition-all duration-300 shadow-md whitespace-nowrap hidden sm:inline"
          >
            注册
          </button>
          <ThemeToggleButton />
        </div>
      )
    }

    // 已登录状态：显示主题按钮、用户头像、下拉菜单
    return (
      <div className="flex items-center gap-2 z-1000">
        <ThemeToggleButton />
        <div
          className="relative flex items-center cursor-pointer"
          onClick={() => setUserOptionVisible(!userOptionVisible)}
        >
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border-2 border-blue-200 dark:border-blue-400 shadow-md">
            <Image
              src={userInfo.avatar || '/default-avatar.png'}
              alt={userInfo.nickname || '用户头像'}
              width={40}
              height={40}
              priority
              className="object-cover"
            />
          </div>

          {userOptionVisible && (
            <div
              className={`absolute top-full right-0 mt-3 w-48 bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-700 rounded-lg shadow-sm z-1000 overflow-hidden`}
            >
              <div
                className={`px-4 py-3 border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900`}
              >
                <h3 className={`text-sm font-medium text-gray-800 dark:text-gray-100`}>
                  {userInfo.nickname}，欢迎您
                </h3>
              </div>
              {administrator && (
                <div
                  onClick={onManageBlog}
                  className={`px-4 py-3 text-sm cursor-pointer transition-colors duration-200 flex items-center text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800`}
                >
                  <Settings className="w-4 h-4 mr-2 text-blue-400" />
                  管理博客
                </div>
              )}
              <div
                onClick={onLogout}
                className={`px-4 py-3 text-sm cursor-pointer transition-colors duration-200 flex items-center text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800`}
              >
                <LogOut className="w-4 h-4 mr-2 text-red-400" />
                退出登录
              </div>
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
        className={`fixed inset-y-0 left-0 z-999 w-64 bg-white dark:bg-gray-900 transform transition-transform duration-300 ease-in-out shadow-lg md:hidden ${
          menuHiddenVisible ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div
          className={`mt-12 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center`}
        ></div>
        <nav className="p-2">
          {menuList.map(item => {
            const routePath = `/${item.path}`
            return (
              <button
                key={item.id}
                onClick={() => changePage(item.path)}
                className={`flex items-center w-full px-4 py-3 rounded-md mb-1 transition-colors duration-200 ${
                  activeIndex === routePath
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'
                }`}
              >
                {getMenuIcon(item.id)}
                <span className="ml-3 font-medium">{item.authName}</span>
              </button>
            )
          })}

          {/* 移动端注册按钮 */}
          {!userInfo && (
            <button
              onClick={() => {
                onShowRegister()
                setMenuHiddenVisible(false)
              }}
              className="w-full mt-4 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm rounded-lg hover:from-indigo-600 hover:to-indigo-700 transition-all duration-300 shadow-md"
            >
              注册
            </button>
          )}
        </nav>
      </div>

      {/* 半透明遮罩层 */}
      {menuHiddenVisible && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMenuHiddenVisible(false)}
        />
      )}

      <header
        className={`w-full bg-slate-50 text-gray-800 dark:bg-gray-900 dark:text-white py-2 sticky top-0 z-1000 transition-all duration-100`}
      >
        <div className="w-full container mx-auto px-3">
          <div className="flex items-center justify-between gap-3">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div
                className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent cursor-pointer flex items-center whitespace-nowrap"
                onClick={() => changePage('')}
              >
                {/* 主导航栏中使用头像替换H标志 */}
                <div className="w-7 h-7 rounded-full overflow-hidden lg:mr-2 shadow-sm border border-blue-300 dark:border-blue-400">
                  <Image
                    src="https://hanphone.top/images/zhuxun.jpg"
                    alt="博客头像"
                    width={28}
                    height={28}
                    priority={true}
                    className="object-cover"
                  />
                </div>
                <span className="hidden lg:inline">Hanphone&apos;s Blog</span>
              </div>

              {/* 移动端搜索按钮 */}
              <button
                className={`sm:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors duration-200`}
                onClick={() => setMobileSearchVisible(true)}
                aria-label="搜索"
              >
                <Search className="w-5 h-5 text-blue-400" />
              </button>
            </div>

            {/* 桌面端导航菜单 */}
            <nav
              className={`hidden md:flex items-center space-x-1 bg-gray-50/30 dark:bg-gray-800/50 p-1 rounded-lg dark:shadow-inner`}
            >
              {menuList.map(item => {
                const routePath = `/${item.path}`
                return (
                  <button
                    key={item.id}
                    onClick={() => changePage(item.path)}
                    className={`flex min-w-[80px] items-center px-3 py-2 rounded-md transition-all duration-300 ${
                      activeIndex === routePath
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'hover:bg-gray-200 text-gray-800 dark:hover:bg-gray-700 dark:text-gray-200'
                    } ${item.enName}`}
                  >
                    {getMenuIcon(item.id)}
                    <span className="ml-2 font-medium">{item.authName}</span>
                  </button>
                )
              })}
            </nav>

            {/* 搜索和用户区域 */}
            <div className="flex items-center gap-3 flex-1 justify-end md:flex-initial">
              {/* 桌面端搜索框 */}
              <div className="hidden sm:block relative flex-1 max-w-xs">
                <div className="relative">
                  <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onFocus={() => setSearching(query.trim() !== '')}
                    onBlur={() => setTimeout(() => setSearching(false), 300)}
                    placeholder="搜索..."
                    className={`w-full px-4 py-2 pl-10 bg-white border border-gray-200 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg transition-all duration-300 text-sm`}
                  />
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>
                {renderSearchResults()}
              </div>

              {/* 登录/注册区域（含主题切换按钮） */}
              {renderAuthSection()}

              {/* 移动端菜单按钮 */}
              <button
                className={`md:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors duration-200`}
                onClick={() => setMenuHiddenVisible(!menuHiddenVisible)}
                aria-label="菜单"
              >
                <Menu className="w-5 h-5 text-blue-400" />
              </button>
            </div>
          </div>
        </div>

        {/* 移动端全屏搜索框 */}
        {mobileSearchVisible && (
          <div className={`fixed inset-0 bg-white dark:bg-gray-900 z-50 p-4 flex flex-col`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">
                搜索
              </h2>
              <button
                onClick={() => {
                  setMobileSearchVisible(false)
                  setQuery('')
                }}
                className={`p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors`}
                aria-label="关闭搜索"
              >
                <X className="w-6 h-6 text-blue-400" />
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
                className={`w-full px-4 py-3 pl-12 bg-white border border-gray-200 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg text-base`}
              />
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
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
      </header>
    </>
  )
}

export default Header
