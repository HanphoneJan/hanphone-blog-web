'use client'
import { useEffect, useReducer, useCallback, useMemo } from 'react'
import Image from 'next/image'
import {
  User,
  Code,
  BookOpen,
  Heart,
  MessageSquare,
  Mail,
  Video,
  Music,
  Book,
  Gamepad,
  Dumbbell,
  Compass,
  MessageCircle,
  FileBadge,
  BookImage
} from 'lucide-react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGithub, faBilibili } from '@fortawesome/free-brands-svg-icons'
import { useUser } from '@/contexts/UserContext'
import { ENDPOINTS } from '@/lib/api'
import Link from 'next/link'

// 定义数据类型接口
interface Item {
  id: number
  category: 'skill' | 'work' | 'hobby' | 'evaluation'
  name: string
  description: string | null
  pic_url: string | null
  url: string | null
  icon_src: string | null
  rank: number | null // 添加rank字段
}

// 定义状态类型
interface AppState {
  screenWidth: number
  showSectionId: string
  data: {
    skills: Item[]
    works: Item[]
    hobbys: Item[]
    evaluations: Item[]
  }
  loading: boolean
  mounted: boolean
  error: string | null
}

// 定义action类型
type AppAction =
  | { type: 'SET_SCREEN_WIDTH'; payload: number }
  | { type: 'SET_SHOW_SECTION_ID'; payload: string }
  | { type: 'SET_DATA'; payload: Item[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_MOUNTED'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }

// 初始状态
const initialState: AppState = {
  screenWidth: 1200,
  showSectionId: '#info',
  data: {
    skills: [],
    works: [],
    hobbys: [],
    evaluations: []
  },
  loading: true,
  mounted: false,
  error: null
}

// 排序函数：根据rank字段排序，rank为0或空则排在最后
const sortByRank = (items: Item[]): Item[] => {
  return [...items].sort((a, b) => {
    // 处理rank为null或0的情况，这些应该排在最后
    const aRank = a.rank === null || a.rank === 0 ? Infinity : a.rank
    const bRank = b.rank === null || b.rank === 0 ? Infinity : b.rank

    // 按rank升序排序（1为最高优先级）
    return aRank - bRank
  })
}

// Reducer函数
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SCREEN_WIDTH':
      return { ...state, screenWidth: action.payload }
    case 'SET_SHOW_SECTION_ID':
      return { ...state, showSectionId: action.payload }
    case 'SET_DATA':
      const skills = sortByRank(action.payload.filter((item: Item) => item.category === 'skill'))
      const works = sortByRank(action.payload.filter((item: Item) => item.category === 'work'))
      const hobbys = sortByRank(action.payload.filter((item: Item) => item.category === 'hobby'))
      const evaluations = sortByRank(
        action.payload.filter((item: Item) => item.category === 'evaluation')
      )
      return {
        ...state,
        data: { skills, works, hobbys, evaluations },
        loading: false,
        error: null
      }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_MOUNTED':
      return { ...state, mounted: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }
    default:
      return state
  }
}

// 简单的内存缓存
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

// 缓存API调用
const cachedFetch = async (url: string, params?: unknown) => {
  const queryParams = params ? new URLSearchParams(Object.entries(params)).toString() : ''
  const fullUrl = queryParams ? `${url}?${queryParams}` : url
  const cacheKey = fullUrl

  // 检查缓存
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey)!
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data
    }
  }

  try {
    const res = await fetch(fullUrl)
    const data = await res.json()

    // 更新缓存
    cache.set(cacheKey, { data, timestamp: Date.now() })

    return data
  } catch (error) {
    console.log(`Error fetching ${url}:`, error)
    return { code: 500, data: [] }
  }
}

