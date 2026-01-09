'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit, Trash2, AlertCircle, Loader2, Search } from 'lucide-react'
import { ENDPOINTS } from '@/lib/api'
import apiClient from '@/lib/utils' // 导入apiClient
import { showAlert } from '@/lib/Alert'

// 定义标签数据类型
interface Tag {
  id: number
  name: string
  blogsNumber: number
}

// API调用函数（与其他页面保持一致）
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

export default function TagsManagementPage() {
  // 状态管理
  const [tagList, setTagList] = useState<Tag[]>([])
  const [filteredTagList, setFilteredTagList] = useState<Tag[]>([])
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentTag, setCurrentTag] = useState<Partial<Tag>>({})
  const [formName, setFormName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')

  // 获取标签列表（使用useCallback优化）
  const getFullTagList = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetchData(ENDPOINTS.ADMIN.GET_FULL_TAG_LIST_AND_BLOG_NUMBER)

      if (res.code === 200) {
        // 按博客数量排序（降序）
        const sortedTags = res.data.sort((a: Tag, b: Tag) => b.blogsNumber - a.blogsNumber)
        setTagList(sortedTags)
        setFilteredTagList(sortedTags)
      } else {
        console.log(res.message || '获取标签失败')
      }
    } catch (error) {
      console.log('获取标签列表失败:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // 页面加载时获取标签列表
  useEffect(() => {
    getFullTagList()
  }, [getFullTagList])

  // 搜索功能
  useEffect(() => {
    if (!searchKeyword.trim()) {
      setFilteredTagList(tagList)
    } else {
      const keyword = searchKeyword.toLowerCase().trim()
      const filtered = tagList.filter(tag => tag.name.toLowerCase().includes(keyword))
      setFilteredTagList(filtered)
    }
  }, [searchKeyword, tagList])

  // 打开新建/编辑对话框
  const handleOpenDialog = (tag?: Tag) => {
    setIsDialogOpen(true)
    if (tag) {
      setCurrentTag(tag)
      setFormName(tag.name)
    } else {
      setCurrentTag({})
      setFormName('')
    }
  }

  // 关闭对话框
  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setFormName('')
  }

  // 创建或更新标签
  const handleSaveTag = async () => {
    if (!formName.trim()) {
      return showAlert('标签名称不能为空')
    }

    try {
      setLoading(true)
      const tagData = {
        id: currentTag.id,
        name: formName.trim()
      }

      let res
      if (currentTag.id) {
        // 更新现有标签
        res = await fetchData(ENDPOINTS.ADMIN.GET_FULL_TAG_LIST_AND_BLOG_NUMBER, 'POST', {
          tag: tagData
        })
      } else {
        // 创建新标签
        res = await fetchData(ENDPOINTS.ADMIN.TAGS, 'POST', { tag: tagData })
      }

      if (res.code === 200) {
        showAlert(res.message || (currentTag.id ? '标签更新成功' : '标签创建成功'))
        handleCloseDialog()
        getFullTagList()
      } else {
        showAlert(res.message || '操作失败')
      }
    } catch (error) {
      console.error('保存标签失败:', error)
      showAlert('保存标签失败')
    } finally {
      setLoading(false)
    }
  }

  // 删除标签
  const handleDeleteTag = async (id: number) => {
    try {
      setLoading(true)
      const res = await fetchData(`${ENDPOINTS.ADMIN.TAGS}/${id}/delete`, 'GET')

      if (res.code === 200) {
        showAlert(res.message || '标签删除成功')
        getFullTagList()
      } else {
        showAlert(res.message || '删除失败')
      }
    } catch (error) {
      console.error('删除标签失败:', error)
      showAlert('删除标签失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-blue-50 text-slate-800 dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-200 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(50,100,200,0.1)_0%,transparent_40%),radial-gradient(circle_at_80%_80%,rgba(80,120,250,0.1)_0%,transparent_40%)] dark:opacity-100 opacity-0"></div>

      <main className="flex-1 w-full max-w-7xl mx-auto lg:px-2 lg:py-2 relative z-10">
        {/* 主内容区卡片 */}
        <div className="bg-white/80 backdrop-blur-sm lg:rounded-xl shadow-sm min-h-[100vh] border border-slate-200/50 overflow-hidden dark:bg-slate-800/40 dark:border-slate-700/50">
          {/* 操作栏：使用网格布局确保内容始终完全显示在一行 */}
          <div className="py-2 px-6 border-b border-slate-200/50 dark:border-slate-700/50 grid grid-cols-[auto_1fr_auto] items-center gap-4">
            {/* 标题：固定宽度，保证完整显示 */}
            <h2 className="text-base sm:text-lg md:text-xl text-blue-600 whitespace-nowrap dark:text-blue-400">
              标签列表
            </h2>

            {/* 搜索框：可伸缩，占据剩余空间 */}
            <div className="relative min-w-[80px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
                placeholder="搜索..."
                className="pl-10 pr-4 py-2 rounded-lg border border-slate-300 bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all w-full text-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
              />
            </div>

            {/* 新建标签按钮：固定宽度，确保始终可见 */}
            <button
              onClick={() => handleOpenDialog()}
              disabled={loading}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 whitespace-nowrap ${
                loading
                  ? 'bg-slate-300 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                  : 'bg-blue-500 hover:bg-blue-600 text-white hover:shadow-md dark:bg-blue-600 dark:hover:bg-blue-500'
              }`}
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm hidden sm:block">新建标签</span>
            </button>
          </div>

          {/* 标签列表区域 */}
          <div className="p-3 min-h-[90vh]">
            {loading ? (
              // 加载状态骨架屏
              <div className="space-y-4 h-[400px] flex flex-col justify-center">
                {[1, 2, 3, 4, 5, 6].map(item => (
                  <div key={item} className="animate-pulse bg-slate-200/50 rounded-lg h-24 dark:bg-slate-700/50"></div>
                ))}
              </div>
            ) : filteredTagList.length > 0 ? (
              // 标签网格布局（响应式设计）
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                {filteredTagList.map(tag => (
                  <div
                    key={tag.id}
                    className="bg-white/60 border border-slate-200/50 rounded-lg px-3 py-2 lg:p-4 hover:bg-slate-100/80 transition-all duration-300 hover:shadow-md relative group dark:bg-slate-900/60 dark:border-slate-700/50 dark:hover:bg-slate-800/80"
                  >
                    {/* 操作按钮（悬停显示） */}
                    <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenDialog(tag)}
                        className="p-1.5 rounded-full text-slate-500 hover:text-blue-600 hover:bg-blue-500/10 transition-colors dark:text-slate-400 dark:hover:text-blue-400"
                        title="编辑"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(tag.id)}
                        className="p-1.5 rounded-full text-slate-500 hover:text-red-600 hover:bg-red-500/10 transition-colors dark:text-slate-400 dark:hover:text-red-400"
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* 标签内容 - 修改为同一行显示 */}
                    <div className="pt-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-blue-600 text-[clamp(0.8rem,3vw,0.9rem)] sm:text-base dark:text-blue-400">
                          标签名称
                        </p>
                        <p className="text-blue-500 text-[clamp(0.8rem,3vw,0.9rem)] sm:text-base dark:text-blue-500">
                          {tag.name}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-slate-600 text-[clamp(0.8rem,3vw,0.9rem)] sm:text-base dark:text-slate-400">
                          关联博客
                        </p>
                        <p className="text-green-500 text-[clamp(0.8rem,3vw,0.9rem)] sm:text-base dark:text-green-400">
                          {tag.blogsNumber} 篇
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // 空状态
              <div className="h-[400px] flex flex-col items-center justify-center text-center">
                <div className="text-slate-500 mb-4 dark:text-slate-400">
                  <Plus className="h-12 mx-auto" />
                </div>
                <p className="text-slate-400 dark:text-slate-400">
                  {searchKeyword ? '未找到匹配的标签' : '暂无标签数据'}
                </p>
                {searchKeyword ? (
                  <button
                    onClick={() => setSearchKeyword('')}
                    className="mt-4 px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors text-sm dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                  >
                    清除搜索
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenDialog()}
                    disabled={loading}
                    className="mt-4 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors text-sm dark:bg-blue-600 dark:hover:bg-blue-500"
                  >
                    创建第一个标签
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 编辑/创建标签对话框 */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 rounded-xl border border-slate-200/50 w-full max-w-md p-5 sm:p-6 dark:bg-slate-800 dark:border-slate-700">
            <h3 className="text-base sm:text-lg font-semibold text-blue-600 mb-4 dark:text-blue-400">
              {currentTag.id ? '编辑标签' : '新建标签'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-700 mb-1 dark:text-slate-300">标签名称</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
                  placeholder="请输入标签名称"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCloseDialog}
                className="px-3 sm:px-4 py-2 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                取消
              </button>
              <button
                onClick={handleSaveTag}
                disabled={loading}
                className="px-3 sm:px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                提交
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 rounded-xl border border-slate-200/50 w-full max-w-md p-5 sm:p-6 dark:bg-slate-800 dark:border-slate-700">
            <h3 className="text-base sm:text-lg font-semibold text-blue-600 mb-2 flex items-center dark:text-blue-400">
              <AlertCircle className="h-5 w-5 mr-2 text-amber-400" />
              确认删除
            </h3>
            <p className="text-slate-600 mb-5 sm:mb-6 text-sm sm:text-base">
              此操作将永久删除该标签，是否继续？
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-3 sm:px-4 py-2 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                取消
              </button>
              <button
                onClick={() => {
                  handleDeleteTag(confirmDelete)
                  setConfirmDelete(null)
                }}
                disabled={loading}
                className="px-3 sm:px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-500 transition-colors flex items-center gap-2 text-sm"
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
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
        </div>
      )}
    </div>
  )
}