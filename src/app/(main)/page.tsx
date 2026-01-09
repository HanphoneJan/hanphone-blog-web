'use client'

import Image from 'next/image'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  Eye,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Tag as TagIcon,
  X,
  Star,
  Filter
} from 'lucide-react'
import Footer from '@/components/Footer'
import { ENDPOINTS } from '@/lib/api'

// 定义类型接口
interface Blog {
  id: number
  title: string
  description: string
  firstPicture: string
  createTime: string
  views: number
  recommend: boolean
  type: {
    id: number
    name: string
  }
  user: {
    avatar: string
    nickname: string
  }
  tags?: Tag[] // 添加标签关联
}

interface Type {
  id: number
  name: string
  pic_url: string
  blogs: Blog[]
}

interface Tag {
  id: number
  name: string
  blogs: Blog[]
}

// API响应通用类型
interface ApiResponse<T> {
  data: T
}

// 分页数据类型
interface PagedResponse<T> {
  content: T[]
  totalElements: number
}

// 缓存接口
interface CacheItem<T> {
  data: T
  timestamp: number
}

export default function Home() {
  const router = useRouter()
  // 页面加载时滚动到顶部
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])
  const [totalcount, setTotalcount] = useState(0)
  const [queryInfo, setQueryInfo] = useState({
    query: '',
    pagenum: 1,
    pagesize: 8
  })
  const [blogList, setBlogList] = useState<Blog[]>([])
  const [typeList, setTypeList] = useState<Type[]>([])
  const [tagList, setTagList] = useState<Tag[]>([])
  const [recommendList, setRecommendList] = useState<Blog[]>([])
  const [selectMethod, setSelectMethod] = useState('全部博客')
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null) // 修改为单选
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]) // 修改为多选数组
  const [selected, setSelected] = useState(false)
  const [moreType, setMoreType] = useState(true)
  const [moreTag, setMoreTag] = useState(true)
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  )
  const [intro, setIntro] = useState('')
  // 侧边栏控制状态 - 分类与标签默认展开
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showTypes, setShowTypes] = useState(true) // 默认展开
  const [showTags, setShowTags] = useState(true) // 默认展开

  // 添加加载状态
  const [blogListLoading, setBlogListLoading] = useState(true)
  const [recommendListLoading, setRecommendListLoading] = useState(true)
  const [typeListLoading, setTypeListLoading] = useState(true)
  const [tagListLoading, setTagListLoading] = useState(true)

  // 添加内容显示状态，用于过渡动画
  const [blogListVisible, setBlogListVisible] = useState(false)
  const [recommendListVisible, setRecommendListVisible] = useState(false)
  const [typeListVisible, setTypeListVisible] = useState(false)
  const [tagListVisible, setTagListVisible] = useState(false)

  // 缓存引用
  const cacheRef = useRef<Map<string, CacheItem<any>>>(new Map())
  const CACHE_EXPIRY = 10 * 60 * 1000 // 10分钟缓存过期时间

  // 缓存工具函数
  const getFromCache = useCallback(<T,>(key: string): T | null => {
    const cachedItem = cacheRef.current.get(key)
    if (!cachedItem) return null

    // 检查缓存是否过期
    if (Date.now() - cachedItem.timestamp > CACHE_EXPIRY) {
      cacheRef.current.delete(key)
      return null
    }

    return cachedItem.data as T
  }, [])

  const setCache = useCallback(<T,>(key: string, data: T): void => {
    cacheRef.current.set(key, {
      data,
      timestamp: Date.now()
    })
  }, [])

  const pagLayout = useMemo(() => {
    return screenWidth < 768 ? 'compact' : 'full'
  }, [screenWidth])

  // 监听屏幕尺寸变化
  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth)
      // 在大屏幕上自动关闭侧边栏
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 打字机效果
  useEffect(() => {
    const str = '欢迎来到寒枫的博客......'
    let idx = 0
    let timer: NodeJS.Timeout

    const typeWriter = () => {
      if (idx <= str.length) {
        setIntro(str.substring(0, idx))
        idx++
        timer = setTimeout(typeWriter, 200)
      } else {
        idx = 0
        timer = setTimeout(typeWriter, 2000)
      }
    }

    timer = setTimeout(typeWriter, 200) //初始化打字
    return () => clearTimeout(timer)
  }, [])

  // API调用函数（泛型类型）- 添加缓存支持
  const fetchData = useCallback(
    async <T = unknown,>(
      url: string,
      params?: Record<string, string | number | boolean | null | undefined>
    ): Promise<ApiResponse<T>> => {
      try {
        // 创建缓存键
        const cacheKey = params ? `${url}?${JSON.stringify(params)}` : url

        // 尝试从缓存获取数据
        const cachedData = getFromCache<ApiResponse<T>>(cacheKey)
        if (cachedData) {
          return cachedData
        }

        if (!params) {
          const res = await fetch(url)
          const data = (await res.json()) as ApiResponse<T>
          setCache(cacheKey, data)
          return data
        }

        // 过滤掉 undefined 和 null 的参数值
        const validParams = Object.entries(params).reduce<Record<string, string>>(
          (acc, [key, value]) => {
            if (value !== undefined && value !== null) {
              acc[key] = String(value)
            }
            return acc
          },
          {}
        )

        const queryParams = new URLSearchParams(validParams).toString()
        const fullUrl = `${url}?${queryParams}`
        const res = await fetch(fullUrl)
        const data = (await res.json()) as ApiResponse<T>
        setCache(cacheKey, data)
        return data
      } catch (error) {
        console.log(`Error fetching ${url}:`, error)
        return { data: [] as unknown as T }
      }
    },
    [getFromCache, setCache]
  )

  // 获取推荐博客列表
  const getRecommendList = useCallback(async () => {
    setRecommendListLoading(true)
    setRecommendListVisible(false)
    try {
      const res = await fetchData<Blog[]>(ENDPOINTS.RECOMMEND_BLOG_LIST)
      setRecommendList(res.data || [])
      // 延迟显示内容，创建平滑过渡
      setTimeout(() => setRecommendListVisible(true), 100)
    } finally {
      setRecommendListLoading(false)
    }
  }, [fetchData])

  // 获取博客类型列表
  const getTypeList = useCallback(async () => {
    setTypeListLoading(true)
    setTypeListVisible(false)
    try {
      const res = await fetchData<Type[]>(ENDPOINTS.TYPE_LIST)
      setTypeList(res.data || [])
      setTimeout(() => setTypeListVisible(true), 100)
    } finally {
      setTypeListLoading(false)
    }
  }, [fetchData])

  // 获取博客标签列表
  const getTagList = useCallback(async () => {
    setTagListLoading(true)
    setTagListVisible(false)
    try {
      const res = await fetchData<Tag[]>(ENDPOINTS.TAG_LIST)
      setTagList(res.data || [])
      setTimeout(() => setTagListVisible(true), 100)
    } finally {
      setTagListLoading(false)
    }
  }, [fetchData])

  // 获取博客列表
  const getBlogList = useCallback(async () => {
    setBlogListLoading(true)
    setBlogListVisible(false)
    try {
      const res = await fetchData<PagedResponse<Blog>>(ENDPOINTS.BLOGS, queryInfo)
      // 对博客列表进行排序，推荐博客优先
      const sortedBlogs = (res.data?.content || []).sort((a, b) => {
        // 如果b是推荐而a不是，b排在前面
        if (b.recommend && !a.recommend) return 1
        // 如果a是推荐而b不是，a排在前面
        if (a.recommend && !b.recommend) return -1
        // 如果都是推荐或都不是推荐，保持原顺序
        return 0
      })
      setBlogList(sortedBlogs)
      setTotalcount(res.data?.totalElements || 0)
      setTimeout(() => setBlogListVisible(true), 100)
    } finally {
      setBlogListLoading(false)
    }
  }, [fetchData, queryInfo])

  // 获取初始数据
  useEffect(() => {
    getTypeList()
    getBlogList()
    getTagList()
    getRecommendList()
  }, [getTypeList, getBlogList, getTagList, getRecommendList])

  // 当查询信息变化时重新获取博客列表 - 添加防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      getBlogList()
    }, 300)
    return () => clearTimeout(timer)
  }, [queryInfo, getBlogList])

  // 更新selectMethod显示当前选中的分类与标签
  const updateSelectMethod = useCallback(() => {
    let methodText = ''

    // 添加分类信息
    if (selectedTypeId !== null) {
      const type = typeList.find(item => item.id === selectedTypeId)
      if (type) methodText += `分类: ${type.name}`
    }

    // 添加标签信息
    if (selectedTagIds.length > 0) {
      if (methodText) methodText += ' + '
      methodText += '标签: '

      const tagNames = selectedTagIds
        .map(tagId => {
          const tag = tagList.find(item => item.id === tagId)
          return tag ? tag.name : ''
        })
        .filter(name => name)

      methodText += tagNames.join(', ')
    }

    // 如果没有选中任何分类或标签，显示"全部博客"
    if (!methodText) {
      methodText = '全部博客'
    }

    setSelectMethod(methodText)
  }, [selectedTypeId, selectedTagIds, typeList, tagList])

  // 在 typeList 和 tagList 加载完成后更新 selectMethod
  useEffect(() => {
    if (typeList.length > 0 || tagList.length > 0) {
      updateSelectMethod()
    }
  }, [typeList, tagList, updateSelectMethod])

  // 跳转到博客详情页
  const getBlogInfo = (blogId: number) => {
    router.push(`/blog/${blogId}`)
    // 点击博客时关闭侧边栏
    if (screenWidth < 1024) {
      setSidebarOpen(false)
    }
  }

  // 修改当前页码
  const handleCurrentChange = (newPage: number) => {
    setQueryInfo(prev => ({ ...prev, pagenum: newPage }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 按分类筛选博客 - 优化缓存使用
  const selectType = async (id: number) => {
    setSelectedTypeId(id) // 设置选中的分类ID
    setBlogListLoading(true)
    setBlogListVisible(false)

    try {
      // 创建缓存键
      const cacheKey = `type_${id}_tags_${selectedTagIds.join(',')}`
      let filteredBlogs: Blog[] = []

      // 尝试从缓存获取数据
      const cachedData = getFromCache<Blog[]>(cacheKey)
      if (cachedData) {
        filteredBlogs = cachedData
      } else {
        // 获取分类下的博客
        const typeRes = await fetchData<PagedResponse<Blog>>(ENDPOINTS.TYPE_BLOGS(id))
        filteredBlogs = typeRes.data?.content || []

        // 如果有选中的标签，进一步筛选
        if (selectedTagIds.length > 0) {
          // 获取每个标签下的博客
          const tagPromises = selectedTagIds.map(tagId =>
            fetchData<PagedResponse<Blog>>(ENDPOINTS.TAG_BLOGS(tagId))
          )

          const tagResponses = await Promise.all(tagPromises)
          const tagBlogsArrays = tagResponses.map(res => res.data?.content || [])

          // 找出所有标签的交集
          filteredBlogs = filteredBlogs.filter(blog =>
            tagBlogsArrays.every(tagBlogs => tagBlogs.some(tagBlog => tagBlog.id === blog.id))
          )
        }

        // 对博客列表进行排序，推荐博客优先
        filteredBlogs = filteredBlogs.sort((a, b) => {
          if (b.recommend && !a.recommend) return 1
          if (a.recommend && !b.recommend) return -1
          return 0
        })

        // 缓存结果
        setCache(cacheKey, filteredBlogs)
      }

      setBlogList(filteredBlogs)
      setTotalcount(filteredBlogs.length)

      setSelected(true)
      setTimeout(() => setBlogListVisible(true), 100)

      // 直接更新 selectMethod，不依赖异步回调
      const type = typeList.find(item => item.id === id)
      let methodText = type ? `分类: ${type.name}` : ''

      if (selectedTagIds.length > 0) {
        if (methodText) methodText += ' + '
        methodText += '标签: '

        const tagNames = selectedTagIds
          .map(tagId => {
            const tag = tagList.find(item => item.id === tagId)
            return tag ? tag.name : ''
          })
          .filter(name => name)

        methodText += tagNames.join(', ')
      }

      if (!methodText) {
        methodText = '全部博客'
      }

      setSelectMethod(methodText)
    } finally {
      setBlogListLoading(false)
    }

    // 选择后关闭侧边栏
    setSidebarOpen(false)
  }

  // 按标签筛选博客（支持多选）- 优化缓存使用
  const selectTag = async (id: number) => {
    // 切换标签选中状态
    const newSelectedTagIds = selectedTagIds.includes(id)
      ? selectedTagIds.filter(tagId => tagId !== id)
      : [...selectedTagIds, id]

    setSelectedTagIds(newSelectedTagIds)
    setBlogListLoading(true)
    setBlogListVisible(false)

    try {
      // 创建缓存键
      const cacheKey = `type_${selectedTypeId || 'null'}_tags_${newSelectedTagIds.join(',')}`
      let filteredBlogs: Blog[] = []

      // 尝试从缓存获取数据
      const cachedData = getFromCache<Blog[]>(cacheKey)
      if (cachedData) {
        filteredBlogs = cachedData
      } else {
        // 如果有选中的分类，先获取分类下的博客
        if (selectedTypeId !== null) {
          const typeRes = await fetchData<PagedResponse<Blog>>(ENDPOINTS.TYPE_BLOGS(selectedTypeId))
          filteredBlogs = typeRes.data?.content || []
        } else {
          // 否则获取所有博客
          const allBlogsRes = await fetchData<PagedResponse<Blog>>(ENDPOINTS.BLOGS, {
            ...queryInfo,
            pagenum: 1,
            pagesize: 1000
          })
          filteredBlogs = allBlogsRes.data?.content || []
        }

        // 如果有选中的标签，进一步筛选
        if (newSelectedTagIds.length > 0) {
          // 获取每个标签下的博客
          const tagPromises = newSelectedTagIds.map(tagId =>
            fetchData<PagedResponse<Blog>>(ENDPOINTS.TAG_BLOGS(tagId))
          )

          const tagResponses = await Promise.all(tagPromises)
          const tagBlogsArrays = tagResponses.map(res => res.data?.content || [])

          // 找出所有标签的交集
          filteredBlogs = filteredBlogs.filter(blog =>
            tagBlogsArrays.every(tagBlogs => tagBlogs.some(tagBlog => tagBlog.id === blog.id))
          )
        }

        // 对博客列表进行排序，推荐博客优先
        filteredBlogs = filteredBlogs.sort((a, b) => {
          if (b.recommend && !a.recommend) return 1
          if (a.recommend && !b.recommend) return -1
          return 0
        })

        // 缓存结果
        setCache(cacheKey, filteredBlogs)
      }

      setBlogList(filteredBlogs)
      setTotalcount(filteredBlogs.length)

      setSelected(true)
      setTimeout(() => setBlogListVisible(true), 100)

      // 直接更新 selectMethod，不依赖异步回调
      let methodText = ''

      if (selectedTypeId !== null) {
        const type = typeList.find(item => item.id === selectedTypeId)
        if (type) methodText += `分类: ${type.name}`
      }

      if (newSelectedTagIds.length > 0) {
        if (methodText) methodText += ' + '
        methodText += '标签: '

        const tagNames = newSelectedTagIds
          .map(tagId => {
            const tag = tagList.find(item => item.id === tagId)
            return tag ? tag.name : ''
          })
          .filter(name => name)

        methodText += tagNames.join(', ')
      }

      if (!methodText) {
        methodText = '全部博客'
      }

      setSelectMethod(methodText)
    } finally {
      setBlogListLoading(false)
    }

    // 选择后关闭侧边栏
    setSidebarOpen(false)
  }

  // 更新博客列表（重置筛选）
  const updateBlogList = () => {
    setSelected(false)
    setSelectedTypeId(null)
    setSelectedTagIds([])
    setSelectMethod('全部博客')
    setQueryInfo(prev => ({ ...prev, pagenum: 1 }))
    getBlogList()
  }

  // 比较函数（用于排序，带类型约束）
  const compare = <T extends { blogs?: Blog[] }>(property: keyof T) => {
    return (a: T, b: T) => {
      const value1 = Array.isArray(a[property]) ? (a[property] as unknown[]).length : 0
      const value2 = Array.isArray(b[property]) ? (b[property] as unknown[]).length : 0
      return value2 - value1
    }
  }

  // 获取所有分类
  const getFullTypeList = useCallback(async () => {
    setTypeListLoading(true)
    setTypeListVisible(false)
    try {
      const res = await fetchData<Type[]>(ENDPOINTS.FULL_TYPE_LIST)
      setTypeList(res.data?.sort(compare<Type>('blogs')) || [])
      setTimeout(() => setTypeListVisible(true), 100)
    } finally {
      setTypeListLoading(false)
    }
  }, [fetchData])

  // 获取所有标签
  const getFullTagList = useCallback(async () => {
    setTagListLoading(true)
    setTagListVisible(false)
    try {
      const res = await fetchData<Tag[]>(ENDPOINTS.FULL_TAG_LIST)
      setTagList(res.data?.sort(compare<Tag>('blogs')) || [])
      setTimeout(() => setTagListVisible(true), 100)
    } finally {
      setTagListLoading(false)
    }
  }, [fetchData])

  // 处理分类展开/收起
  const dealType = async () => {
    if (moreType) {
      await getFullTypeList()
    } else {
      await getTypeList()
    }
    setMoreType(!moreType)
  }

  // 处理标签展开/收起
  const dealTag = async () => {
    if (moreTag) {
      await getFullTagList()
    } else {
      await getTagList()
    }
    setMoreTag(!moreTag)
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  // 生成页码数组
  const generatePageNumbers = () => {
    const totalPages = Math.ceil(totalcount / queryInfo.pagesize)
    const pages = []
    const current = queryInfo.pagenum

    // 始终显示第一页
    pages.push(1)

    // 显示当前页附近的页码
    if (current > 3) pages.push('...')
    if (current > 2) pages.push(current - 1)
    if (current !== 1 && current !== totalPages) pages.push(current)
    if (current < totalPages - 1) pages.push(current + 1)
    if (current < totalPages - 2) pages.push('...')

    // 始终显示最后一页
    if (totalPages > 1) pages.push(totalPages)

    return pages
  }

  // 骨架屏组件 - 博客列表
  const BlogListSkeleton = () => (
    <div className="border-b border-slate-200 dark:border-slate-700/50 p-4 rounded-lg py-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 博客图片骨架 */}
        <div className="sm:col-span-1">
          <div className="relative h-40 w-full rounded-lg overflow-hidden shadow-md border border-slate-200 dark:border-slate-700/50">
            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-slate-200 dark:from-slate-700/30 dark:via-slate-600/40 dark:to-slate-700/30 "></div>
          </div>
        </div>

        {/* 博客信息骨架 */}
        <div className="sm:col-span-2 flex flex-col">
          {/* 标题骨架 */}
          <div className="h-7 mb-2 animate-shimmer bg-gradient-to-r from-slate-200 dark:from-slate-700/30 dark:via-slate-600/40 dark:to-slate-700/30 rounded w-3/4"></div>

          {/* 描述骨架 */}
          <div className="space-y-2 mb-2 flex-grow">
            <div className="h-4 animate-shimmer bg-gradient-to-r from-slate-200 dark:from-slate-700/30 dark:via-slate-600/40 dark:to-slate-700/30 rounded "></div>
            <div className="h-4 animate-shimmer bg-gradient-to-r from-slate-200 dark:from-slate-700/30 dark:via-slate-600/40 dark:to-slate-700/30 rounded w-5/6"></div>
            <div className="h-4 animate-shimmer bg-gradient-to-r from-slate-200 dark:from-slate-700/30 dark:via-slate-600/40 dark:to-slate-700/30 rounded w-4/6"></div>
          </div>

          {/* 元信息骨架 */}
          <div className="flex items-center text-sm flex-wrap">
            <div className="flex items-center mr-4 mb-2 sm:mb-0">
              <div className="relative h-6 w-6 rounded-full overflow-hidden mr-2 border border-slate-300 dark:border-slate-600">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-200 dark:from-slate-700/30 dark:via-slate-600/40 dark:to-slate-700/30"></div>
              </div>
              <div className="h-4 w-16 bg-gradient-to-r from-slate-200 dark:from-slate-700/30 dark:via-slate-600/40 dark:to-slate-700/30 rounded "></div>
            </div>
            <div className="hidden sm:flex items-center mr-4 mb-2 sm:mb-0">
              <div className="h-4 w-20 bg-gradient-to-r from-slate-200 dark:from-slate-700/30 dark:via-slate-600/40 dark:to-slate-700/30 rounded"></div>
            </div>
            <div className="flex items-center mr-4 mb-2 sm:mb-0">
              <div className="h-4 w-12 bg-gradient-to-r from-slate-200 dark:from-slate-700/30 dark:via-slate-600/40 dark:to-slate-700/30 rounded"></div>
            </div>
            <div className="ml-auto">
              <div className="inline-flex items-center px-2 py-1 h-6 w-20 bg-gradient-to-r from-slate-200 dark:from-slate-700/30 dark:via-slate-600/40 dark:to-slate-700/30 rounded text-xs"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // 骨架屏组件 - 推荐博客
  const RecommendBlogSkeleton = () => (
    <div className="flex items-center p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded cursor-pointer transition-colors">
      <div className="relative h-6 w-6 rounded-full overflow-hidden mr-2 border border-slate-300 dark:border-slate-600 bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
        <div className="h-2 w-2 bg-slate-300 dark:bg-slate-600 rounded-full animate-pulse"></div>
      </div>
      <div className="h-4 animate-shimmer bg-gradient-to-r from-slate-200 dark:from-slate-700/30 dark:via-slate-600/40 dark:to-slate-700/30 rounded animate-shimmer flex-1"></div>
    </div>
  )

  // 骨架屏组件 - 分类
  const TypeSkeleton = () => (
    <div className="flex justify-between items-center p-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors">
      <div className="flex items-center">
        <div className="relative h-6 w-6 rounded-full overflow-hidden mr-2 border border-slate-300 dark:border-slate-600">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-200 dark:from-slate-700/30 dark:via-slate-600/40 dark:to-slate-700/30 animate-shimmer"></div>
        </div>
        <div className="h-4 w-16 bg-gradient-to-r from-slate-200 dark:from-slate-700/30 dark:via-slate-600/40 dark:to-slate-700/30 rounded animate-shimmer"></div>
      </div>
      <div className="bg-slate-200 dark:bg-slate-700/50 text-xs px-2 py-0.5 rounded h-5 w-8 flex items-center justify-center">
        <div className="h-3 w-3 bg-slate-300 dark:bg-slate-600 rounded animate-pulse"></div>
      </div>
    </div>
  )

  // 骨架屏组件 - 标签
  const TagSkeleton = () => (
    <span className="inline-flex items-center px-2 py-1 bg-slate-200 dark:bg-slate-700/50 rounded-full text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors">
      <TagIcon className="mr-1 h-3 w-3 text-slate-400 dark:text-slate-600" />
      <div className="h-3 w-12 bg-gradient-to-r from-slate-300 dark:from-slate-600/40 dark:to-slate-600/30 rounded animate-shimmer"></div>
      <span className="ml-1 bg-slate-300 dark:bg-slate-600/50 text-xs rounded-full px-1.5 h-4 w-4 flex items-center justify-center">
        <div className="h-2 w-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-pulse"></div>
      </span>
    </span>
  )

  return (
    <div className="min-h-screen z-1 flex flex-col bg-white dark:bg-slate-950 overflow-hidden">
      <style jsx global>{`
        ::-webkit-scrollbar {
          display: none;
        }
        html {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* 闪烁动画 */
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        .animate-shimmer {
          background-size: 200% 100%;
          animation: shimmer 5=3s ease-in-out infinite;
        }

        /* 淡入动画 */
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

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
      <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/40"></div>
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 lg:pt-4 relative z-10 page-transition">
        {/* 打字机效果区域 */}
        <div className="w-full py-10 relative overflow-hidden md:mb-4">
          <div className="absolute inset-0 bg-transparent"></div>
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="flex justify-center items-center min-h-[120px]">
              <p className="text-xl md:text-2xl font-light text-blue-600 dark:text-blue-100 text-center tracking-wide relative">
                {intro}
                <span className="absolute -right-4 top-1/2 transform -translate-y-1/2 w-3 h-5 bg-blue-400 animate-pulse"></span>
              </p>
            </div>
          </div>
        </div>

        {/* 博客内容区域 */}
        <div className="w-full">
          {/* 侧边栏 - 移动端展示分类与标签（默认展开） */}
          <div
            className={`fixed inset-0 z-50 lg:hidden transition-transform duration-300 ease-in-out ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            {/* 遮罩层 */}
            <div
              className="absolute inset-0 bg-white/10 dark:bg-black opacity-50"
              onClick={() => setSidebarOpen(false)}
            ></div>

            {/* 侧边栏内容 */}
            <div className="absolute top-0 left-0 min-h-screen w-4/5 max-w-sm bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 shadow-lg overflow-y-auto">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <h2 className="text-lg font-bold text-blue-600 dark:text-blue-100">分类与标签</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* 筛选状态重置 */}
              {selected && (
                <div
                  onClick={updateBlogList}
                  className="p-3 text-center text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <ArrowLeft className="inline-block mr-1 h-4 w-4" />
                  清除筛选，显示全部博客
                </div>
              )}

              {/* 分类筛选 - 默认展开 */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setShowTypes(!showTypes)}
                  className="w-full flex justify-between items-center font-medium mb-3 text-blue-600 dark:text-blue-100"
                >
                  <span>分类</span>
                  {showTypes ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>

                {showTypes && (
                  <ul className="space-y-1 min-h-[30vh] max-h-[60vh] overflow-y-auto pr-2">
                    {typeListLoading ? (
                      // 加载状态 - 显示骨架屏
                      Array.from({ length: 8 }).map((_, index) => (
                        <TypeSkeleton key={`type-skeleton-${index}`} />
                      ))
                    ) : (
                      // 数据加载完成 - 显示实际内容
                      <div
                        className={`transition-all duration-500 ${
                          typeListVisible ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        {typeList.map(type => (
                          <li
                            key={type.id}
                            onClick={() => selectType(type.id)}
                            className={`flex justify-between items-center p-2 rounded cursor-pointer transition-colors ${
                              type.id === selectedTypeId
                                ? 'bg-blue-100 dark:bg-blue-900/30'
                                : 'hover:bg-blue-50 dark:hover:bg-blue-900/20'
                            }`}
                          >
                            <div className="flex items-center">
                              <div className="relative h-6 w-6 rounded-full overflow-hidden mr-2 border border-slate-300 dark:border-slate-600">
                                <Image
                                  src={type.pic_url || 'https://hanphone.top/images/bg_1.jpg'}
                                  alt={type.name}
                                  fill
                                  priority={true}
                                  loading="eager"
                                  className="object-cover w-full h-full"
                                />
                              </div>
                              <span className="text-slate-700 dark:text-slate-300">
                                {type.name}
                              </span>
                            </div>
                            <span className="bg-slate-200 dark:bg-slate-700/50 text-xs px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                              {type.blogs.length}
                            </span>
                          </li>
                        ))}
                      </div>
                    )}
                    <li
                      onClick={dealType}
                      className="flex justify-center items-center p-2 text-sm text-blue-600 dark:text-blue-400 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded mt-1"
                    >
                      {moreType ? (
                        <>
                          查看更多 <ChevronDown className="ml-1 h-4 w-4" />
                        </>
                      ) : (
                        <>
                          收起 <ChevronUp className="ml-1 h-4 w-4" />
                        </>
                      )}
                    </li>
                  </ul>
                )}
              </div>

              {/* 标签筛选 - 默认展开 */}
              <div className="p-4">
                <button
                  onClick={() => setShowTags(!showTags)}
                  className="w-full flex justify-between items-center font-medium mb-3 text-blue-600 dark:text-blue-100"
                >
                  <span>标签</span>
                  {showTags ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>

                {showTags && (
                  <div className="flex flex-wrap gap-2 min-h-[30vh] overflow-y-auto pr-2">
                    {tagListLoading ? (
                      // 加载状态 - 显示骨架屏
                      Array.from({ length: 10 }).map((_, index) => (
                        <TagSkeleton key={`tag-skeleton-${index}`} />
                      ))
                    ) : (
                      // 数据加载完成 - 显示实际内容
                      <div
                        className={`transition-all duration-500 ${
                          tagListVisible ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        {tagList.map(tag => (
                          <span
                            key={tag.id}
                            onClick={() => selectTag(tag.id)}
                            className={`inline-flex items-center px-2 py-1 m-1 rounded-full text-sm transition-colors ${
                              selectedTagIds.includes(tag.id)
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-200'
                                : 'bg-slate-200 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                            }`}
                          >
                            <TagIcon className="mr-1 h-3 w-3" />
                            {tag.name}
                            <span className="ml-1 bg-slate-300 dark:bg-slate-600/50 text-xs rounded-full px-1.5">
                              {tag.blogs.length}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                    <div
                      onClick={dealTag}
                      className="w-full text-center text-sm text-blue-600 dark:text-blue-400 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded mt-1 p-1"
                    >
                      {moreTag ? (
                        <>
                          查看更多 <ChevronDown className="inline-block ml-1 h-4 w-4" />
                        </>
                      ) : (
                        <>
                          收起 <ChevronUp className="inline-block ml-1 h-4 w-4" />
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 主内容区网格布局 */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 左侧博客列表 - 占据主要区域 */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-slate-800/40 rounded-xl shadow-sm p-4 border border-slate-200 dark:border-slate-700/50">
                {/* 标题栏 - 移动端可点击打开筛选 */}
                <div
                  className="flex justify-between items-center lg:cursor-default cursor-pointer relative"
                  onClick={() => screenWidth < 1024 && setSidebarOpen(true)}
                >
                  <div className="flex items-center">
                    {selected && (
                      <ArrowLeft
                        className="mr-2 text-blue-600 dark:text-blue-400 cursor-pointer hover:scale-110 transition-transform h-5 w-5 z-10"
                        onClick={e => {
                          e.stopPropagation()
                          updateBlogList()
                        }}
                      />
                    )}
                    {screenWidth < 1024 && (
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          setSidebarOpen(true)
                        }}
                        className="mr-2 p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors z-10"
                        aria-label="打开筛选菜单"
                      >
                        <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </button>
                    )}
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-100">
                      {selectMethod}
                    </span>
                  </div>
                  <span className="text-slate-600 dark:text-slate-300">
                    共{' '}
                    <span className="text-blue-600 dark:text-blue-400 text-xl">{totalcount}</span>{' '}
                    篇
                  </span>

                  {/* 添加一个微妙的视觉提示，表明整个区域可点击 */}
                  {screenWidth < 1024 && (
                    <div className="absolute inset-0 rounded-lg bg-blue-50 dark:bg-blue-900/10 opacity-0 hover:opacity-30 transition-opacity pointer-events-none"></div>
                  )}
                </div>

                {/* 博客列表 */}
                {blogListLoading ? (
                  // 加载状态 - 显示骨架屏
                  Array.from({ length: queryInfo.pagesize }).map((_, index) => (
                    <BlogListSkeleton key={`blog-skeleton-${index}`} />
                  ))
                ) : (
                  // 数据加载完成 - 显示实际内容
                  <div
                    className={`transition-all duration-500 ${
                      blogListVisible ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    {blogList.map(blog => (
                      <div
                        key={blog.id}
                        className="border-b border-slate-200 dark:border-slate-700/50 p-4 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-all duration-300 rounded-lg py-4"
                        onClick={() => getBlogInfo(blog.id)}
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {/* 博客图片 */}
                          <div className="sm:col-span-1">
                            <div className="relative h-40 w-full rounded-lg overflow-hidden shadow-md border border-slate-200 dark:border-slate-700/50">
                              <Image
                                src={blog.firstPicture || 'https://hanphone.top/images/bg_1.jpg'}
                                alt={blog.title}
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 720px"
                                fill
                                loading="eager"
                                priority={true}
                                className="object-fit transition-transform duration-500 hover:scale-105"
                              />
                            </div>
                          </div>

                          {/* 博客信息 */}
                          <div className="sm:col-span-2 flex flex-col">
                            <h3 className="text-xl font-semibold mb-2 text-blue-600 dark:text-blue-100 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center">
                              {blog.title}
                              {blog.recommend && (
                                <span className="ml-2 text-xs bg-yellow-100 text-yellow-500 dark:bg-yellow-900/30 dark:text-yellow-300 px-1 md:px-2 py-1 rounded-full flex items-center">
                                  <Star className="h-3 w-3 fill-current" />
                                  <span className="md:inline ml-1 hidden">推荐</span>
                                </span>
                              )}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-300 line-clamp-3 mb-4 flex-grow">
                              {blog.description}
                            </p>
                            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 flex-wrap">
                              <div className="flex items-center mr-4 mb-2 sm:mb-0">
                                <div className="relative h-6 w-6 rounded-full overflow-hidden mr-2 border border-slate-300 dark:border-slate-600">
                                  <Image
                                    src={blog.user.avatar || '/default-avatar.png'}
                                    alt={blog.user.nickname}
                                    fill
                                    loading="eager"
                                    priority={true}
                                    className="object-cover w-full h-full"
                                  />
                                </div>
                                <span className="text-blue-600 dark:text-blue-300 font-medium">
                                  {blog.user.nickname}
                                </span>
                              </div>
                              <div className="hidden sm:flex items-center mr-4 mb-2 sm:mb-0">
                                <Calendar className="mr-1 h-4 w-4" />
                                <span>{formatDate(blog.createTime)}</span>
                              </div>
                              <div className="flex items-center mr-4 mb-2 sm:mb-0">
                                <Eye className="mr-1 h-4 w-4" />
                                <span>{blog.views}</span>
                              </div>
                              <div className="ml-auto">
                                <span className="inline-flex items-center px-2 py-1 bg-slate-100 dark:bg-slate-700/50 text-blue-600 dark:text-blue-300 rounded text-xs border border-blue-200 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-800/50 hover:text-blue-700 dark:hover:text-blue-100 transition-colors">
                                  <TagIcon className="mr-1 h-3 w-3" />
                                  {blog.type.name}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 分页组件 */}
                {totalcount > 0 && (
                  <div className="mt-6 flex justify-center">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      {/* 上一页 */}
                      <button
                        onClick={() => handleCurrentChange(queryInfo.pagenum - 1)}
                        disabled={queryInfo.pagenum === 1}
                        className="px-3 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 disabled:opacity-50 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors"
                      >
                        上一页
                      </button>

                      {/* 页码 */}
                      {generatePageNumbers().map((page, index) => (
                        <button
                          key={index}
                          onClick={() => typeof page === 'number' && handleCurrentChange(page)}
                          disabled={typeof page !== 'number'}
                          className={`px-3 py-1 rounded ${
                            typeof page === 'number'
                              ? queryInfo.pagenum === page
                                ? 'bg-blue-600 text-white'
                                : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors'
                              : 'cursor-default text-slate-500'
                          }`}
                        >
                          {page}
                        </button>
                      ))}

                      {/* 下一页 */}
                      <button
                        onClick={() => handleCurrentChange(queryInfo.pagenum + 1)}
                        disabled={queryInfo.pagenum * queryInfo.pagesize >= totalcount}
                        className="px-3 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 disabled:opacity-50 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors"
                      >
                        下一页
                      </button>

                      {/* 跳转到 */}
                      {pagLayout === 'full' && (
                        <div className="ml-4 flex items-center text-sm text-slate-600 dark:text-slate-300">
                          <span className="mr-2">跳至</span>
                          <input
                            type="number"
                            min="1"
                            max={Math.ceil(totalcount / queryInfo.pagesize)}
                            value={queryInfo.pagenum}
                            onChange={e => {
                              const page = parseInt(e.target.value)
                              if (page && page > 0) {
                                setQueryInfo(prev => ({ ...prev, pagenum: page }))
                              }
                            }}
                            onKeyPress={e =>
                              e.key === 'Enter' && handleCurrentChange(queryInfo.pagenum)
                            }
                            className="w-12 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-center bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-300"
                          />
                          <span className="mx-2">页</span>
                          <button
                            onClick={() => handleCurrentChange(queryInfo.pagenum)}
                            className="px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors"
                          >
                            确定
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 桌面端侧边栏 */}
            <div className="hidden lg:block space-y-6">
              <div className="bg-white dark:bg-slate-800/40 mb-2 rounded-xl shadow-sm p-4 border border-slate-200 dark:border-slate-700/50">
                <div className="font-bold mb-1 border-b border-slate-200 dark:border-slate-700/50 pb-2 text-blue-600 dark:text-blue-100">
                  推荐博客
                </div>
                <div className="space-y-2">
                  {recommendListLoading ? (
                    // 加载状态 - 显示骨架屏
                    Array.from({ length: 5 }).map((_, index) => (
                      <RecommendBlogSkeleton key={`desktop-rec-skeleton-${index}`} />
                    ))
                  ) : (
                    // 数据加载完成 - 显示实际内容
                    <div
                      className={`transition-all duration-500 ${
                        recommendListVisible ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      {recommendList.map((blog, index) => (
                        <div
                          key={blog.id}
                          onClick={() => getBlogInfo(blog.id)}
                          className="flex items-center p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded cursor-pointer transition-colors text-slate-700 dark:text-slate-300"
                        >
                          <div className="relative h-6 w-6 rounded-full overflow-hidden mr-2 border border-slate-300 dark:border-slate-600 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs flex items-center justify-center shrink-0">
                            {index + 1}
                          </div>
                          <span className="hover:text-blue-600 dark:hover:text-blue-300 transition-colors">
                            {blog.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 分类与标签筛选面板 - 桌面端（默认展开） */}
              <div className="bg-white dark:bg-slate-800/40 rounded-xl shadow-sm p-4 border border-slate-200 dark:border-slate-700/50">
                <div className="font-bold mb-4 border-b border-slate-200 dark:border-slate-700/50 pb-2 text-blue-600 dark:text-blue-100">
                  筛选
                </div>

                {/* 分类筛选 - 默认展开 */}
                <div className="mb-5">
                  <button
                    onClick={() => setShowTypes(!showTypes)}
                    className="w-full flex justify-between items-center font-medium mb-3 text-blue-600 dark:text-blue-100"
                  >
                    <span>分类</span>
                    {showTypes ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>

                  {showTypes && (
                    <ul className="space-y-1 mb-2">
                      {typeListLoading ? (
                        // 加载状态 - 显示骨架屏
                        Array.from({ length: 5 }).map((_, index) => (
                          <TypeSkeleton key={`desktop-type-skeleton-${index}`} />
                        ))
                      ) : (
                        // 数据加载完成 - 显示实际内容
                        <div
                          className={`transition-all duration-500 ${
                            typeListVisible ? 'opacity-100' : 'opacity-0'
                          }`}
                        >
                          {typeList.map(type => (
                            <li
                              key={type.id}
                              onClick={() => selectType(type.id)}
                              className={`flex justify-between items-center p-2 rounded cursor-pointer transition-colors ${
                                type.id === selectedTypeId
                                  ? 'bg-blue-100 dark:bg-blue-900/30'
                                  : 'hover:bg-blue-50 dark:hover:bg-blue-900/20'
                              }`}
                            >
                              <div className="flex items-center">
                                <div className="relative h-6 w-6 rounded-full overflow-hidden mr-2 border border-slate-300 dark:border-slate-600">
                                  <Image
                                    src={type.pic_url || 'https://hanphone.top/images/bg_1.jpg'}
                                    alt={type.name}
                                    fill
                                    loading="eager"
                                    priority={true}
                                    className="object-cover w-full h-full"
                                  />
                                </div>
                                <span className="text-slate-700 dark:text-slate-300">
                                  {type.name}
                                </span>
                              </div>
                              <span className="bg-slate-200 dark:bg-slate-700/50 text-xs px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                                {type.blogs.length}
                              </span>
                            </li>
                          ))}
                        </div>
                      )}
                      <li
                        onClick={dealType}
                        className="flex justify-center items-center p-2 text-sm text-blue-600 dark:text-blue-400 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded mt-1"
                      >
                        {moreType ? (
                          <>
                            查看更多 <ChevronDown className="ml-1 h-4 w-4" />
                          </>
                        ) : (
                          <>
                            收起 <ChevronUp className="ml-1 h-4 w-4" />
                          </>
                        )}
                      </li>
                    </ul>
                  )}
                </div>

                {/* 标签筛选 - 默认展开 */}
                <div>
                  <button
                    onClick={() => setShowTags(!showTags)}
                    className="w-full flex justify-between items-center font-medium mb-3 text-blue-600 dark:text-blue-100"
                  >
                    <span>标签</span>
                    {showTags ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>

                  {showTags && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {tagListLoading ? (
                        // 加载状态 - 显示骨架屏
                        Array.from({ length: 10 }).map((_, index) => (
                          <TagSkeleton key={`desktop-tag-skeleton-${index}`} />
                        ))
                      ) : (
                        // 数据加载完成 - 显示实际内容
                        <div
                          className={`transition-all duration-500 ${
                            tagListVisible ? 'opacity-100' : 'opacity-0'
                          }`}
                        >
                          {tagList.map(tag => (
                            <span
                              key={tag.id}
                              onClick={() => selectTag(tag.id)}
                              className={`inline-flex items-center px-2 py-1 m-1 rounded-full text-sm transition-colors ${
                                selectedTagIds.includes(tag.id)
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-200'
                                  : 'bg-slate-200 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                              }`}
                            >
                              <TagIcon className="mr-1 h-3 w-3" />
                              {tag.name}
                              <span className="ml-1 bg-slate-300 dark:bg-slate-600/50 text-xs rounded-full px-1.5">
                                {tag.blogs.length}
                              </span>
                            </span>
                          ))}
                        </div>
                      )}
                      <div
                        onClick={dealTag}
                        className="w-full text-center text-sm text-blue-600 dark:text-blue-400 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded mt-1 p-1"
                      >
                        {moreTag ? (
                          <>
                            查看更多 <ChevronDown className="inline-block ml-1 h-4 w-4" />
                          </>
                        ) : (
                          <>
                            收起 <ChevronUp className="inline-block ml-1 h-4 w-4" />
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
