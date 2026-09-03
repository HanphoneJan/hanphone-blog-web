'use client'

import BgOverlay from '@/app/(main)/components/BgOverlay'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  ListTree,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { 
  API_PARAMS,
  ROUTES,
  PAGINATION,
  BLOG_LIST_CONFIG
, API_CODE } from '@/lib/constants'
import { BLOG_LABELS } from '@/lib/labels'
import { ENDPOINTS } from '@/lib/api'
import { scrollToTopOf } from '@/lib/scroll'
import { ArticleRow } from './components/ArticleRow'
import { BlogCategoryTree } from './components/BlogCategoryTree'
import { BlogFilterPanel } from './components/BlogFilterPanel'
import { Pagination } from '../components/Pagination'
import type { Blog, Type, Tag, PageInfo, BlogsByType, BlogArchive } from './types'

interface BlogListClientProps {
  initialBlogs: Blog[]
  initialRecommendBlogs: Blog[]
  initialTypes: Type[]
  initialPageInfo: PageInfo
  initialTags?: Tag[]
  initialArchives?: BlogArchive
}

type SortOption = 'newest' | 'oldest' | 'mostViewed' | 'leastViewed' | 'recommend'

export default function BlogListClient({
  initialBlogs,
  initialRecommendBlogs,
  initialTypes,
  initialPageInfo,
  initialTags = [],
  initialArchives = {}
}: BlogListClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // 中间内容列：桌面端唯一滚动容器（window 在该布局下不滚动）
  const middleColumnRef = useRef<HTMLDivElement>(null)

  const [blogList, setBlogList] = useState<Blog[]>(initialBlogs)
  const [typeList, setTypeList] = useState<Type[]>(initialTypes)
  const [tagList, setTagList] = useState<Tag[]>(initialTags)
  const [blogsByType, setBlogsByType] = useState<BlogsByType>({})
  const [expandedTypes, setExpandedTypes] = useState<Set<number>>(new Set())
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(() => {
    const id = searchParams.get(API_PARAMS.TYPE_ID)
    return id ? parseInt(id, 10) : null
  })
  const [selectedTagId, setSelectedTagId] = useState<number | null>(() => {
    const id = searchParams.get('tagId')
    return id ? parseInt(id, 10) : null
  })
  const [selectedYear, setSelectedYear] = useState<string | null>(() => {
    return searchParams.get('year')
  })
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [loading, setLoading] = useState(false)
  const [pageInfo, setPageInfo] = useState<PageInfo>(initialPageInfo)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [inputPage, setInputPage] = useState(pageInfo.current)

  // 归档模式：选中某一年份
  const archiveMode = selectedYear !== null

  // 获取当前筛选状态文本
  const filterStatusText = useMemo(() => {
    const parts: string[] = []
    if (selectedYear !== null) parts.push(`${selectedYear} 年`)
    if (selectedTypeId !== null) parts.push(typeList.find(t => t.id === selectedTypeId)?.name || '')
    if (selectedTagId !== null) parts.push(`标签: ${tagList.find(t => t.id === selectedTagId)?.name || ''}`)
    return parts.length > 0 ? parts.join(' · ') : null
  }, [selectedYear, selectedTypeId, selectedTagId, typeList, tagList])

  // 排序 + 归档后的博客列表
  const displayBlogs = useMemo(() => {
    let list: Blog[] = archiveMode && initialArchives[selectedYear!]
      ? initialArchives[selectedYear!]
      : [...blogList]

    // 排序
    list.sort((a, b) => {
      switch (sortBy) {
        case 'recommend':
          // 推荐优先，然后按阅读量
          if (a.recommend !== b.recommend) return b.recommend ? 1 : -1
          return b.views - a.views
        case 'newest':
          return new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
        case 'oldest':
          return new Date(a.createTime).getTime() - new Date(b.createTime).getTime()
        case 'mostViewed':
          return b.views - a.views
        case 'leastViewed':
          return a.views - b.views
        default:
          return 0
      }
    })

    return list
  }, [archiveMode, selectedYear, sortBy, blogList, initialArchives])

  // 获取当前页应使用的 pageSize
  const getPageSize = useCallback((page: number) => {
    // 第一页使用较小的 pageSize（因为可能包含推荐博客）
    // 后续页面使用更大的 pageSize
    return page === 1 ? PAGINATION.BLOG_PAGE_SIZE : PAGINATION.BLOG_PAGE_SIZE_LARGE
  }, [])

  // 客户端获取博客列表（用于分页和筛选）
  const fetchBlogList = useCallback(async (page: number = pageInfo.current) => {
    try {
      setLoading(true)
      const pageSize = getPageSize(page)

      // 如果有选中标签，使用标签 API
      if (selectedTagId !== null) {
        const res = await fetch(
          `${ENDPOINTS.TAG_BLOGS(selectedTagId)}?${API_PARAMS.PAGE_NUM}=${page - 1}&${API_PARAMS.PAGE_SIZE}=${pageSize}`
        )
        const result = await res.json()
        if (result.data) {
          setBlogList(result.data.content || [])
          setPageInfo(prev => ({
            ...prev,
            total: result.data.totalElements || 0,
            totalPages: result.data.totalPages || 1,
            current: page,
            size: pageSize
          }))
        }
        return
      }

      // 否则使用普通博客列表 API
      const params: Record<string, string> = {
        [API_PARAMS.QUERY]: '',
        [API_PARAMS.PAGE_NUM]: String(page),
        [API_PARAMS.PAGE_SIZE]: String(pageSize)
      }
      if (selectedTypeId !== null) {
        params[API_PARAMS.TYPE_ID] = String(selectedTypeId)
      }

      const response = await fetch(`${ENDPOINTS.BLOGS}?${new URLSearchParams(params)}`)
      const result = await response.json()

      if (result.data) {
        setBlogList(result.data.content)
        setPageInfo(prev => ({
          ...prev,
          total: result.data.totalElements,
          totalPages: result.data.totalPages,
          current: result.data.number + 1,
          size: pageSize
        }))
      }
    } catch (error) {
      console.error('获取博客列表失败:', error)
    } finally {
      setLoading(false)
    }
  }, [getPageSize, pageInfo.current, selectedTypeId, selectedTagId])

  // 获取各分类下的博客标题（用于左侧二级导航）
  const fetchBlogsByType = useCallback(async () => {
    if (typeList.length === 0) return
    try {
      const map: BlogsByType = {}
      await Promise.all(
        typeList.map(async (type) => {
          try {
            const res = await fetch(
              `${ENDPOINTS.TYPE_BLOGS(type.id)}?${API_PARAMS.PAGE_NUM}=0&${API_PARAMS.PAGE_SIZE}=${BLOG_LIST_CONFIG.TYPE_BLOGS_PAGE_SIZE}`
            )
            const json = await res.json()
            const content = json.data?.content ?? json.content ?? []
            if (Array.isArray(content) && content.length > 0) {
              map[type.id] = content.map((b: Blog) => ({ id: b.id, title: b.title }))
            }
          } catch {
            // 忽略单个分类请求失败
          }
        })
      )
      setBlogsByType(map)
    } catch (error) {
      console.error('获取分类博客失败:', error)
    }
  }, [typeList])

  // 客户端 fallback：如果服务端未获取到分类，从客户端获取
  useEffect(() => {
    if (typeList.length === 0) {
      fetch(ENDPOINTS.TYPE_LIST)
        .then(res => res.json())
        .then(data => {
          if (data.code === API_CODE.SUCCESS && data.data) {
            setTypeList(data.data)
          }
        })
        .catch(err => console.error('客户端获取分类失败:', err))
    }
  }, [typeList.length])

  // 客户端 fallback：如果服务端未获取到标签，从客户端获取
  useEffect(() => {
    if (tagList.length === 0) {
      fetch(ENDPOINTS.FULL_TAG_LIST)
        .then(res => res.json())
        .then(data => {
          if (data.code === API_CODE.SUCCESS && data.data) {
            setTagList(data.data.map((tag: { id: number; name: string; blogNumber?: number }) => ({
              id: tag.id,
              name: tag.name,
              blogCount: tag.blogNumber || 0
            })))
          }
        })
        .catch(err => console.error('客户端获取标签失败:', err))
    }
  }, [tagList.length])

  useEffect(() => {
    if (typeList.length > 0) {
      fetchBlogsByType()
    }
  }, [typeList, fetchBlogsByType])

  useEffect(() => {
    const typeIdParam = searchParams.get(API_PARAMS.TYPE_ID)
    const tagIdParam = searchParams.get('tagId')
    const yearParam = searchParams.get('year')
    const typeId = typeIdParam ? parseInt(typeIdParam, 10) : null
    const tagId = tagIdParam ? parseInt(tagIdParam, 10) : null
    setSelectedTypeId(typeId)
    setSelectedTagId(tagId)
    setSelectedYear(yearParam)
    setPageInfo(prev => ({ ...prev, current: 1 }))
    if (typeId !== null) {
      setExpandedTypes(prev => new Set(prev).add(typeId))
    }
    // 非归档模式才请求列表
    if (!yearParam) {
      fetchBlogList(1)
    }
  }, [searchParams])

  const handleTypeSelect = (typeId: number | null) => {
    setSelectedTypeId(typeId)
    setSelectedTagId(null)
    setSelectedYear(null)
    setPageInfo(prev => ({ ...prev, current: 1 }))
    if (typeId !== null) {
      setExpandedTypes(prev => new Set(prev).add(typeId))
    }
    const url = typeId ? ROUTES.BLOG_LIST_WITH_TYPE(typeId) : ROUTES.BLOG_LIST
    router.push(url)
    // 仅变 query 的导航不会重挂载页面，需显式重置内部滚动容器
    scrollToTopOf(middleColumnRef.current)
    setMobileNavOpen(false)
  }

  const handleTagSelect = (tagId: number | null) => {
    setSelectedTagId(tagId)
    setSelectedTypeId(null)
    setSelectedYear(null)
    setPageInfo(prev => ({ ...prev, current: 1 }))
    const url = tagId ? `${ROUTES.BLOG_LIST}?tagId=${tagId}` : ROUTES.BLOG_LIST
    router.push(url)
    scrollToTopOf(middleColumnRef.current)
    setMobileFilterOpen(false)
  }

  const handleYearSelect = (year: string | null) => {
    setSelectedYear(year)
    setSelectedTypeId(null)
    setSelectedTagId(null)
    setPageInfo(prev => ({ ...prev, current: 1 }))
    const url = year ? `${ROUTES.BLOG_LIST}?year=${year}` : ROUTES.BLOG_LIST
    router.push(url)
    scrollToTopOf(middleColumnRef.current)
    setMobileFilterOpen(false)
  }

  const handleSortChange = (sort: SortOption) => {
    setSortBy(sort)
  }

  const toggleTypeExpand = (typeId: number) => {
    setExpandedTypes(prev => {
      const next = new Set(prev)
      if (next.has(typeId)) {
        next.delete(typeId)
      } else {
        next.add(typeId)
      }
      return next
    })
  }

  const resetFilters = () => {
    setSelectedTypeId(null)
    setSelectedTagId(null)
    setSelectedYear(null)
    setPageInfo(prev => ({ ...prev, current: 1 }))
    router.push(ROUTES.BLOG_LIST)
    scrollToTopOf(middleColumnRef.current)
    setMobileNavOpen(false)
    setMobileFilterOpen(false)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pageInfo.totalPages) {
      setPageInfo(prev => ({ ...prev, current: newPage }))
      setInputPage(newPage)
      fetchBlogList(newPage)
      // 桌面端滚动发生在中间列容器内，window.scrollTo 对其无效
      scrollToTopOf(middleColumnRef.current)
    }
  }

  const handlePageInputChange = (newPage: number) => {
    setInputPage(newPage)
  }

  const isCompactLayout = () => {
    return typeof window !== 'undefined' && window.innerWidth < 640
  }

  const hasActiveFilter = selectedTypeId !== null || selectedTagId !== null || selectedYear !== null

  return (
    <div className="min-h-screen flex flex-col z-1 bg-[rgb(var(--bg)/0.8)] text-[rgb(var(--text))]">
      {/* <BgOverlay opacity={0.2}/> */}

      <main className="blog-main-prose flex-1 flex flex-col min-h-0 w-full bg-[rgb(var(--bg)/0.8)] px-4 sm:px-6 lg:px-8 py-6 relative z-10 page-blog">
        {/* 三栏布局 - 固定高度，支持独立滚动 */}
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_240px] gap-6 h-full lg:h-[calc(100vh-56px)]">

          {/* 左侧目录树 - 桌面端 */}
          <aside className="hidden lg:block shrink-0 lg:overflow-y-auto lg:blog-page-scrollbar pr-2">
            <nav className="blog-nav-sidebar">
              <BlogCategoryTree
                types={typeList}
                blogsByType={blogsByType}
                selectedTypeId={selectedTypeId}
                expandedTypes={expandedTypes}
                onToggleExpand={toggleTypeExpand}
                onSelectType={handleTypeSelect}
              />
            </nav>
          </aside>

          {/* 左侧抽屉 - 移动端目录树 */}
          {mobileNavOpen && (
            <>
              <div
                className="fixed inset-0 bg-[rgb(var(--overlay))]/50 z-40 lg:hidden"
                onClick={() => setMobileNavOpen(false)}
              />
              <aside className="fixed left-0 top-0 bottom-0 w-72 bg-[rgb(var(--card))] z-50 lg:hidden shadow-xl p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[rgb(var(--text))]">目录</h3>
                  <button
                    onClick={() => setMobileNavOpen(false)}
                    className="p-1 rounded hover:bg-[rgb(var(--hover))]"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <BlogCategoryTree
                  types={typeList}
                  blogsByType={blogsByType}
                  selectedTypeId={selectedTypeId}
                  expandedTypes={expandedTypes}
                  onToggleExpand={toggleTypeExpand}
                  onSelectType={handleTypeSelect}
                />
              </aside>
            </>
          )}

          {/* 中间内容区 */}
          <div ref={middleColumnRef} className="min-w-0 lg:overflow-y-auto lg:blog-page-scrollbar lg:px-2">
            {/* 顶部工具栏 */}
            <div className="flex items-center justify-between mb-6">
              {/* 移动端布局 */}
              <div className="flex items-center justify-between w-full lg:hidden">
                <button
                  onClick={() => setMobileNavOpen(true)}
                  className="p-2 rounded-lg bg-[rgb(var(--muted))] hover:bg-[rgb(var(--primary)/0.1)] transition-colors"
                  title="打开目录"
                >
                  <ListTree className="h-4 w-4" />
                </button>

                <div className="flex items-baseline gap-3">
                  <h2 className="text-xl font-semibold text-[rgb(var(--text))]">
                    {filterStatusText || BLOG_LABELS.ALL_CATEGORIES}
                  </h2>
                  <span className="text-sm text-[rgb(var(--text-muted))]">
                    共 {pageInfo.total} 篇
                  </span>
                </div>

                <button
                  onClick={() => setMobileFilterOpen(true)}
                  className="p-2 rounded-lg bg-[rgb(var(--muted))] hover:bg-[rgb(var(--primary)/0.1)] transition-colors"
                  title="打开筛选"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </button>
              </div>

              {/* 桌面端布局 */}
              <div className="hidden lg:flex items-center gap-3">
                <h2 className="text-xl font-semibold text-[rgb(var(--text))]">
                  {filterStatusText || BLOG_LABELS.ALL_CATEGORIES}
                </h2>
                <span className="text-sm text-[rgb(var(--text-muted))]">
                  共 {pageInfo.total} 篇
                </span>
              </div>

              {/* 重置筛选按钮 */}
              {hasActiveFilter && (
                <button
                  onClick={resetFilters}
                  className="hidden lg:flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-[rgb(var(--text-muted))] hover:text-[rgb(var(--primary))] hover:bg-[rgb(var(--primary)/0.08)] transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  重置
                </button>
              )}
            </div>

            {/* 加载状态 */}
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: BLOG_LIST_CONFIG.SKELETON_COUNT }).map((_, index) => (
                  <div
                    key={index}
                    className="flex gap-4 p-4 rounded-xl bg-[rgb(var(--card))] animate-pulse"
                  >
                    <div className="w-28 h-20 sm:w-36 sm:h-24 bg-[rgb(var(--muted))] rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-[rgb(var(--muted))] rounded w-3/4" />
                      <div className="h-4 bg-[rgb(var(--muted))] rounded w-full" />
                      <div className="h-4 bg-[rgb(var(--muted))] rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : blogList.length === 0 ? (
              /* 空状态 */
              <div className="text-center py-16">
                <div className="text-[rgb(var(--text-muted))] blog-text-lg mb-4">
                  {BLOG_LABELS.NO_ARTICLES}
                </div>
                <button
                  onClick={resetFilters}
                  className="text-[rgb(var(--primary))] hover:text-[rgb(var(--primary-hover))] blog-text-base hover:underline transition-colors"
                >
                  {BLOG_LABELS.VIEW_ALL}
                </button>
              </div>
            ) : (
              /* 博客列表 */
              <div className="space-y-8">
                <section>
                  <div className="space-y-2">
                    {displayBlogs.map((blog, index) => (
                      <ArticleRow key={blog.id} blog={blog} index={index} />
                    ))}
                  </div>
                </section>

                {/* 分页 - 归档模式下隐藏 */}
                {!archiveMode && pageInfo.totalPages > 1 && (
                  <Pagination
                    totalcount={pageInfo.total}
                    currentPage={pageInfo.current}
                    pageSize={pageInfo.size}
                    isCompact={isCompactLayout()}
                    onPageChange={handlePageChange}
                    onInputChange={handlePageInputChange}
                  />
                )}
              </div>
            )}
          </div>

          {/* 右侧筛选面板 - 桌面端 */}
          <aside className="hidden lg:block shrink-0 lg:overflow-y-auto lg:blog-page-scrollbar pl-2">
            <div className="blog-filter-sidebar">
              <BlogFilterPanel
                types={typeList}
                blogsByType={blogsByType}
                selectedTypeId={selectedTypeId}
                tags={tagList}
                selectedTagId={selectedTagId}
                onSelectType={handleTypeSelect}
                onSelectTag={handleTagSelect}
                archives={initialArchives}
                selectedYear={selectedYear}
                onSelectYear={handleYearSelect}
                sortBy={sortBy}
                onSortChange={handleSortChange}
              />
            </div>
          </aside>

          {/* 右侧抽屉 - 移动端筛选 */}
          {mobileFilterOpen && (
            <>
              <div
                className="fixed inset-0 bg-[rgb(var(--overlay))]/50 z-40 lg:hidden"
                onClick={() => setMobileFilterOpen(false)}
              />
              <aside className="fixed right-0 top-0 bottom-0 w-72 bg-[rgb(var(--card))] z-50 lg:hidden shadow-xl p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[rgb(var(--text))]">筛选</h3>
                  <button
                    onClick={() => setMobileFilterOpen(false)}
                    className="p-1 rounded hover:bg-[rgb(var(--hover))]"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <BlogFilterPanel
                  types={typeList}
                  blogsByType={blogsByType}
                  selectedTypeId={selectedTypeId}
                  tags={tagList}
                  selectedTagId={selectedTagId}
                  onSelectType={handleTypeSelect}
                  onSelectTag={handleTagSelect}
                  archives={initialArchives}
                  selectedYear={selectedYear}
                  onSelectYear={handleYearSelect}
                  sortBy={sortBy}
                  onSortChange={handleSortChange}
                />
              </aside>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
