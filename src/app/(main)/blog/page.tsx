'use client'

import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react'
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
}

interface Type {
  id: number
  name: string
}

interface ApiResponse<T> {
  data: T
}

interface PagedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
}

export default function BlogListPage() {
  const router = useRouter()

  // 页面加载时滚动到顶部
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const [blogList, setBlogList] = useState<Blog[]>([])
  const [typeList, setTypeList] = useState<Type[]>([])
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [pageInfo, setPageInfo] = useState({
    current: 1,
    size: 8,
    total: 0,
    totalPages: 0
  })

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  // 获取博客列表
  const fetchBlogList = useCallback(async () => {
    try {
      setLoading(true)
      const params: any = {
        query: '',
        pagenum: pageInfo.current,
        pagesize: pageInfo.size
      }

      if (selectedTypeId !== null) {
        params.typeId = selectedTypeId
      }

      const response = await fetch(`${ENDPOINTS.BLOGS}?${new URLSearchParams(params)}`)
      const result: ApiResponse<PagedResponse<Blog>> = await response.json()

      if (result.data) {
        setBlogList(result.data.content)
        setPageInfo(prev => ({
          ...prev,
          total: result.data.totalElements,
          totalPages: result.data.totalPages,
          current: result.data.number + 1
        }))
      }
    } catch (error) {
      console.error('获取博客列表失败:', error)
    } finally {
      setLoading(false)
    }
  }, [pageInfo.current, pageInfo.size, selectedTypeId])

  // 获取分类列表
  const fetchTypeList = useCallback(async () => {
    try {
      const response = await fetch(ENDPOINTS.TYPE_LIST)
      const result: ApiResponse<Type[]> = await response.json()
      if (result.data) {
        setTypeList(result.data)
      }
    } catch (error) {
      console.error('获取分类列表失败:', error)
    }
  }, [])

  // 初始化加载
  useEffect(() => {
    fetchTypeList()
    fetchBlogList()
  }, [fetchBlogList, fetchTypeList])

  // 处理分类选择
  const handleTypeSelect = (typeId: number | null) => {
    setSelectedTypeId(typeId)
    setPageInfo(prev => ({ ...prev, current: 1 }))
  }

  // 处理翻页
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pageInfo.totalPages) {
      setPageInfo(prev => ({ ...prev, current: newPage }))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // 处理博客点击
  const handleBlogClick = (blogId: number) => {
    router.push(`/blog/${blogId}`)
  }

  // 生成页码数组
  const generatePageNumbers = () => {
    const pages = []
    const current = pageInfo.current
    const totalPages = pageInfo.totalPages

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      if (current > 3) pages.push('...')
      if (current > 2) pages.push(current - 1)
      if (current !== 1 && current !== totalPages) pages.push(current)
      if (current < totalPages - 1) pages.push(current + 1)
      if (current < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }

    return pages
  }

  // 骨架屏组件
  const BlogSkeleton = () => (
    <div className="border-b border-slate-200 dark:border-slate-700/50 p-4 rounded-lg py-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-1">
          <div className="relative h-40 w-full rounded-lg overflow-hidden shadow-md border border-slate-200 dark:border-slate-700/50">
            <div className="absolute inset-0 animate-pulse bg-slate-200 dark:bg-slate-700/50"></div>
          </div>
        </div>
        <div className="sm:col-span-2 flex flex-col">
          <div className="h-7 mb-2 bg-slate-200 dark:bg-slate-700/50 rounded w-3/4 animate-pulse"></div>
          <div className="space-y-2 mb-4 flex-grow">
            <div className="h-4 bg-slate-200 dark:bg-slate-700/50 rounded animate-pulse"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-5/6 animate-pulse"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-4/6 animate-pulse"></div>
          </div>
          <div className="flex items-center text-sm">
            <div className="h-6 w-6 bg-slate-200 dark:bg-slate-700/50 rounded-full animate-pulse"></div>
            <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700/50 rounded ml-2 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen z-1 flex flex-col bg-white dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-200">
      <style jsx global>{`
        ::-webkit-scrollbar {
          display: none;
        }
        html {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
          background: linear-gradient(
            90deg,
            rgba(148, 163, 184, 0.1) 0%,
            rgba(148, 163, 184, 0.2) 50%,
            rgba(148, 163, 184, 0.1) 100%
          );
          background-size: 200% 100%;
        }
      `}</style>

      <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/40"></div>

      <main className="container mx-auto px-4 max-w-7xl py-4 relative z-10">

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 左侧博客列表 */}
          <div className="lg:col-span-3">
            {loading ? (
              // 加载中显示骨架屏
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <BlogSkeleton key={index} />
                ))}
              </div>
            ) : blogList.length === 0 ? (
              // 空状态
              <div className="text-center py-12">
                <div className="text-slate-400 dark:text-slate-500 text-lg mb-4">
                  暂无文章
                </div>
                <button
                  onClick={() => {
                    setSelectedTypeId(null)
                    setPageInfo(prev => ({ ...prev, current: 1 }))
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  查看全部文章
                </button>
              </div>
            ) : (
              // 博客列表
              <div className="space-y-4">
                {blogList.map((blog) => (
                  <div
                    key={blog.id}
                    onClick={() => handleBlogClick(blog.id)}
                    className="border-b border-slate-200 dark:border-slate-700/50 p-4 rounded-lg py-4 cursor-pointer hover:shadow-md transition-all duration-300 hover:translate-x-1 bg-white/90 dark:bg-slate-800/40 backdrop-blur-sm border border-slate-200 dark:border-slate-700/50"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-1">
                        <div className="relative h-40 w-full rounded-lg overflow-hidden shadow-md border border-slate-200 dark:border-slate-700/50">
                          {blog.firstPicture ? (
                            <Image
                              src={blog.firstPicture}
                              alt={blog.title}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                              sizes="(max-width: 640px) 100vw, 33vw"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                              <span className="text-white text-4xl font-bold">
                                {blog.title.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="sm:col-span-2 flex flex-col">
                        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2 line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          {blog.title}
                        </h2>
                        <p className="text-slate-600 dark:text-slate-300 mb-4 line-clamp-3 flex-grow">
                          {blog.description}
                        </p>
                        <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 flex-wrap gap-4">
                          <div className="flex items-center">
                            <div className="relative h-6 w-6 rounded-full overflow-hidden mr-2 border border-slate-300 dark:border-slate-600">
                              <Image
                                src={blog.user.avatar || '/default-avatar.png'}
                                alt={blog.user.nickname}
                                fill
                                className="object-cover"
                                sizes="24px"
                              />
                            </div>
                            <span>{blog.user.nickname}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>{formatDate(blog.createTime)}</span>
                          </div>
                          <div className="flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            <span>{blog.views}</span>
                          </div>
                          <div className="ml-auto">
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-xs rounded">
                              {blog.type.name}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* 分页 */}
                {pageInfo.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                      onClick={() => handlePageChange(pageInfo.current - 1)}
                      disabled={pageInfo.current === 1}
                      className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    {generatePageNumbers().map((page, index) => (
                      <button
                        key={index}
                        onClick={() => typeof page === 'number' && handlePageChange(page)}
                        disabled={typeof page !== 'number'}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          typeof page === 'number' && page === pageInfo.current
                            ? 'bg-blue-600 text-white'
                            : typeof page === 'number'
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                            : 'bg-transparent text-slate-400 cursor-default'
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => handlePageChange(pageInfo.current + 1)}
                      disabled={pageInfo.current === pageInfo.totalPages}
                      className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 右侧分类筛选 */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white/90 dark:bg-slate-800/40 backdrop-blur-sm rounded-lg p-4 sticky top-24 border border-slate-200 dark:border-slate-700/50">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                文章分类
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleTypeSelect(null)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedTypeId === null
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                  }`}
                >
                  全部分类
                </button>
                {typeList.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleTypeSelect(type.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedTypeId === type.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                    }`}
                  >
                    {type.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
