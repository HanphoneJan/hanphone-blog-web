'use client'

import { useEffect, useCallback, JSX, useReducer } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Code, Gamepad2, Layers, Search, ChevronDown, X, ToolCase, Star } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'
import { ENDPOINTS } from '@/lib/api'

// 定义项目类型接口
interface Project {
  id: number
  title: string
  content: string
  techs: string
  pic_url: string
  url: string
  type: number // 0: 不展示  1：完整项目, 2: 工具箱, 3: 小游戏 4：小练习
  recommend: boolean // 新增：是否推荐项目
}

// 项目类型配置
interface ProjectTypeConfig {
  id: number
  name: string
  filterKey: string
  icon: JSX.Element
  layout: 'large' | 'small'
  showInFilter: boolean
}

const PROJECT_TYPES: ProjectTypeConfig[] = [
  {
    id: 1,
    name: '完整项目',
    filterKey: 'projects',
    icon: <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />,
    layout: 'large',
    showInFilter: true
  },
  {
    id: 2,
    name: '工具箱',
    filterKey: 'tools',
    icon: <ToolCase className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />,
    layout: 'small',
    showInFilter: true
  },
  {
    id: 3,
    name: '小游戏',
    filterKey: 'games',
    icon: <Gamepad2 className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />,
    layout: 'small',
    showInFilter: true
  },
  {
    id: 4,
    name: '小练习',
    filterKey: 'exercises',
    icon: <Code className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />,
    layout: 'small',
    showInFilter: true
  },
  {
    id: 0,
    name: '未展示',
    filterKey: 'hidden',
    icon: <X className="h-4 w-4 text-slate-400 dark:text-slate-400" />,
    layout: 'small',
    showInFilter: false
  }
]

// 定义状态类型
interface AppState {
  allProjects: Project[]
  filteredProjects: Project[]
  loading: boolean
  filterLoading: boolean
  activeFilter: string
  searchQuery: string
  isDropdownOpen: boolean
  isMobile: boolean
  initialLoadComplete: boolean
  userInitiatedFilter: boolean
}

// 定义 action 类型
type AppAction =
  | { type: 'SET_ALL_PROJECTS'; payload: Project[] }
  | { type: 'SET_FILTERED_PROJECTS'; payload: Project[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_FILTER_LOADING'; payload: boolean }
  | { type: 'SET_ACTIVE_FILTER'; payload: string }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'TOGGLE_DROPDOWN' }
  | { type: 'SET_IS_MOBILE'; payload: boolean }
  | { type: 'SET_INITIAL_LOAD_COMPLETE'; payload: boolean }
  | { type: 'SET_USER_INITIATED_FILTER'; payload: boolean }

// 初始状态
const initialState: AppState = {
  allProjects: [],
  filteredProjects: [],
  loading: true,
  filterLoading: false,
  activeFilter: 'all',
  searchQuery: '',
  isDropdownOpen: false,
  isMobile: false,
  initialLoadComplete: false,
  userInitiatedFilter: false
}

// Reducer 函数
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_ALL_PROJECTS':
      return { ...state, allProjects: action.payload }
    case 'SET_FILTERED_PROJECTS':
      return { ...state, filteredProjects: action.payload }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_FILTER_LOADING':
      return { ...state, filterLoading: action.payload }
    case 'SET_ACTIVE_FILTER':
      return { ...state, activeFilter: action.payload }
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload }
    case 'TOGGLE_DROPDOWN':
      return { ...state, isDropdownOpen: !state.isDropdownOpen }
    case 'SET_IS_MOBILE':
      return { ...state, isMobile: action.payload }
    case 'SET_INITIAL_LOAD_COMPLETE':
      return { ...state, initialLoadComplete: action.payload }
    case 'SET_USER_INITIATED_FILTER':
      return { ...state, userInitiatedFilter: action.payload }
    default:
      return state
  }
}

