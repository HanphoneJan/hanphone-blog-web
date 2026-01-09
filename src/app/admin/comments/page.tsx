'use client'

import Image from 'next/image'
import { useState, useEffect, useCallback} from 'react'
import { Delete, Loader2, AlertCircle, Search,  X } from 'lucide-react'
import Link from 'next/link'
import { ENDPOINTS } from '@/lib/api'
import apiClient from '@/lib/utils'
import { showAlert } from '@/lib/Alert'

// 定义类型接口
interface Blog {
  id: number
  title: string
}

interface Comment {
  id: number
  avatar: string
  nickname: string
  createTime: string
  blog: Blog
  content: string
}

// API调用函数
const fetchData = async (url: string, method: string = 'GET', data?: unknown) => {
  try {
    const response = await apiClient({
      url,
      method,
      data: method !== 'GET' ? data : undefined,
      params: method === 'GET' ? data : undefined
    })

    return response.data
  } catch (error) {
    console.log(`Error fetching ${url}:`, error)
    return { code: 500, data: null }
  }
}

export default function CommentsPage() {
  // 状态管理
  const [commentList, setCommentList] = useState<Comment[]>([])
  const [filteredCommentList, setFilteredCommentList] = useState<Comment[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedBlog, setSelectedBlog] = useState<string>('all')

  // 获取评论列表
  const getCommentList = async () => {
    try {
      setLoading(true)
      const res = await fetchData(ENDPOINTS.ADMIN.COMMMENT_LIST)

      if (res.code === 200) {
        const comments = res.data || []
        setCommentList(comments)
        setFilteredCommentList(comments)
      } else {
        showAlert('获取评论列表失败')
      }
    } catch (error) {
      console.error('获取评论列表失败:', error)
      showAlert('获取评论列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 搜索和筛选功能
  const handleSearchAndFilter = useCallback(() => {
    let filtered = commentList

    // 按博客筛选
    if (selectedBlog !== 'all') {
      filtered = filtered.filter(comment => comment.blog.id.toString() === selectedBlog)
    }

    // 按关键词搜索
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase().trim()
      filtered = filtered.filter(
        comment =>
          comment.content.toLowerCase().includes(keyword) ||
          comment.nickname.toLowerCase().includes(keyword) ||
          comment.blog.title.toLowerCase().includes(keyword)
      )
    }

    setFilteredCommentList(filtered)
  }, [commentList, searchKeyword, selectedBlog])

  // 当搜索条件或博客筛选变化时更新列表
  useEffect(() => {
    handleSearchAndFilter()
  }, [handleSearchAndFilter])

  // 获取唯一的博客列表用于筛选
  const blogOptions = Array.from(
    new Map(commentList.map(comment => [comment.blog.id, comment.blog])).values()
  )

  // 删除评论
  const deleteCommentById = async (id: number) => {
    setDeleteConfirm(id)
  }

  // 确认删除评论
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return

    try {
      setLoading(true)
      const res = await fetchData(`${ENDPOINTS.COMMENTS}/${deleteConfirm}/delete`, 'GET')

      if (res.code === 200) {
        showAlert('评论删除成功')
        getCommentList()
      } else {
        showAlert(res.message || '评论删除失败')
      }
    } catch (error) {
      console.error('删除评论失败:', error)
      showAlert('删除评论失败')
    } finally {
      setLoading(false)
      setDeleteConfirm(null)
    }
  }

  // 组件挂载时获取评论列表
  useEffect(() => {
    getCommentList()
  }, [])

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // 清除搜索关键词
  const clearSearch = () => {
    setSearchKeyword('')
  }

  return (
    <div className="font-sans min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-blue-50 text-slate-800 dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-200 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(50,100,200,0.1)_0%,transparent_40%),radial-gradient(circle_at_80%_80%,rgba(80,120,250,0.1)_0%,transparent_40%)] dark:opacity-100 opacity-0"></div>

      <main className="flex-1 w-full max-w-7xl mx-auto lg:px-2 lg:py-2 relative z-10">
        {/* 主内容区卡片 */}
        <div className="bg-white/80 backdrop-blur-sm lg:rounded-xl shadow-sm min-h-[100vh] border border-slate-200/50 overflow-hidden dark:bg-slate-800/40 dark:border-slate-700/50">
          {/* 操作栏：优化布局防止溢出 */}
          <div className="py-2 px-4 border-b border-slate-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-[320px] dark:border-slate-700/50">
            {/* 标题和统计信息行 */}
            <div className="flex items-center justify-between w-full sm:w-auto gap-4">
              <h2 className="text-base sm:text-lg text-blue-600 dark:text-blue-100 whitespace-nowrap flex-shrink-0">
                评论管理
              </h2>

              {/* 统计信息 - 确保不会被覆盖 */}
              <div className="text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap flex-shrink-0">
                共 {filteredCommentList.length} 条
              </div>
            </div>

            {/* 搜索和筛选区域：单独一行在移动端，确保不溢出 */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* 搜索框 */}
              <div className="relative flex-1 min-w-[120px]">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={e => setSearchKeyword(e.target.value)}
                  placeholder="搜索..."
                  className="pl-8 pr-8 py-1.5 rounded-lg border border-slate-300 bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all w-full text-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
                />
                {searchKeyword && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* 博客筛选：使用原生select组件 */}
              <div className="relative min-w-[160px] sm:min-w-[200px]">
                <select
                  value={selectedBlog}
                  onChange={e => setSelectedBlog(e.target.value)}
                  className="w-full appearance-none border border-slate-300 bg-white text-slate-800 text-sm rounded-lg py-1.5 pl-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-blue-500"
                >
                  <option value="all">全部博客</option>
                  {blogOptions.map(blog => (
                    <option
                      key={blog.id}
                      value={blog.id.toString()}
                      className="bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    >
                      {blog.title}
                    </option>
                  ))}
                </select>
                {/* 自定义下拉箭头 */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400 dark:text-slate-500">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* 评论列表内容 */}
          <div className="p-3 md:p-6 min-h-[90vh]">
            {loading ? (
              // 加载状态骨架屏
              <div className="space-y-3 h-[400px] flex flex-col justify-center">
                {[1, 2, 3, 4, 5].map(item => (
                  <div key={item} className="animate-pulse bg-slate-200/50 rounded-lg h-16 dark:bg-slate-700/50"></div>
                ))}
              </div>
            ) : filteredCommentList.length > 0 ? (
              <div className="">
                {filteredCommentList.map(comment => (
                  <div
                    key={comment.id}
                    className="bg-white/60 border border-slate-200/50 rounded-lg p-3 hover:bg-slate-100/80 transition-all duration-300 dark:bg-slate-900/60 dark:border-slate-700 dark:hover:bg-slate-800/80"
                  >
                    <div className="flex gap-3">
                      {/* 头像 */}
                      <div className="flex-shrink-0">
                        <Image
                          src={comment.avatar || '/default-avatar.png'}
                          alt={comment.nickname}
                          width={36}
                          height={36}
                          className="w-9 h-9 rounded-full object-cover border border-slate-300 dark:border-slate-700"
                        />
                      </div>

                      {/* 评论内容 */}
                      <div className="flex-1 min-w-0">
                        {/* 评论头部信息 */}
                        <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1 mb-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="font-medium text-slate-800 text-sm dark:text-slate-200">
                              {comment.nickname}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {formatDate(comment.createTime)}
                            </span>
                          </div>

                          {/* 删除按钮 */}
                          <button
                            onClick={() => deleteCommentById(comment.id)}
                            className="text-red-600 hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded transition-colors text-xs flex items-center gap-1 ml-2 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Delete className="h-3.5 w-3.5" />
                            删除
                          </button>
                        </div>

                        {/* 博客信息 */}
                        <div className="text-xs text-slate-500 mb-1 flex items-center dark:text-slate-400">
                          <span>回复了</span>
                          <Link
                            href={`/blogInfo?id=${comment.blog.id}`}
                            className="text-blue-600 hover:underline ml-1 max-w-[200px] truncate dark:text-blue-400"
                          >
                            {comment.blog.title}
                          </Link>
                        </div>

                        {/* 评论内容 */}
                        <p className="text-slate-700 text-sm mb-1 break-words dark:text-slate-300">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // 空状态
              <div className="h-[400px] flex flex-col items-center justify-center text-center p-4">
                <div className="text-slate-400 dark:text-slate-500 mb-4">
                  <AlertCircle className="h-12 mx-auto" />
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                  {searchKeyword || selectedBlog !== 'all' ? '未找到匹配的评论' : '暂无评论数据'}
                </p>
                {(searchKeyword || selectedBlog !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchKeyword('')
                      setSelectedBlog('all')
                    }}
                    className="mt-4 px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors text-sm dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white"
                  >
                    清除筛选
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 删除确认弹窗 */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200/50 w-full max-w-md p-5 dark:bg-slate-800 dark:border-slate-700">
            <h3 className="text-base font-semibold text-blue-600 mb-3 flex items-center dark:text-blue-100">
              <AlertCircle className="h-5 w-5 mr-2 text-amber-400" />
              确认删除
            </h3>
            <p className="text-slate-700 mb-5 text-sm dark:text-slate-300">此操作将永久删除该评论，是否继续？</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2.5 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                取消
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={loading}
                className="px-4 py-2.5 rounded-md bg-red-600 text-white hover:bg-red-500 transition-colors flex items-center gap-2 text-sm"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 全局加载指示器 */}
      {loading && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 dark:border-blue-500"></div>
        </div>
      )}
    </div>
  )
}