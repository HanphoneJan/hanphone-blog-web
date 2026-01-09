'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Globe,
  Star,
  Loader2,
  AlertCircle,
  Users,
  Link2,
  ToolCase,
  BookOpen,
  CircleQuestionMark,
  Search,
  Layers,
  ChevronDown,
  Calendar,
  Grid,
  List
} from 'lucide-react'
import { ENDPOINTS } from '@/lib/api'

interface FriendLink {
  id: number
  type: 'friend' | 'tool' | 'blog' | 'resource'
  name: string
  description: string
  link_url: string
  url: string
  avatar: string
  color: string
  recommend: boolean
  createTime: string
}

// 定义友链类型
const FRIEND_LINK_TYPES = [
  {
    filterKey: 'all',
    name: '全部类型',
    icon: <Layers className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />,
    showInFilter: true
  },
  {
    filterKey: 'friend',
    name: '友情链接',
    icon: <Users className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />,
    showInFilter: true
  },
  {
    filterKey: 'tool',
    name: '工具链接',
    icon: <ToolCase className="h-4 w-4 mr-2 text-purple-600 dark:text-purple-400" />,
    showInFilter: true
  },
  {
    filterKey: 'blog',
    name: '文章链接',
    icon: <BookOpen className="h-4 w-4 mr-2 text-orange-600 dark:text-orange-400" />,
    showInFilter: true
  },
  {
    filterKey: 'resource',
    name: '资源链接',
    icon: <Link2 className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />,
    showInFilter: true
  }
]

// 定义排序类型
const SORT_OPTIONS = [
  {
    key: 'name',
    name: '按名称排序',
    icon: <Layers className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
  },
  {
    key: 'date',
    name: '按日期排序',
    icon: <Calendar className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
  },
  {
    key: 'recommended',
    name: '按推荐排序',
    icon: <Star className="h-4 w-4 mr-2 text-amber-600 dark:text-amber-400" />
  }
]

// 获取网站元数据的函数 - 使用API路由
async function fetchWebsiteMetadata(url: string) {
  try {
    // 新增：提取当前友链的纯净域名（去除www.、协议、端口）
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    const validDomain = urlObj.hostname.replace(/^www\./, '').toLowerCase();

    // 调用API时，同时传递原始URL和提取的合法域名
    const response = await fetch(
      `/next-api/metadata?url=${encodeURIComponent(url)}&validDomain=${encodeURIComponent(validDomain)}`,
      { cache: 'no-store' }
    );


    // 检查响应内容类型
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Invalid response format')
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    // 检查是否有错误
    if (data.error) {
      throw new Error(data.error)
    }

    return {
      description: data.description || '',
      avatar: data.avatar || '',
      title: data.title || new URL(url).hostname
    }
  } catch (error) {
    console.error('Error fetching metadata:', error)
    // 备用方案
    const hostname = new URL(url).hostname
    return {
      description: '',
      avatar: `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`,
      title: hostname
    }
  }
}