export default function AboutPage() {
  const [state, dispatch] = useReducer(appReducer, initialState)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])
  const { token } = useUser()

  // 确保组件在客户端挂载
  useEffect(() => {
    dispatch({ type: 'SET_MOUNTED', payload: true })
    dispatch({ type: 'SET_SCREEN_WIDTH', payload: window.innerWidth })
  }, [])

  // 监听屏幕尺寸变化 - 只在客户端执行
  useEffect(() => {
    if (!state.mounted) return

    const handleResize = () => {
      dispatch({ type: 'SET_SCREEN_WIDTH', payload: window.innerWidth })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [state.mounted])

  // 从后端获取数据 - 只在客户端执行
  useEffect(() => {
    if (!state.mounted) return

    const getPersonalInfo = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true })
        const res = await cachedFetch(ENDPOINTS.USER.PERSONINFOS)
        if (res.flag && res.code === 200) {
          dispatch({ type: 'SET_DATA', payload: res.data })
        } else {
          dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch data' })
        }
      } catch (error) {
        console.error('Error fetching personal info:', error)
        dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch data' })
      }
    }

    getPersonalInfo()
  }, [token, state.mounted])

  // 导航列表数据 - 使用useMemo缓存
  const introduceList = useMemo(
    () => [
      {
        id: 0,
        title: '资料',
        name: '#info',
        icon: <User className="h-5 w-5" />
      },
      {
        id: 1,
        title: '技能',
        name: '#skills',
        icon: <Code className="h-5 w-5" />
      },
      {
        id: 2,
        title: '爱好',
        name: '#hobbys',
        icon: <Heart className="h-5 w-5" />
      },
      {
        id: 3,
        title: '作品',
        name: '#works',
        icon: <BookOpen className="h-5 w-5" />
      },
      {
        id: 4,
        title: '评价',
        name: '#summary',
        icon: <MessageSquare className="h-5 w-5" />
      }
    ],
    []
  )

  // 图标获取函数 - 使用useCallback缓存
  const getIcon = useCallback((icon_src: string) => {
    switch (icon_src) {
      case 'music':
        return <Music className="h-5 w-5" />
      case 'video':
        return <Video className="h-5 w-5" />
      case 'sport':
        return <Dumbbell className="h-5 w-5" />
      case 'literature':
        return <Book className="h-5 w-5" />
      case 'game':
        return <Gamepad className="h-5 w-5" />
      case 'code':
        return <Code className="h-5 w-5" />
      default:
        return <Book className="h-5 w-5" />
    }
  }, [])

  // 技能图标获取函数 - 使用useCallback缓存
  const getSkillIcon = useCallback((icon_src: string) => {
    switch (icon_src) {
      case 'music':
        return <Music className="h-5 sm:h-7 text-blue-400" />
      case 'video':
        return <Video className="h-5 sm:h-7 text-blue-400" />
      case 'sport':
        return <Dumbbell className="h-5 sm:h-7 text-blue-400" />
      case 'literature':
        return <Book className="h-5 sm:h-7 text-blue-400" />
      case 'game':
        return <Gamepad className="h-5 sm:h-7 text-blue-400" />
      case 'code':
        return <Code className="h-5 sm:h-7 text-blue-400" />
      default:
        return <Code className="h-5 sm:h-7 text-blue-400" />
    }
  }, [])

  // 切换显示的 section - 使用useCallback缓存
  const showSection = useCallback((name: string) => {
    dispatch({ type: 'SET_SHOW_SECTION_ID', payload: name })
  }, [])

  // 如果组件还未挂载，返回一个简单的加载状态或空内容
  if (!state.mounted) {
    return <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/40"></div>
  }

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
        `}</style>
        <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/40"></div>
        <main className="flex-1 w-full max-w-7xl mx-auto lg:px-3 py-0 lg:py-1 relative z-10 page-transition">
          <div className="flex flex-col md:flex-row gap-0 md:gap-2 lg:gap-4">
            {/* 侧边栏 */}
            <aside
              className={`bg-white/80 dark:bg-slate-800/40 md:rounded-xl border border-slate-200 dark:border-slate-700/50 transition-all duration-300 ${
                state.screenWidth <= 768
                  ? 'w-full pt-3 flex flex-col items-center' // 减少内边距
                  : 'w-64 h-128 flex-shrink-0 flex flex-col items-center'
              }
              `}
            >
              {/* 头像区域 - 移动端缩小头像 */}
              <div
                className={`rounded-full bg-slate-200 dark:bg-slate-700 p-1 my-2 transition-transform duration-500 border border-slate-300 dark:border-slate-600 ${
                  state.screenWidth <= 768 ? 'w-16 h-16' : 'w-20 h-20 md:w-28 md:h-28 my-4'
                }`}
              >
                <div className="relative w-full h-full rounded-full overflow-hidden">
                  <Image
                    src="https://hanphone.top/images/zhuxun.jpg"
                    alt="Hanphone"
                    height={196}
                    width={196}
                    priority={true}
                    loading="eager"
                    className="object-cover transition-transform duration-1500 hover:rotate-360"
                  />
                </div>
              </div>

              {/* 导航区域 - 移动端更紧凑 */}
              <nav
                className={`w-full transition-all duration-300 ${
                  state.screenWidth <= 768
                    ? 'bg-white/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 border-b-0 overflow-hidden' // 移动端样式
                    : 'flex flex-col px-2 mt-4' // 桌面端保持原样
                }`}
              >
                {state.screenWidth <= 768 ? (
                  // 移动端布局
                  <div className="flex overflow-x-auto scrollbar-hide">
                    {introduceList.map(intro => (
                      <button
                        key={intro.id}
                        onClick={() => showSection(intro.name)}
                        className={`flex-1 min-w-[50px] px-2 pt-2 pb-1 transition-all duration-500 ${
                          state.showSectionId === intro.name
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border-b-2 border-blue-500'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/40 border-b-2 border-transparent'
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span className="text-blue-600 dark:text-blue-300">{intro.icon}</span>
                          <span className="text-xs">{intro.title}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  // 桌面端布局 - 保持原样
                  <div className="flex flex-col justify-center">
                    {introduceList.map(intro => (
                      <button
                        key={intro.id}
                        onClick={() => showSection(intro.name)}
                        className={`flex items-center justify-center px-3 py-2 sm:px-4 sm:py-3 transition-colors duration-500 rounded-sm hover:bg-blue-100 dark:hover:bg-blue-900/20 ${
                          state.showSectionId === intro.name
                            ? 'bg-blue-100 dark:bg-blue-900/30 font-medium'
                            : ''
                        }`}
                      >
                        <span className="mr-3 text-blue-600 dark:text-blue-300">{intro.icon}</span>
                        <span className="text-slate-700 dark:text-slate-300 text-sm">
                          {intro.title}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </nav>
            </aside>

            {/* 主内容区 */}
            <div className={`flex-1 transition-all duration-300`}>
              {/* 个人资料 section */}
              {state.showSectionId === '#info' && (
                <section className="bg-white/80 dark:bg-slate-800/40 md:rounded-xl shadow-sm p-4 sm:p-6  md:border border-slate-200 dark:border-slate-700/50 transition-all duration-500 hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-600/50">
                  <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center text-slate-800 dark:text-blue-100">
                    <User className="mr-2 sm:mr-3 h-5 sm:h-6 text-blue-600 dark:text-blue-400" />
                    个人资料
                  </h2>
                  <div className="grid grid-cols-1 gap-4">
                    {/* 移动端单列布局更紧凑 */}
                    <div>
                      <p className="mb-2 sm:mb-3 flex items-center text-slate-700 dark:text-slate-300">
                        <span className="mr-2 text-blue-600 dark:text-blue-400">姓名：</span>
                        寒枫
                      </p>
                      <p className="mb-2 sm:mb-3 flex items-center text-slate-700 dark:text-slate-300">
                        <span className="mr-2 text-blue-600 dark:text-blue-400">描述：</span>
                        一个焦虑于找工作的大学生
                      </p>
                      <p className="mb-2 sm:mb-3 flex items-center text-slate-700 dark:text-slate-300">
                        <span className="mr-2 text-blue-600 dark:text-blue-400">技术方向：</span>
                        嵌入式AI、多模态大模型、全栈开发
                      </p>
                      <p className="mb-2 sm:mb-3 flex items-center text-slate-700 dark:text-slate-300">
                        <span className="mr-2 text-blue-600 dark:text-blue-400">个性签名：</span>
                        不鹜于虚声
                      </p>
                    </div>
                    <div>
                      <p className="my-3 flex items-center text-slate-700 dark:text-slate-300">
                        <FontAwesomeIcon
                          icon={faBilibili}
                          color="#3B82F6"
                          className="mr-2 h-4 w-4"
                        />
                        <span className="mr-1 text-md align-middle">Bilibili：</span>
                        <a
                          href="https://space.bilibili.com/649062555/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 hover:underline transition-colors text-md align-middle"
                        >
                          寒枫君
                        </a>
                      </p>
                      <p className="my-3 flex items-center text-slate-700 dark:text-slate-300">
                        <FontAwesomeIcon icon={faGithub} color="#3B82F6" className="mr-2 h-4 w-4" />
                        <span className="mr-1 text-md align-middle">Github：</span>
                        <a
                          href="https://github.com/HanphoneJan/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 hover:underline transition-colors text-md align-middle"
                        >
                          HanphoneJan
                        </a>
                      </p>
                      <p className="my-3 flex items-center text-slate-700 dark:text-slate-300">
                        <Compass className="ml-0.5 mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="mr-1 text-md align-middle">公众号：</span>
                        <a
                          href="https://hanphone.top/images/云林有风公众号.jpg"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 hover:underline transition-colors text-md align-middle"
                        >
                          云林有风
                        </a>
                      </p>
                        <p className="my-3 flex items-center text-slate-700 dark:text-slate-300">
                          <Mail className="ml-0.5 mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="mr-1 text-md align-middle">邮箱：</span>
                          <a
                            href="mailto:Janhizian@163.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 hover:underline transition-colors text-md align-middle"
                          >
                            Janhizian@163.com
                          </a>
                        </p>
                        <p className="my-3 flex items-center text-slate-700 dark:text-slate-300">
                          <BookImage className="ml-0.5 mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <Link
                            href="/atlas"
                            className="text-blue-600 dark:text-blue-400 text-md align-middle hover:underline"
                          >
                            照片墙
                          </Link>
                        </p>

                      <p className="my-3 flex items-center text-slate-700 dark:text-slate-300">
                        <MessageCircle className="ml-0.5 mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <Link
                          href="/private-chat"
                          className="text-blue-600 dark:text-blue-400 text-md align-middle hover:underline"
                        >
                          私信我
                        </Link>
                      </p>
                        <p className="my-3 flex items-center text-slate-700 dark:text-slate-300">
                        <FileBadge className="ml-0.5 mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <a
                          href="https://www.hanphone.top/resume"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 hover:underline transition-colors text-md align-middle"
                        >
                          简历
                        </a>
                      </p>
                    </div>
                  </div>
                </section>
              )}
              {/* 技能 section */}
              {state.showSectionId === '#skills' && (
                <section className="bg-white/80 dark:bg-slate-800/40 md:rounded-xl shadow-sm p-4 sm:p-6 border border-slate-200 dark:border-slate-700/50 transition-all duration-500 hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-600/50">
                  <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center text-slate-800 dark:text-blue-100">
                    <Code className="mr-2 sm:mr-3 h-5 sm:h-6 text-blue-600 dark:text-blue-400" />
                    掌握的技能
                  </h2>

                  {state.loading ? (
                    <div className={`grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-8`}>
                      {[1, 2, 3, 4].map(item => (
                        <div
                          key={item}
                          className="flex flex-col items-center text-center p-2 sm:p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/50 animate-pulse"
                        >
                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-200 dark:bg-slate-700/60 rounded-full shadow-sm flex items-center justify-center mb-2 sm:mb-3"></div>
                          <div className="h-4 sm:h-5 bg-slate-200 dark:bg-slate-700/50 rounded w-3/4 mb-1 sm:mb-2"></div>
                          <div className="h-2 sm:h-3 bg-slate-200 dark:bg-slate-700/50 rounded w-full mb-1"></div>
                          <div className="h-2 sm:h-3 bg-slate-200 dark:bg-slate-700/50 rounded w-full"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-8`}>
                      {state.data.skills.map(skill =>
                        skill.url ? (
                          <a
                            key={skill.id}
                            href={skill.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center text-center p-2 sm:p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 hover:shadow-sm hover:scale-[1.02]"
                          >
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 dark:bg-slate-700/60 rounded-full shadow-sm flex items-center justify-center mb-2 sm:mb-3 transition-all duration-300 hover:shadow-md hover:scale-110">
                              <span>{getSkillIcon(skill.icon_src)}</span>
                            </div>
                            <h3 className="text-sm sm:text-base font-semibold mb-1 text-slate-800 dark:text-blue-100">
                              {skill.name}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-300 text-xs">
                              {skill.description}
                            </p>
                          </a>
                        ) : (
                          <div
                            key={skill.id}
                            className="flex flex-col items-center text-center p-2 sm:p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300"
                          >
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 dark:bg-slate-700/60 rounded-full shadow-sm flex items-center justify-center mb-2 sm:mb-3 transition-all duration-300 hover:shadow-md hover:scale-110">
                              <span>{getSkillIcon(skill.icon_src)}</span>
                            </div>
                            <h3 className="text-sm sm:text-base font-semibold mb-1 text-slate-800 dark:text-blue-100">
                              {skill.name}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-300 text-xs">
                              {skill.description}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </section>
              )}
              {/* 作品 section */}
              {state.showSectionId === '#works' && (
                <section className="bg-white/80 dark:bg-slate-800/40 md:rounded-xl shadow-sm p-4 sm:p-6 border border-slate-200 dark:border-slate-700/50 transition-all duration-500 hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-600/50">
                  <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center text-slate-800 dark:text-blue-100">
                    <BookOpen className="mr-2 sm:mr-3 h-5 sm:h-6 text-blue-600 dark:text-blue-400" />
                    个人作品
                  </h2>

                  {state.loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {[1, 2, 3, 4, 5, 6].map(item => (
                        <div
                          key={item}
                          className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden animate-pulse"
                        >
                          <div className="h-36 sm:h-40 bg-slate-200 dark:bg-slate-700/50"></div>
                          <div className="p-3 sm:p-4">
                            <div className="flex items-center mb-2">
                              <div className="w-5 h-5 bg-slate-200 dark:bg-slate-700/50 rounded mr-2"></div>
                              <div className="h-5 sm:h-6 bg-slate-200 dark:bg-slate-700/50 rounded w-3/4"></div>
                            </div>
                            <div className="h-3 sm:h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-full mb-2"></div>
                            <div className="h-3 sm:h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-2/3 mb-3 sm:mb-4"></div>
                            <div className="h-4 sm:h-5 bg-slate-200 dark:bg-slate-700/50 rounded w-1/4"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {state.data.works.map(work => (
                        <div
                          key={work.id}
                          className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:shadow-sm flex flex-col h-full"
                        >
                          {work.pic_url && (
                            <div className="h-36 sm:h-40 overflow-hidden relative">
                              <Image
                                src={work.pic_url}
                                alt={work.name}
                                fill
                                priority={true}
                                loading="eager"
                                className="object-cover w-full h-full transition-transform duration-700 hover:scale-110"
                              />
                            </div>
                          )}
                          <div className="p-3 sm:p-4 flex flex-col flex-grow">
                            <div className="flex items-center mb-2">
                              <span className="mr-2 text-blue-600 dark:text-blue-400">
                                {getIcon(work.icon_src)}
                              </span>
                              <h3 className="text-base sm:text-xl font-semibold text-slate-800 dark:text-blue-100">
                                {work.name}
                              </h3>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm mb-3 flex-grow">
                              {work.url ? (
                                <a
                                  href={work.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300"
                                >
                                  {work.description}
                                </a>
                              ) : (
                                <span>{work.description}</span>
                              )}
                            </p>
                            {work.url && (
                              <div className="mt-auto flex justify-start">
                                <a
                                  href={work.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 text-xs sm:text-sm hover:underline transition-colors"
                                >
                                  查看详情 →
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
              {/* 爱好 section */}
              {state.showSectionId === '#hobbys' && (
                <section className="bg-white/80 dark:bg-slate-800/40 md:rounded-xl shadow-sm p-4 sm:p-6 border border-slate-200 dark:border-slate-700/50 transition-all duration-500 hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-600/50">
                  <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center text-slate-800 dark:text-blue-100">
                    <Heart className="mr-2 sm:mr-3 h-5 sm:h-6 text-blue-600 dark:text-blue-400" />
                    我的爱好
                  </h2>

                  {state.loading ? (
                    <div
                      className={`grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4`}
                    >
                      {[1, 2, 3, 4, 5, 6].map(item => (
                        <div
                          key={item}
                          className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden animate-pulse"
                        >
                          <div className="h-28 sm:h-40 bg-slate-200 dark:bg-slate-700/50"></div>
                          <div className="p-2 sm:p-4">
                            <div className="flex items-center mb-1">
                              <div className="w-4 h-4 bg-slate-200 dark:bg-slate-700/50 rounded mr-2"></div>
                              <div className="h-4 sm:h-6 bg-slate-200 dark:bg-slate-700/50 rounded w-3/4"></div>
                            </div>
                            <div className="h-2 sm:h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-full mb-1"></div>
                            <div className="h-2 sm:h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-2/3"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      className={`grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4`}
                    >
                      {state.data.hobbys.map(hobby =>
                        hobby.url ? (
                          <a
                            key={hobby.id}
                            href={hobby.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:shadow-sm hover:scale-[1.02] flex flex-col h-full"
                          >
                            {hobby.pic_url && (
                              <div className="h-28 sm:h-40 overflow-hidden relative">
                                <Image
                                  src={hobby.pic_url}
                                  alt={hobby.name}
                                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 720px"
                                  fill
                                  priority={true}
                                  loading="eager"
                                  className="object-fit w-full h-full transition-transform duration-700 hover:scale-110"
                                />
                              </div>
                            )}
                            <div className="p-2 sm:p-4 flex flex-col flex-grow">
                              <div className="flex items-center mb-1">
                                <span className="mr-2 text-blue-600 dark:text-blue-400">
                                  {getIcon(hobby.icon_src)}
                                </span>
                                <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-blue-100">
                                  {hobby.name}
                                </h3>
                              </div>
                              <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
                                {hobby.description}
                              </p>
                            </div>
                          </a>
                        ) : (
                          <div
                            key={hobby.id}
                            className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:shadow-sm"
                          >
                            {hobby.pic_url && (
                              <div className="h-28 sm:h-40 overflow-hidden relative">
                                <Image
                                  src={hobby.pic_url}
                                  alt={hobby.name}
                                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 720px"
                                  width={480}
                                  height={480}
                                  priority={true}
                                  loading="eager"
                                  className="object-fit w-full h-full transition-transform duration-700 hover:scale-110"
                                />
                              </div>
                            )}
                            <div className="p-2 sm:p-4">
                              <div className="flex items-center mb-1">
                                <span className="mr-2 text-blue-600 dark:text-blue-400">
                                  {getIcon(hobby.icon_src)}
                                </span>
                                <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-blue-100">
                                  {hobby.name}
                                </h3>
                              </div>
                              <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
                                {hobby.description}
                              </p>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </section>
              )}
              {/* 个人评价 section */}
              {state.showSectionId === '#summary' && (
                <section className="bg-white/80 dark:bg-slate-800/40 md:rounded-xl shadow-sm p-4 sm:p-6 border border-slate-200 dark:border-slate-700/50 transition-all duration-500 hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-600/50">
                  <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center text-slate-800 dark:text-blue-100">
                    <MessageSquare className="mr-2 sm:mr-3 h-5 sm:h-6 text-blue-600 dark:text-blue-400" />
                    个人评价
                  </h2>

                  {state.loading ? (
                    <ul className="space-y-3 sm:space-y-4">
                      {[1, 2, 3, 4].map(item => (
                        <li
                          key={item}
                          className="bg-slate-50 dark:bg-slate-800/60 rounded-lg py-2 sm:py-3 px-4 sm:px-5 border-l-4 border-blue-500 animate-pulse"
                        >
                          <div className="h-3 sm:h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-full mb-2"></div>
                          <div className="h-3 sm:h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-3/4"></div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <ul className="space-y-3 sm:space-y-4">
                      {state.data.evaluations.map(item => (
                        <li
                          key={item.id}
                          className="bg-slate-50 dark:bg-slate-800/60 rounded-lg py-2 sm:py-3 px-4 sm:px-5 border-l-4 border-blue-500 text-slate-700 dark:text-slate-300 text-sm transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          {item.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