// 防抖函数
const debounce = <T extends (...args: any[]) => void>(func: T, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

// 缓存键
const CACHE_KEY = 'projects_cache'
const CACHE_EXPIRY = 24 * 60 * 60 * 1000 // 24小时

// 缓存函数
const getCachedData = () => {
  if (typeof window === 'undefined') return null

  try {
    const cachedData = localStorage.getItem(CACHE_KEY)
    if (!cachedData) return null

    const { data, timestamp } = JSON.parse(cachedData)
    if (Date.now() - timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }

    return data
  } catch (error) {
    console.error('Error reading from cache:', error)
    return null
  }
}

// 设置缓存
const setCachedData = (data: Project[]) => {
  if (typeof window === 'undefined') return

  try {
    const cacheData = {
      data,
      timestamp: Date.now()
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
  } catch (error) {
    console.error('Error writing to cache:', error)
  }
}

export default function ProjectsPage() {
  const [state, dispatch] = useReducer(appReducer, initialState)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])
  // 检测屏幕尺寸
  useEffect(() => {
    const checkMobile = () => {
      dispatch({ type: 'SET_IS_MOBILE', payload: window.innerWidth < 640 })
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  const { token } = useUser()

  // API调用函数
  const fetchData = async <T extends Record<string, string | number | boolean | undefined>>(
    url: string,
    params?: T
  ) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const filteredParams = params
        ? Object.fromEntries(Object.entries(params).filter(([value]) => value !== undefined))
        : undefined

      const queryParams = filteredParams
        ? new URLSearchParams(
            Object.entries(filteredParams).map(([k, v]) => [k, String(v)])
          ).toString()
        : ''

      const fullUrl = queryParams ? `${url}?${queryParams}` : url
      const res = await fetch(fullUrl)
      const data = await res.json()
      dispatch({ type: 'SET_LOADING', payload: false })
      return data
    } catch (error) {
      console.log(`Error fetching ${url}:`, error)
      dispatch({ type: 'SET_LOADING', payload: false })
      return { code: 500, data: [] }
    }
  }

  // 获取项目数据 - 优先使用缓存
  useEffect(() => {
    const getProjects = async () => {
      // 先尝试从缓存获取数据
      const cachedProjects = getCachedData()
      if (cachedProjects) {
        // 过滤掉类型为0（不展示）的项目
        const displayProjects = cachedProjects.filter((project: Project) => project.type !== 0)
        // 按推荐状态排序，推荐项目在前
        displayProjects.sort((a: Project, b: Project) => {
          if (a.recommend && !b.recommend) return -1
          if (!a.recommend && b.recommend) return 1
          return 0
        })
        dispatch({ type: 'SET_ALL_PROJECTS', payload: displayProjects })
        dispatch({ type: 'SET_FILTERED_PROJECTS', payload: displayProjects })
        dispatch({ type: 'SET_INITIAL_LOAD_COMPLETE', payload: true })
      }

      // 然后从API获取最新数据
      const res = await fetchData(ENDPOINTS.PROJECTS)
      if (res.code === 200) {
        // 过滤掉类型为0（不展示）的项目
        const displayProjects = res.data.filter((project: Project) => project.type !== 0)
        // 按推荐状态排序，推荐项目在前
        displayProjects.sort((a: Project, b: Project) => {
          if (a.recommend && !b.recommend) return -1
          if (!a.recommend && b.recommend) return 1
          return 0
        })
        dispatch({ type: 'SET_ALL_PROJECTS', payload: displayProjects })
        dispatch({ type: 'SET_FILTERED_PROJECTS', payload: displayProjects })
        dispatch({ type: 'SET_INITIAL_LOAD_COMPLETE', payload: true })

        // 更新缓存
        setCachedData(displayProjects)
      }
    }

    getProjects()
  }, [token])

  // 防抖处理搜索
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      let result = [...state.allProjects]

      // 应用类型筛选
      if (state.activeFilter !== 'all') {
        const filterType = PROJECT_TYPES.find(type => type.filterKey === state.activeFilter)
        if (filterType) {
          result = result.filter(item => item.type === filterType.id)
        }
      }

      // 应用搜索筛选
      if (query) {
        const lowerQuery = query.toLowerCase()
        result = result.filter(
          item =>
            item.title.toLowerCase().includes(lowerQuery) ||
            item.content.toLowerCase().includes(lowerQuery) ||
            item.techs.toLowerCase().includes(lowerQuery)
        )
      }

      // 按推荐状态排序，推荐项目在前
      result.sort((a, b) => {
        if (a.recommend && !b.recommend) return -1
        if (!a.recommend && b.recommend) return 1
        return 0
      })

      dispatch({ type: 'SET_FILTERED_PROJECTS', payload: result })
      dispatch({ type: 'SET_FILTER_LOADING', payload: false }) // 筛选完成，隐藏过渡
    }, 300),
    [state.allProjects, state.activeFilter]
  )

  // 处理筛选变化 - 只有用户主动触发时才显示过渡动画
  const handleFilterChange = useCallback(() => {
    if (state.userInitiatedFilter && state.allProjects.length > 0 && state.initialLoadComplete) {
      dispatch({ type: 'SET_FILTER_LOADING', payload: true }) // 开始筛选，显示过渡
      debouncedSearch(state.searchQuery)
    }
  }, [
    state.searchQuery,
    state.activeFilter,
    debouncedSearch,
    state.allProjects,
    state.initialLoadComplete,
    state.userInitiatedFilter
  ])

  // 监听筛选条件变化
  useEffect(() => {
    handleFilterChange()
  }, [handleFilterChange])

  // 格式化技术栈列表
  const formatTechs = (techs: string) => {
    return techs.split(',').map(tech => tech.trim())
  }

  // 高亮搜索结果中的匹配文本
  const highlightText = (text: string, query: string) => {
    if (!query) return <span>{text}</span>

    const lowerQuery = query.toLowerCase()
    const lowerText = text.toLowerCase()
    const index = lowerText.indexOf(lowerQuery)

    if (index === -1) return <span>{text}</span>

    const before = text.substring(0, index)
    const match = text.substring(index, index + query.length)
    const after = text.substring(index + query.length)

    return (
      <span>
        {before}
        <span className="bg-blue-600/30 text-blue-900 dark:text-blue-100 px-0.5 rounded">
          {match}
        </span>
        {highlightText(after, query)}
      </span>
    )
  }

  // 获取项目类型配置
  const getProjectTypeConfig = (typeId: number): ProjectTypeConfig => {
    return PROJECT_TYPES.find(type => type.id === typeId) || PROJECT_TYPES[0]
  }

  // 渲染项目卡片
  const renderProjectCard = (project: Project) => {
    const typeConfig = getProjectTypeConfig(project.type)

    // 大卡片布局 - 仅用于完整项目
    if (typeConfig.layout === 'large') {
      return (
        <div
          key={project.id}
          className="bg-white dark:bg-slate-800/40 backdrop-blur-sm rounded-xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700/50 transition-all duration-300 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-800/50 group"
        >
          <Link href={project.url} target="_blank" rel="noopener noreferrer" className="block">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* 图片区域 */}
              <div className="relative h-40 md:h-48 overflow-hidden">
                <Image
                  src={project.pic_url || 'https://hanphone.top/images/bg_1.jpg'}
                  alt={project.title}
                  width={600}
                  height={320}
                  priority={true}
                  loading="eager"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
                  className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                />
                {/* 推荐标签 */}
                {project.recommend && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full flex items-center">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    <span className="text-xs font-medium">推荐</span>
                  </div>
                )}
              </div>
              {/* 内容区域 */}
              <div className="p-4 md:p-5">
                <div className="flex items-start">
                  <h3 className="text-lg font-bold mb-2 text-blue-900 dark:text-blue-100 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors line-clamp-2 flex-1">
                    {highlightText(project.title, state.searchQuery)}
                  </h3>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-sm mb-3 line-clamp-2">
                  {highlightText(project.content, state.searchQuery)}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {formatTechs(project.techs).map((tech, index) => (
                    <span
                      key={index}
                      className={`bg-slate-100 dark:bg-slate-700/50 text-blue-700 dark:text-blue-200 text-xs px-2 py-1 rounded border 
                        ${
                          state.searchQuery &&
                          tech.toLowerCase().includes(state.searchQuery.toLowerCase())
                            ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/30'
                            : 'border-slate-300 dark:border-slate-600 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                        } 
                        transition-colors`}
                    >
                      {highlightText(tech, state.searchQuery)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Link>
        </div>
      )
    }

    // 小卡片布局 - 用于工具箱、小游戏和小练习
    return (
      <div
        key={project.id}
        className="bg-white dark:bg-slate-800/40 backdrop-blur-sm rounded-xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700/50 transition-all duration-300 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-800/50 group"
      >
        <Link
          href={project.url || 'https://hanphone.top/images/bg_1.jpg'}
          target="_blank"
          rel="noopener"
          className="block h-full"
        >
          <div className="relative h-40 overflow-hidden">
            <Image
              src={project.pic_url || 'https://hanphone.top/images/bg_1.jpg'}
              alt={project.title}
              width={400}
              height={320}
              priority={true}
              loading="eager"
              className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
            />
            {/* 推荐标签 */}
            {project.recommend && (
              <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full flex items-center">
                <Star className="h-3 w-3 mr-1 fill-current" />
                <span className="text-xs font-medium">推荐</span>
              </div>
            )}
          </div>
          <div className="p-3">
            <div className="flex items-start">
              <h3 className="text-base font-semibold mb-1.5 text-blue-900 dark:text-blue-100 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors line-clamp-1 flex-1">
                {highlightText(project.title, state.searchQuery)}
              </h3>
            </div>
            <p className="text-slate-700 dark:text-slate-300 text-xs mb-2.5 line-clamp-2">
              {highlightText(project.content, state.searchQuery)}
            </p>
            <div className="flex flex-wrap gap-1">
              {formatTechs(project.techs).map((tech, index) => (
                <span
                  key={index}
                  className={`bg-slate-100 dark:bg-slate-700/50 text-blue-700 dark:text-blue-200 text-xs px-1.5 py-0.5 rounded border 
                    ${
                      state.searchQuery &&
                      tech.toLowerCase().includes(state.searchQuery.toLowerCase())
                        ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/30'
                        : 'border-slate-300 dark:border-slate-600'
                    } 
                  `}
                >
                  {highlightText(tech, state.searchQuery)}
                </span>
              ))}
            </div>
          </div>
        </Link>
      </div>
    )
  }

  // 获取当前筛选器的配置
  const getCurrentFilterConfig = () => {
    if (state.activeFilter === 'all') {
      return {
        label: '全部',
        icon: <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      }
    }

    const typeConfig = PROJECT_TYPES.find(type => type.filterKey === state.activeFilter)
    return typeConfig
      ? { label: typeConfig.name, icon: typeConfig.icon }
      : { label: '全部', icon: <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" /> }
  }

  // 渲染项目分组
  const renderProjectGroup = (typeId: number, projects: Project[]) => {
    if (projects.length === 0) return null

    const typeConfig = getProjectTypeConfig(typeId)

    return (
      <div key={typeId}>
        <h2 className="text-xl font-bold ml-2 mt-2 mb-2 text-slate-800 dark:text-slate-200 flex items-center">
          {typeConfig.icon}
          <span className="ml-2">{typeConfig.name}</span>
        </h2>
        {typeConfig.layout === 'large' ? (
          <div className="space-y-4">{projects.map(project => renderProjectCard(project))}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {projects.map(project => renderProjectCard(project))}
          </div>
        )}
      </div>
    )
  }

  // 渲染筛选后的内容
  const renderFilteredContent = () => {
    if (state.filteredProjects.length === 0) {
      return (
        <div className="text-center py-4 text-slate-500 dark:text-slate-400 fade-in">
          <div className="mb-4 flex justify-center">
            <Search className="h-12 w-12 text-slate-400 dark:text-slate-600" />
          </div>
          <h3 className="text-xl font-medium mb-2">未找到相关项目</h3>
          <p className="max-w-md mx-auto">尝试使用不同的搜索关键词，或清除筛选条件查看全部项目</p>
          <button
            onClick={() => {
              dispatch({ type: 'SET_SEARCH_QUERY', payload: '' })
              dispatch({ type: 'SET_ACTIVE_FILTER', payload: 'all' })
            }}
            className="mt-4 px-4 py-2 bg-blue-100 dark:bg-blue-600/20 hover:bg-blue-200 dark:hover:bg-blue-600/30 text-blue-700 dark:text-blue-300 rounded-lg transition-colors"
          >
            查看全部项目
          </button>
        </div>
      )
    }

    if (state.activeFilter === 'all') {
      // 显示所有分组
      return PROJECT_TYPES.filter(type => type.showInFilter).map(type => {
        const projects = state.filteredProjects.filter(project => project.type === type.id)
        return renderProjectGroup(type.id, projects)
      })
    } else {
      // 显示单个筛选类型
      const filterType = PROJECT_TYPES.find(type => type.filterKey === state.activeFilter)
      if (!filterType) return null

      return renderProjectGroup(filterType.id, state.filteredProjects)
    }
  }

  // 判断是否需要显示大卡片骨架屏
  const shouldShowLargeSkeleton = () => {
    return state.activeFilter === 'all' || state.activeFilter === 'projects'
  }

  // 判断是否需要显示小卡片骨架屏
  const shouldShowSmallSkeleton = () => {
    return (
      state.activeFilter === 'all' || ['tools', 'games', 'exercises'].includes(state.activeFilter)
    )
  }

  // 渲染筛选过渡骨架屏
  const renderFilterSkeleton = () => {
    return (
      <div className="space-y-4 filter-transition">
        {shouldShowLargeSkeleton() &&
          [1, 2].map(item => (
            <div
              key={`filter-large-${item}`}
              className="bg-white dark:bg-slate-800/40 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700/50 pulse-skeleton"
              style={{ opacity: 0.6 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="relative h-40 md:h-48 overflow-hidden">
                  <div className="absolute inset-0 pulse-skeleton"></div>
                </div>
                <div className="p-4 md:p-5">
                  <div className="h-6 bg-slate-200 dark:bg-slate-700/50 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-full mb-2"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-2/3 mb-3"></div>
                  <div className="flex flex-wrap gap-1.5">
                    <div className="h-5 bg-slate-200 dark:bg-slate-700/50 rounded w-16"></div>
                    <div className="h-5 bg-slate-200 dark:bg-slate-700/50 rounded w-20"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}

        {shouldShowSmallSkeleton() && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(item => (
              <div
                key={`filter-small-${item}`}
                className="bg-white dark:bg-slate-800/40 backdrop-blur-sm rounded-xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700/50 pulse-skeleton"
                style={{ opacity: 0.6 }}
              >
                <div className="relative h-40 overflow-hidden">
                  <div className="absolute inset-0 pulse-skeleton"></div>
                </div>
                <div className="p-3">
                  <div className="h-5 bg-slate-200 dark:bg-slate-700/50 rounded w-3/4 mb-1.5"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-700/50 rounded w-full mb-1"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-700/50 rounded w-2/3 mb-2.5"></div>
                  <div className="flex flex-wrap gap-1">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-12"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const currentFilter = getCurrentFilterConfig()

  return (
    <div>
      <div className="min-h-screen z-1 flex flex-col bg-white dark:bg-slate-950 overflow-hidden">
        <style jsx global>{`
          ::-webkit-scrollbar {
            display: none;
          }
          html {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }

          /* 加载动画样式 */
          .fade-in {
            animation: fadeIn 0.5s ease-out forwards;
          }

          .filter-transition {
            animation: filterFade 0.3s ease-out forwards;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes filterFade {
            from {
              opacity: 0.5;
            }
            to {
              opacity: 1;
            }
          }

          .pulse-skeleton {
            background: linear-gradient(
              90deg,
              rgba(120, 120, 120, 0.1) 25%,
              rgba(120, 120, 120, 0.2) 50%,
              rgba(120, 120, 120, 0.1) 75%
            );
            background-size: 200% 100%;
            animation: pulse 3s infinite;
          }

          @keyframes pulse {
            0% {
              background-position: 200% 0;
            }
            100% {
              background-position: -200% 0;
            }
          }
        `}</style>
        <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/40"></div>

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-1 lg:py-3 relative z-10 page-transition">
          {/* 搜索和筛选栏 */}
          <div className="mb-2 lg:mb-4 flex items-center justify-between">
            {/* 搜索栏 */}
            <div className="relative flex-1 max-w-[94%] min-w-[140px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-400 h-4 w-4" />
              <input
                type="text"
                placeholder="搜索项目标题、内容或技术栈..."
                value={state.searchQuery}
                onChange={e => {
                  dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value })
                  dispatch({ type: 'SET_USER_INITIATED_FILTER', payload: true }) // 用户主动搜索
                }}
                className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-800/40 border border-slate-300 dark:border-slate-700/50 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                style={{ height: '40px' }}
              />
              {state.searchQuery && (
                <button
                  onClick={() => dispatch({ type: 'SET_SEARCH_QUERY', payload: '' })}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  aria-label="清除搜索"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* 下拉筛选器 */}
            <div className="relative ml-2 shrink-0">
              <button
                onClick={() => dispatch({ type: 'TOGGLE_DROPDOWN' })}
                className="flex items-center justify-center px-3 bg-white dark:bg-slate-800/40 border border-slate-300 dark:border-slate-700/50 rounded-lg text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/40 transition-all"
                aria-label={currentFilter.label}
                style={{ height: '40px' }}
              >
                <div className="flex items-center justify-center">
                  {currentFilter.icon}
                  {!state.isMobile && <span className="ml-1">{currentFilter.label}</span>}
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform ml-${
                    state.isMobile ? 0 : 1
                  } ${state.isDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* 下拉列表 */}
              {state.isDropdownOpen && (
                <div className="absolute z-20 top-full right-0 mt-1 bg-white dark:bg-slate-800/90 backdrop-blur-sm rounded-lg shadow-md border border-slate-300 dark:border-slate-700/50 overflow-hidden min-w-[140px]">
                  {[
                    {
                      type: 'all',
                      label: '全部',
                      icon: <Layers className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                    },
                    ...PROJECT_TYPES.filter(type => type.showInFilter).map(type => ({
                      type: type.filterKey,
                      label: type.name,
                      icon: type.icon
                    }))
                  ].map(item => (
                    <button
                      key={item.type}
                      onClick={() => {
                        dispatch({ type: 'SET_ACTIVE_FILTER', payload: item.type })
                        dispatch({ type: 'TOGGLE_DROPDOWN' })
                        dispatch({ type: 'SET_USER_INITIATED_FILTER', payload: true }) // 用户主动筛选
                      }}
                      className={`w-full flex items-center px-4 py-2.5 text-left transition-all
                        ${
                          state.activeFilter === item.type
                            ? 'bg-blue-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-300 border-l-2 border-blue-500'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/40 border-l-2 border-transparent'
                        }`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {state.loading ? (
            // 初始加载骨架屏
            <div className="space-y-4">
              {shouldShowLargeSkeleton() &&
                [1, 2, 3].map(item => (
                  <div
                    key={`large-${item}`}
                    className="bg-white dark:bg-slate-800/40 backdrop-blur-sm rounded-xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700/50 pulse-skeleton"
                    style={{ opacity: 0.7 }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2">
                      <div className="relative h-40 md:h-48 overflow-hidden">
                        <div className="absolute inset-0 pulse-skeleton"></div>
                      </div>
                      <div className="p-4 md:p-5">
                        <div className="h-6 bg-slate-200 dark:bg-slate-700/50 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-full mb-2"></div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-full mb-3"></div>
                        <div className="flex flex-wrap gap-1.5">
                          <div className="h-5 bg-slate-200 dark:bg-slate-700/50 rounded w-16"></div>
                          <div className="h-5 bg-slate-200 dark:bg-slate-700/50 rounded w-20"></div>
                          <div className="h-5 bg-slate-200 dark:bg-slate-700/50 rounded w-14"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

              {shouldShowSmallSkeleton() && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(item => (
                    <div
                      key={`small-${item}`}
                      className="bg-white dark:bg-slate-800/40 backdrop-blur-sm rounded-xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700/50 pulse-skeleton"
                      style={{ opacity: 0.7 }}
                    >
                      <div className="relative h-40 overflow-hidden">
                        <div className="absolute inset-0 pulse-skeleton"></div>
                      </div>
                      <div className="p-3">
                        <div className="h-5 bg-slate-200 dark:bg-slate-700/50 rounded w-3/4 mb-1.5"></div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-700/50 rounded w-full mb-1"></div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-700/50 rounded w-2/3 mb-2.5"></div>
                        <div className="flex flex-wrap gap-1">
                          <div className="h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-12"></div>
                          <div className="h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-16"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : state.filterLoading ? (
            // 筛选过渡骨架屏
            renderFilterSkeleton()
          ) : (
            // 为实际内容添加渐显动画
            <div className={`space-y-6 ${state.initialLoadComplete ? 'fade-in' : ''}`}>
              {renderFilteredContent()}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