// 获取友链数据的函数
async function fetchFriendLinks() {
  try {
    const response = await fetch(ENDPOINTS.FRIENDLINKS, {
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.code !== 200) {
      throw new Error(data.message || 'Failed to fetch friend links')
    }

    return data.data || [] // 使用data字段而不是payload
  } catch (error) {
    console.error('Error fetching friend links:', error)
    return []
  }
}

export default function FriendLinksPage() {
  const [friendLinks, setFriendLinks] = useState<FriendLink[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<'all' | 'friend' | 'resource' | 'tool' | 'blog'>(
    'all'
  )
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'recommended'>('name')
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  )
  const [loading, setLoading] = useState(true)
  const [fetchingUrls, setFetchingUrls] = useState<Set<number>>(new Set())
  const [apiError, setApiError] = useState<string | null>(null)

  // 下拉菜单状态
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false)
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false)

  // 布局状态 - 为每种类型单独设置
  const [friendLayout, setFriendLayout] = useState<'card' | 'list'>('card')
  const [toolLayout, setToolLayout] = useState<'card' | 'list'>('card')
  const [blogLayout, setBlogLayout] = useState<'card' | 'list'>('card')
  const [resourceLayout, setResourceLayout] = useState<'card' | 'list'>('card')

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 初始化时获取友链数据和元数据
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true)
      setApiError(null)

      try {
        // 获取友链数据
        const links = await fetchFriendLinks()

        if (links.length === 0) {
          setLoading(false)
          return
        }

        // 先设置友链数据
        setFriendLinks(links)

        // 修改判断逻辑：检查是否需要更新元数据
        // 1. 没有描述或描述为"暂无描述"等通用描述
        // 2. 没有头像或头像为默认头像
        // 3. 名称与URL域名不匹配（可能需要更准确的标题）
        const linksToUpdate = links.filter(link => {
          const hasGenericDescription =
            !link.description || link.description === '暂无描述' || link.description === ''

          const hasDefaultAvatar =
            !link.avatar || link.avatar === '/default-avatar.png' || link.avatar === ''

          // 检查名称是否与URL域名匹配
          let nameMatchesDomain = true
          try {
            const urlHostname = new URL(link.url).hostname
            if (!link.name.toLowerCase().includes(urlHostname.replace('www.', ''))) {
              nameMatchesDomain = false
            }
          } catch (e) {
            // 如果URL解析失败，也尝试获取元数据
            nameMatchesDomain = false
            console.log('Error parsing URL for domain match check:', e)
          }

          return hasGenericDescription || hasDefaultAvatar || !nameMatchesDomain
        })

        if (linksToUpdate.length === 0) {
          setLoading(false)
          return
        }

        // 限制并发请求数量，避免一次性请求过多
        const batchSize = 5
        for (let i = 0; i < linksToUpdate.length; i += batchSize) {
          const batch = linksToUpdate.slice(i, i + batchSize)

          await Promise.all(
            batch.map(async link => {
              setFetchingUrls(prev => new Set(prev).add(link.id))

              try {
                const metadata = await fetchWebsiteMetadata(link.url)

                // 更新链接信息
                setFriendLinks(prevLinks => {
                  const newLinks = [...prevLinks]
                  const linkIndex = newLinks.findIndex(l => l.id === link.id)

                  if (linkIndex !== -1) {
                    newLinks[linkIndex] = {
                      ...newLinks[linkIndex],
                      // 只有当原始描述为空或为通用描述时才更新
                      description:
                        !newLinks[linkIndex].description ||
                        newLinks[linkIndex].description === '暂无描述' ||
                        newLinks[linkIndex].description === ''
                          ? metadata.description
                          : newLinks[linkIndex].description,
                      // 只有当原始头像为空或为默认头像时才更新
                      avatar:
                        !newLinks[linkIndex].avatar ||
                        newLinks[linkIndex].avatar === '/default-avatar.png' ||
                        newLinks[linkIndex].avatar === ''
                          ? metadata.avatar
                          : newLinks[linkIndex].avatar,
                      // 只有当名称与域名不匹配时才更新
                      name: newLinks[linkIndex].name || metadata.title
                    }
                  }

                  return newLinks
                })
              } catch (error) {
                console.error(`Error fetching metadata for ${link.url}:`, error)
              } finally {
                setFetchingUrls(prev => {
                  const newSet = new Set(prev)
                  newSet.delete(link.id)
                  return newSet
                })
              }
            })
          )
        }
      } catch (error) {
        console.error('Error in fetchAllData:', error)
        setApiError('获取友链信息时出错，请检查API是否正确设置')
      } finally {
        setLoading(false)
      }
    }

    fetchAllData()
  }, [])

  const isMobile = screenWidth < 768

  // 过滤和排序友链
  const filteredAndSortedLinks = friendLinks
    .filter(link => {
      const matchesSearch =
        link.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (link.description && link.description.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesType = selectedType === 'all' || link.type === selectedType
      return matchesSearch && matchesType
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'date')
        return new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
      if (sortBy === 'recommended') {
        if (a.recommend && !b.recommend) return -1
        if (!a.recommend && b.recommend) return 1
        return 0
      }
      return 0
    })

  // 按类型分组
  const friendLinksFiltered = filteredAndSortedLinks.filter(link => link.type === 'friend')
  const resourceLinks = filteredAndSortedLinks.filter(link => link.type === 'resource')
  const toolLinks = filteredAndSortedLinks.filter(link => link.type === 'tool')
  const blogLinks = filteredAndSortedLinks.filter(link => link.type === 'blog')

  // 小正方形卡片组件 - 添加了hover时显示描述的功能
  const LinkCard = ({ link }: { link: FriendLink }) => {
    const [isHovered, setIsHovered] = useState(false)

    return (
      <div
        className="group relative bg-white dark:bg-slate-800/50 border border-transparent  p-3 hover:shadow-md transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <a
          href={link.link_url || link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full h-full"
        >
          <div className="flex flex-col items-center justify-center h-full">
            <div className="relative w-16 h-16 overflow-hidden mb-2">
              {fetchingUrls.has(link.id) ? (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-700">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <Image
                  src={link.avatar || '/default-avatar.png'}
                  alt={`${link.name}的图标`}
                  fill
                  className="object-cover w-full h-full"
                />
              )}
            </div>

            <h3 className="text-sm font-medium text-slate-800 dark:text-white text-center truncate w-full">
              {link.name}
            </h3>

            <div className="flex items-center gap-1 mt-1">
              {link.recommend && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
            </div>
          </div>
        </a>

        {/* 描述tooltip - 美化后的版本，已移除三角形 */}
        {isHovered && link.description && (
          <div className="absolute z-100 bottom-full left-0 transform mb-2 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl w-56 max-w-xs transition-opacity duration-200 opacity-100">
            <div className="relative z-10">
              <h4 className="font-medium text-slate-800 dark:text-white mb-1 text-sm">
                {link.name}
              </h4>
              <p className="text-slate-600 dark:text-slate-300 text-xs line-clamp-3">
                {link.description}
              </p>
              {link.recommend && (
                <div className="flex items-center gap-1 mt-2">
                  <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                  <span className="text-xs text-amber-600 dark:text-amber-400">推荐</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // 列表项组件
  const LinkListItem = ({ link }: { link: FriendLink }) => {
    return (
      <a
        href={link.link_url || link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 overflow-hidden flex-shrink-0">
            {fetchingUrls.has(link.id) ? (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-700">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              </div>
            ) : (
              <Image
                src={link.avatar || '/default-avatar.png'}
                alt={`${link.name}的图标`}
                fill
                className="object-cover w-full h-full"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-slate-800 dark:text-white truncate">
                {link.name}
              </h3>
              {link.recommend && (
                <Star className="h-3 w-3 text-amber-500 fill-amber-500 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
              {link.description || '暂无描述'}
            </p>
          </div>
        </div>
      </a>
    )
  }

  // 帮助图标组件 - 添加hover提示
  const HelpIcon = () => {
    const [isHovered, setIsHovered] = useState(false)
    const linkData = `{ 
    name:"寒枫的博客", 
    description:"分享技术与生活点滴",
    url:"https://www.hanphone.top",
    link_url:"https://www.hanphone.top/link",
    avatar:"https://www.hanphone.top/favicon.ico",
    color:"#ffffff"
  }`
    return (
      <div
        className="relative flex items-center justify-center"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CircleQuestionMark className="h-5 w-5 text-slate-500 dark:text-slate-400 cursor-help hover:text-blue-500 flex-shrink-0" />

        {/* 帮助提示tooltip - 美化后的版本，已移除三角形 */}
        {isHovered && (
          <div className="absolute z-50 right-0 top-full mt-2 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl w-64 max-w-xs transition-opacity duration-200 opacity-100">
            <div className="relative z-10">
              <h4 className="font-medium text-slate-800 dark:text-white mb-2 text-sm">
                如何添加友链？
              </h4>
              <p className="text-slate-600 dark:text-slate-300 text-xs mb-3">
                如果你想添加你的站点，请在留言板或邮箱联系我。格式示例如下:
              </p>
              <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded text-xs font-mono text-slate-700 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap break-all">
                {linkData}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // 布局切换按钮组件
  const LayoutToggle = ({
    layout,
    setLayout
  }: {
    layout: 'card' | 'list'
    setLayout: (layout: 'card' | 'list') => void
  }) => {
    return (
      <button
        onClick={() => setLayout(layout === 'card' ? 'list' : 'card')}
        className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
        title={layout === 'card' ? '切换到列表视图' : '切换到卡片视图'}
      >
        {layout === 'card' ? (
          <List className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        ) : (
          <Grid className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        )}
      </button>
    )
  }

  return (
    <div className="min-h-screen z-1 flex flex-col bg-white dark:bg-slate-950 ">
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
      <main
        className={`w-full max-w-5xl mx-auto px-${
          isMobile ? '0' : '4'
        } relative md:pb-2 page-transition`}
      >
        <div className="bg-white/80 dark:bg-slate-900/60 lg:rounded-t-xl border border-slate-200 dark:border-slate-800 px-4 pt-3 pb-2 md:p-4">
          {/* API错误提示 */}
          {apiError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{apiError}</p>
            </div>
          )}

          {/* 搜索和筛选控件 */}
          <div className="flex flex-col md:flex-row gap-2.5">
            <div className="flex items-center flex-1 gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="搜索友链..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-2 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                />
              </div>
              <HelpIcon />
            </div>

            <div className="flex gap-2">
              {/* 类型筛选下拉列表 */}
              <div className="relative">
                <button
                  onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                  className="flex items-center px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                >
                  {FRIEND_LINK_TYPES.find(type => type.filterKey === selectedType)?.icon}
                  <span className="mr-1">
                    {FRIEND_LINK_TYPES.find(type => type.filterKey === selectedType)?.name}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {/* 下拉列表 */}
                {isTypeDropdownOpen && (
                  <div className="absolute z-20 top-full right-0 mt-1 bg-white dark:bg-slate-800/90 backdrop-blur-sm rounded-lg shadow-md border border-slate-300 dark:border-slate-700/50 overflow-hidden min-w-[140px]">
                    {FRIEND_LINK_TYPES.map(type => (
                      <button
                        key={type.filterKey}
                        onClick={() => {
                          setSelectedType(
                            type.filterKey as 'all' | 'friend' | 'resource' | 'tool' | 'blog'
                          )
                          setIsTypeDropdownOpen(false)
                        }}
                        className={`w-full flex items-center px-4 py-2.5 text-left transition-all
                          ${
                            selectedType === type.filterKey
                              ? 'bg-blue-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-300 border-l-2 border-blue-500'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/40 border-l-2 border-transparent'
                          }`}
                      >
                        {type.icon}
                        {type.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 排序下拉列表 */}
              <div className="relative">
                <button
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className="flex items-center px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                >
                  {SORT_OPTIONS.find(option => option.key === sortBy)?.icon}
                  <span className="mr-1">
                    {SORT_OPTIONS.find(option => option.key === sortBy)?.name}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {/* 下拉列表 */}
                {isSortDropdownOpen && (
                  <div className="absolute z-20 top-full right-0 mt-1 bg-white dark:bg-slate-800/90 backdrop-blur-sm rounded-lg shadow-md border border-slate-300 dark:border-slate-700/50 overflow-hidden min-w-[140px]">
                    {SORT_OPTIONS.map(option => (
                      <button
                        key={option.key}
                        onClick={() => {
                          setSortBy(option.key as 'name' | 'date' | 'recommended')
                          setIsSortDropdownOpen(false)
                        }}
                        className={`w-full flex items-center px-4 py-2.5 text-left transition-all
                          ${
                            sortBy === option.key
                              ? 'bg-blue-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-300 border-l-2 border-blue-500'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/40 border-l-2 border-transparent'
                          }`}
                      >
                        {option.icon}
                        {option.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white/80 dark:bg-slate-900/60 dark:backdrop-blur-sm lg:rounded-b-xl min-h-[90vh] border border-slate-200 dark:border-slate-800 shadow-sm p-10 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-3" />
            <p className="text-slate-500 dark:text-slate-400 text-sm">正在获取友链信息...</p>
          </div>
        ) : (
          <>
            {/* 友情链接区域 */}
            {friendLinksFiltered.length > 0 && (
              <div className="bg-white/80 dark:bg-slate-900/60 dark:backdrop-blur-sm border border-slate-200 dark:border-slate-800">
                <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-base font-semibold text-slate-800 dark:text-white">友链</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 dark:text-slate-400 text-sm">
                      {friendLinksFiltered.length} 个链接
                    </span>
                    <LayoutToggle layout={friendLayout} setLayout={setFriendLayout} />
                  </div>
                </div>
                <div className="">
                  {friendLayout === 'card' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                      {friendLinksFiltered.map(link => (
                        <LinkCard key={link.id} link={link} />
                      ))}
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200 dark:divide-slate-700/50">
                      {friendLinksFiltered.map(link => (
                        <LinkListItem key={link.id} link={link} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* 工具链接区域 */}
            {toolLinks.length > 0 && (
              <div className="bg-white/80 dark:bg-slate-900/60 dark:backdrop-blur-sm border border-slate-200 dark:border-slate-800">
                <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <ToolCase className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <h2 className="text-base font-semibold text-slate-800 dark:text-white">工具</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 dark:text-slate-400 text-sm">
                      {toolLinks.length} 个链接
                    </span>
                    <LayoutToggle layout={toolLayout} setLayout={setToolLayout} />
                  </div>
                </div>
                <div className="">
                  {toolLayout === 'card' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                      {toolLinks.map(link => (
                        <LinkCard key={link.id} link={link} />
                      ))}
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200 dark:divide-slate-700/50">
                      {toolLinks.map(link => (
                        <LinkListItem key={link.id} link={link} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* 博客链接区域 */}
            {blogLinks.length > 0 && (
              <div className="bg-white/80 dark:bg-slate-900/60 dark:backdrop-blur-sm border border-slate-200 dark:border-slate-800">
                <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    <h2 className="text-base font-semibold text-slate-800 dark:text-white">文章</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 dark:text-slate-400 text-sm">
                      {blogLinks.length} 个链接
                    </span>
                    <LayoutToggle layout={blogLayout} setLayout={setBlogLayout} />
                  </div>
                </div>
                <div className="">
                  {blogLayout === 'card' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                      {blogLinks.map(link => (
                        <LinkCard key={link.id} link={link} />
                      ))}
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200 dark:divide-slate-700/50">
                      {blogLinks.map(link => (
                        <LinkListItem key={link.id} link={link} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 资源链接区域 */}
            {resourceLinks.length > 0 && (
              <div className="bg-white/80 dark:bg-slate-900/60 dark:backdrop-blur-sm lg:rounded-b-xl border border-slate-200 dark:border-slate-800">
                <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <h2 className="text-base font-semibold text-slate-800 dark:text-white">资源</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 dark:text-slate-400 text-sm">
                      {resourceLinks.length} 个链接
                    </span>
                    <LayoutToggle layout={resourceLayout} setLayout={setResourceLayout} />
                  </div>
                </div>
                <div className="">
                  {resourceLayout === 'card' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                      {resourceLinks.map(link => (
                        <LinkCard key={link.id} link={link} />
                      ))}
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200 dark:divide-slate-700/50">
                      {resourceLinks.map(link => (
                        <LinkListItem key={link.id} link={link} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* 没有找到匹配的友链 */}
            {filteredAndSortedLinks.length === 0 && (
              <div className="bg-white/80 dark:bg-slate-900/60 dark:backdrop-blur-sm min-h-[90vh]  lg:rounded-b-xl border border-slate-200 dark:border-slate-800 shadow-sm  p-10 text-center">
                <div className="text-slate-400 dark:text-slate-500 mb-3">
                  <Globe className="h-10 w-10 mx-auto" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">没有找到匹配的友链</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
