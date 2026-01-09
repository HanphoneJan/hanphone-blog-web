'use client'
import Image from 'next/image'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  Loader2,
  Upload as UploadIcon,
  X,
  Search
} from 'lucide-react'
import { ENDPOINTS } from '@/lib/api'
import apiClient from '@/lib/utils'
import { showAlert } from '@/lib/Alert'
import { PicResponse } from '@/types/response'
import Compressor from 'compressorjs'

// 定义分类数据类型
interface Category {
  id: number
  name: string
  pic_url: string
  color?: string
  blogs: { id: number }[]
}

// 定义上传文件类型
interface UploadFile {
  uid: string
  name: string
  url: string
}

// API调用函数（与标签管理保持一致）
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

export default function CategoryManagement() {
  // 状态管理
  const [categoryList, setCategoryList] = useState<Category[]>([])
  const [filteredCategoryList, setFilteredCategoryList] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewImage, setPreviewImage] = useState('')
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [currentCategory, setCurrentCategory] = useState<Partial<Category> | null>(null)
  const [formName, setFormName] = useState('')
  const [formPicUrl, setFormPicUrl] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false) // 新增上传状态
  const [searchKeyword, setSearchKeyword] = useState('')
  const uploadRef = useRef<HTMLInputElement>(null) // 上传input的ref

  // 获取分类列表
  const getFullCategoryList = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetchData(ENDPOINTS.ADMIN.FULL_TYPE_LIST)

      if (res.code === 200) {
        // 按博客数量排序（降序）
        const sortedCategories = res.data.sort(
          (a: Category, b: Category) => b.blogs.length - a.blogs.length
        )
        setCategoryList(sortedCategories)
        setFilteredCategoryList(sortedCategories)
      } else {
        console.log(res.message || '获取分类失败')
        showAlert(res.message || '获取分类失败')
      }
    } catch (error) {
      console.log('获取分类列表失败:', error)
      showAlert('获取分类列表失败')
    } finally {
      setLoading(false)
    }
  }, [])

  // 初始化加载数据
  useEffect(() => {
    getFullCategoryList()
  }, [getFullCategoryList])

  // 搜索功能
  useEffect(() => {
    if (!searchKeyword.trim()) {
      setFilteredCategoryList(categoryList)
    } else {
      const keyword = searchKeyword.toLowerCase().trim()
      const filtered = categoryList.filter(category =>
        category.name.toLowerCase().includes(keyword)
      )
      setFilteredCategoryList(filtered)
    }
  }, [searchKeyword, categoryList])

  // 处理图片预览
  const handlePreview = (file: UploadFile) => {
    setPreviewImage(file.url || '')
    setPreviewVisible(true)
  }

  // 处理图片移除
  const handleRemove = () => {
    setFileList([])
    setPreviewImage('')
    setFormPicUrl('')
  }

  // 处理图片上传成功
  const handleUploadSuccess = (data: PicResponse) => {
    if (data.code === 200) {
      // 修改：检查code而不是status
      const url = data.url
      // 更新文件列表确保图片回显
      setFileList([{ uid: Date.now().toString(), name: 'category-image', url }])
      setPreviewImage(url)
      setFormPicUrl(url)
    } else {
      showAlert(data.message || '上传失败')
    }
  }

  // 处理文件选择和压缩
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return

    const file = e.target.files[0]
    // 保存原始文件名（不含扩展名）和扩展名
    const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
    const fileExtension = 'jpeg' // 统一使用jpeg扩展名
    const newFileName = `${originalName}.${fileExtension}`

    // 使用Compressor压缩图片
    new Compressor(file, {
      quality: 0.8, // 压缩质量，0-1之间
      maxWidth: 1200, // 最大宽度限制
      maxHeight: 1200, // 最大高度限制
      mimeType: 'image/jpeg', // 确保MIME类型正确
      convertSize: 102400, // 小于100KB的图片也进行转换
      success: async compressedResult => {
        try {
          setUploading(true)

          // 将压缩后的blob转换为File对象，并保持原始文件名（修改扩展名为jpeg）
          const compressedFile = new File([compressedResult], newFileName, {
            type: 'image/jpeg',
            lastModified: Date.now()
          })

          const formData = new FormData()
          formData.append('namespace', 'blog/type')
          formData.append('file', compressedFile) // 使用带有原始文件名的压缩文件

          const response = await apiClient({
            url: ENDPOINTS.FILE.UPLOAD,
            method: 'POST',
            data: formData
          })
          const data = response.data
          handleUploadSuccess(data)
        } catch (error) {
          console.error('上传失败:', error)
          showAlert('上传失败')
        } finally {
          setUploading(false)
          if (uploadRef.current) uploadRef.current.value = ''
        }
      },
      error: err => {
        console.error('图片压缩失败:', err)
        showAlert('图片压缩失败，请重试')
        setUploading(false)
        if (uploadRef.current) uploadRef.current.value = ''
      }
    })
  }

  // 打开新增/编辑对话框
  const handleOpenDialog = (category?: Category) => {
    setIsDialogOpen(true)
    if (category) {
      setCurrentCategory(category)
      setFormName(category.name)
      setFormPicUrl(category.pic_url)
      setFileList(
        category.pic_url
          ? [{ uid: category.id.toString(), name: 'category-image', url: category.pic_url }]
          : []
      )
      setPreviewImage(category.pic_url || '')
    } else {
      setCurrentCategory(null)
      setFormName('')
      setFormPicUrl('')
      setFileList([])
      setPreviewImage('')
    }
  }

  // 关闭对话框
  const handleCloseDialog = () => {
    setIsDialogOpen(false)
  }

  // 提交表单（新增或编辑）
  const handleSaveCategory = async () => {
    if (!formName.trim()) {
      return showAlert('分类名称不能为空')
    }

    try {
      setLoading(true)
      // 统一数据结构，确保被type字段包裹
      const payload = {
        type: {
          id: currentCategory?.id,
          name: formName.trim(),
          pic_url: formPicUrl,
          color: null
        }
      }

      let res
      if (currentCategory?.id) {
        // 更新现有分类
        res = await fetchData(ENDPOINTS.ADMIN.TYPES, 'POST', payload)
      } else {
        // 创建新分类 - 确保数据被type字段包裹
        res = await fetchData(ENDPOINTS.ADMIN.TYPES, 'POST', payload)
      }

      if (res.code === 200) {
        showAlert(res.message || (currentCategory?.id ? '分类更新成功' : '分类创建成功'))
        handleCloseDialog()
        getFullCategoryList()
      } else {
        showAlert(res.message || '操作失败')
      }
    } catch (error) {
      console.error('保存分类失败:', error)
      showAlert('保存分类失败')
    } finally {
      setLoading(false)
    }
  }

  // 删除分类
  const handleDeleteCategory = async (id: number) => {
    try {
      setLoading(true)
      const res = await fetchData(`${ENDPOINTS.ADMIN.TYPES}/${id}/delete`, 'GET')

      if (res.code === 200) {
        showAlert(res.message || '分类删除成功')
        getFullCategoryList()
      } else {
        showAlert(res.message || '删除失败')
      }
    } catch (error) {
      console.error('删除分类失败:', error)
      showAlert('删除分类失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="font-sans min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-blue-50 text-slate-800 dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-200 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(50,100,200,0.1)_0%,transparent_40%),radial-gradient(circle_at_80%_80%,rgba(80,120,250,0.1)_0%,transparent_40%)] dark:opacity-100 opacity-0"></div>

      <main className="flex-1 w-full max-w-7xl mx-auto lg:px-2 lg:py-2 relative z-10">
        {/* 主内容区卡片 */}
        <div className="bg-white/80 backdrop-blur-sm lg:rounded-xl shadow-sm border border-slate-200/50 overflow-hidden dark:bg-slate-800/40 dark:border-slate-700/50">
          {/* 操作栏：使用网格布局确保内容始终完全显示在一行 */}
          <div className="py-2 px-6 border-b border-slate-200/50 dark:border-slate-700/50 grid grid-cols-[auto_1fr_auto] items-center gap-4">
            {/* 标题：固定宽度，保证完整显示 */}
            <h2 className="text-base sm:text-lg md:text-xl text-blue-600 whitespace-nowrap dark:text-blue-400">
              分类列表
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

            {/* 新建分类按钮：固定宽度，确保始终可见 */}
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
              <span className="text-sm hidden sm:block">新建分类</span>
            </button>
          </div>

          {/* 分类列表区域 */}
          <div className="p-3 min-h-[90vh]">
            {loading ? (
              // 加载状态骨架屏
              <div className="space-y-4 h-[400px] flex flex-col justify-center">
                {[1, 2, 3, 4, 5, 6].map(item => (
                  <div key={item} className="animate-pulse bg-slate-200/50 rounded-lg h-24 dark:bg-slate-700/50"></div>
                ))}
              </div>
            ) : filteredCategoryList.length > 0 ? (
              // 分类网格布局
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                {filteredCategoryList.map((category, index) => (
                  // 分类卡片
                  <div
                    key={category.id}
                    className="bg-white/60 border border-slate-200/50 rounded-lg px-3 py-2 lg:p-4 hover:bg-slate-100/80 transition-all duration-300 hover:shadow-md relative group dark:bg-slate-900/60 dark:border-slate-700/50 dark:hover:bg-slate-800/80"
                  >
                    {/* 操作按钮（悬停显示） */}
                    <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenDialog(category)}
                        className="p-1.5 rounded-full text-slate-500 hover:text-blue-600 hover:bg-blue-500/10 transition-colors dark:text-slate-400 dark:hover:text-blue-400"
                        title="编辑"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(category.id)}
                        className="p-1.5 rounded-full text-slate-500 hover:text-red-600 hover:bg-red-500/10 transition-colors dark:text-slate-400 dark:hover:text-red-400"
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* 分类内容 */}
                    <div className="pt-1 space-y-1">
                      {/* 序号 */}
                      <div className="flex items-center justify-center mb-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm dark:text-blue-400">{index + 1}</span>
                        </div>
                      </div>

                      {/* 分类图片 */}
                      <div className="w-24 h-24 rounded-lg overflow-hidden border border-slate-200/50 mb-2 flex items-center justify-center bg-slate-100/50 mx-auto dark:border-slate-700/50 dark:bg-slate-800/50">
                        <Image
                          src={category.pic_url || 'https://hanphone.top/images/bg_1.jpg'}
                          alt={category.name}
                          width={96}
                          height={96}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>

                      {/* 分类名称 - 修改为同一行显示 */}
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-blue-600 text-[clamp(0.8rem,3vw,0.9rem)] sm:text-base dark:text-blue-400">
                          分类名称
                        </p>
                        <p className="text-blue-500 text-[clamp(0.8rem,3vw,0.9rem)] sm:text-base dark:text-blue-500">
                          {category.name}
                        </p>
                      </div>

                      {/* 关联博客 - 同一行显示 */}
                      <div className="flex items-center justify-between">
                        <p className="text-slate-600 text-[clamp(0.8rem,3vw,0.9rem)] sm:text-base dark:text-slate-400">
                          关联博客
                        </p>
                        <p className="text-green-500 text-[clamp(0.8rem,3vw,0.9rem)] sm:text-base dark:text-green-400">
                          {category.blogs.length} 篇
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
                  {searchKeyword ? '未找到匹配的分类' : '暂无分类数据'}
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
                    创建第一个分类
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 编辑/创建分类对话框 */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 rounded-xl border border-slate-200/50 w-full max-w-md p-5 sm:p-6 dark:bg-slate-800 dark:border-slate-700">
            <h3 className="text-base sm:text-lg font-semibold text-blue-600 mb-4 dark:text-blue-400">
              {currentCategory?.id ? '编辑分类' : '新建分类'}
            </h3>

            <div className="space-y-4">
              {/* 分类名称输入 */}
              <div>
                <label className="block text-sm text-slate-700 mb-1 dark:text-slate-300">分类名称</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
                  placeholder="请输入分类名称"
                />
              </div>

              {/* 图片上传区域 */}
              <div>
                <label className="block text-sm text-slate-700 mb-2 dark:text-slate-300">封面图片</label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 hover:border-blue-500 transition-colors relative dark:border-slate-700">
                  {fileList.length > 0 ? (
                    <div className="relative">
                      <Image
                        src={fileList[0].url}
                        alt="预览"
                        width={300}
                        height={200}
                        className="h-40 w-full object-cover rounded-md"
                      />
                      <button
                        onClick={handleRemove}
                        className="absolute top-2 right-2 bg-black/50 p-1 rounded-full text-white hover:bg-black/70 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handlePreview(fileList[0])}
                        className="absolute bottom-2 right-2 bg-blue-600/80 p-1 rounded-full text-white hover:bg-blue-500 transition-colors"
                      >
                        <UploadIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <label
                        htmlFor="category-upload"
                        className={`flex flex-col items-center justify-center cursor-pointer text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 ${
                          uploading ? 'opacity-70' : ''
                        }`}
                      >
                        <UploadIcon className="h-10 w-10 mb-2" />
                        <span className="text-sm">点击上传图片</span>
                      </label>
                      <input
                        ref={uploadRef}
                        id="category-upload"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={uploading}
                      />
                    </>
                  )}

                  {/* 上传加载指示器 */}
                  {uploading && (
                    <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center rounded-md">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                  图片将自动压缩为JPEG格式，最大尺寸1200x1200px，保持原始文件名
                </p>
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
                onClick={handleSaveCategory}
                disabled={loading || uploading}
                className="px-3 sm:px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                {(loading || uploading) && <Loader2 className="h-4 w-4 animate-spin" />}
                提交
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 图片预览对话框 */}
      {previewVisible && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-2xl w-full">
            <button
              onClick={() => setPreviewVisible(false)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            <Image
              src={previewImage}
              alt="预览"
              width={800}
              height={600}
              className="max-h-[80vh] w-full object-contain rounded-lg"
            />
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
            <p className="text-slate-600 mb-5 sm:mb-6 text-sm sm:text-base dark:text-slate-300">
              此操作将永久删除该分类，是否继续？
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
                  handleDeleteCategory(confirmDelete)
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