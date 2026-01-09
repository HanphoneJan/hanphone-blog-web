'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { format } from 'date-fns'
import { ENDPOINTS } from '@/lib/api'
import apiClient from '@/lib/utils'
import { showAlert } from '@/lib/Alert'
import Image from 'next/image'
import Link from 'next/link'
import Compressor from 'compressorjs' // 引入compressor.js
// 引入图标
import {
  Edit,
  Delete,
  Plus,
  Search,
  X,
  Loader2,
  ChevronDown,
  Image as ImageIcon,
  FolderOpen,
  Star, // 星星图标用于推荐功能
  StarOff, // 取消推荐图标
} from 'lucide-react'

// -------------------------- 类型定义 --------------------------
interface Type {
  id: number
  name: string
}

interface Tag {
  id: number
  name: string
}

interface Blog {
  id: number
  title: string
  type: Type
  tags: Tag[]
  views: number
  updateTime: string
  description: string
  firstPicture: string
  content: string
  inputVisible?: boolean
  inputValue?: string
  recommend: boolean // 推荐状态字段
  flag: string // 文章类型：原创/转载/翻译
}

interface QueryInfo {
  title: string
  typeId: number | null
}

// -------------------------- 页面组件 --------------------------
export default function BlogManagementPage() {
  const uploadRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  // 状态管理
  const [queryInfo, setQueryInfo] = useState<QueryInfo>({ title: '', typeId: null })
  const [pagenum, setPagenum] = useState(1)
  const [pagesize, setPagesize] = useState(8)
  const [blogList, setBlogList] = useState<Blog[]>([])
  const [totalcount, setTotalcount] = useState(0)
  const [typeList, setTypeList] = useState<Type[]>([])
  const [tagList, setTagList] = useState<Tag[]>([])
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedFlag, setSelectedFlag] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [updateRecommendLoading, setUpdateRecommendLoading] = useState<number | null>(null) // 推荐状态更新加载中
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  )

  // 图片上传相关状态
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  // 模态框状态
  const [editTypeDialogVisible, setEditTypeDialogVisible] = useState(false)
  const [editPicDialogVisible, setEditPicDialogVisible] = useState(false)
  const [editBlogDialogVisible, setEditBlogDialogVisible] = useState(false)
  const [editFlagDialogVisible, setEditFlagDialogVisible] = useState(false)
  const [dialogImageUrl, setDialogImageUrl] = useState('')

  // 当前操作的博客
  const [currentBlog, setCurrentBlog] = useState<Blog | null>(null)
  const [editBlogForm, setEditBlogForm] = useState<{
    title: string
    content: string
    description: string // 新增description字段
  }>({
    title: '',
    content: '',
    description: '' // 初始化
  })

  // -------------------------- API调用函数 --------------------------
  const fetchData = async (url: string, method: string = 'GET', data?: unknown) => {
    try {
      setLoading(true)
      const response = await apiClient({
        url,
        method,
        data: method !== 'GET' ? data : undefined,
        params: method === 'GET' ? data : undefined
      })
      setLoading(false)
      return response.data
    } catch (error) {
      console.log(`Error fetching ${url}:`, error)
      setLoading(false)
      showAlert('操作失败，请重试')
      return { code: 500, data: null }
    }
  }

  // -------------------------- 生命周期 --------------------------
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        await Promise.all([getBlogList(), getFullTypeList(), getFullTagList()])
      } catch (err) {
        console.error(err)
      }
    }
    fetchInitialData()

    const handleResize = () => setScreenWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [pagenum, pagesize, queryInfo])

  // -------------------------- 核心方法 --------------------------
  /** 获取博客列表 */
  const getBlogList = async () => {
    const data = await fetchData(ENDPOINTS.ADMIN.BLOG_LIST, 'POST', {
      title: queryInfo.title,
      typeId: queryInfo.typeId,
      pagenum,
      pagesize
    })

    if (data.code === 200) {
      const formattedBlogs = data.data.content.map((blog: Blog) => ({
        ...blog,
        inputVisible: false,
        inputValue: ''
      }))
      setBlogList(formattedBlogs)
      setTotalcount(data.data.totalElements)
    } else {
      showAlert('获取博客列表失败')
    }
    setLoading(false)
  }

  /** 获取所有分类 */
  const getFullTypeList = async () => {
    const data = await fetchData(ENDPOINTS.ADMIN.FULL_TYPE_LIST)
    if (data.code === 200) {
      setTypeList(data.data)
    } else {
      showAlert('获取分类列表失败')
    }
  }

  /** 获取所有标签 */
  const getFullTagList = async () => {
    const data = await fetchData(ENDPOINTS.ADMIN.FULL_TAG_LIST)
    if (data.code === 200) {
      setTagList(data.data)
    } else {
      showAlert('获取标签列表失败')
    }
  }

  /** 删除博客 */
  const removeBlogById = async (id: number) => {
    showAlert('删除', { type: 'warning', duration: 3000 })
    const data = await fetchData(`${ENDPOINTS.ADMIN.BLOGS}/${id}/delete`, 'GET')
    if (data.code === 200) {
      showAlert('删除博客成功')
      getBlogList()
    } else {
      showAlert('删除博客失败')
    }
  }

  /** 打开编辑博客弹窗（无跳转） */
  const openEditBlogDialog = (blog: Blog) => {
    setCurrentBlog(blog)
    setEditBlogForm({
      title: blog.title,
      content: blog.content,
      description: blog.description || '' // 设置description值
    })
    setEditBlogDialogVisible(true)
  }

  /** 保存博客编辑内容 */
  const saveBlogEdit = async () => {
    if (!currentBlog) return

    const updatedBlog = {
      ...currentBlog,
      title: editBlogForm.title,
      content: editBlogForm.content,
      description: editBlogForm.description
    }

    const data = await fetchData(ENDPOINTS.ADMIN.BLOGS, 'POST', { blog: updatedBlog })
    if (data.code === 200) {
      showAlert('修改博客成功')
      setEditBlogDialogVisible(false)
      getBlogList()
    } else {
      showAlert('修改博客失败')
    }
  }

  /** 打开修改分类弹窗 */
  const openChangeTypeDialog = (blog: Blog) => {
    setCurrentBlog(blog)
    setSelectedType(blog.type.name)
    setEditTypeDialogVisible(true)
  }

  /** 提交分类修改 */
  const submitTypeChange = async () => {
    if (!currentBlog) return

    const type = typeList.find(t => t.name === selectedType)
    if (!type) {
      showAlert('请选择有效的分类')
      return
    }

    const updatedBlog = {
      ...currentBlog,
      type
    }

    const data = await fetchData(ENDPOINTS.ADMIN.BLOGS, 'POST', { blog: updatedBlog })
    if (data.code === 200) {
      showAlert('修改分类成功')
      setEditTypeDialogVisible(false)
      getBlogList()
    } else {
      showAlert('修改分类失败')
    }
  }

  /** 打开修改flag弹窗 */
  const openChangeFlagDialog = (blog: Blog) => {
    setCurrentBlog(blog)
    setSelectedFlag(blog.flag || '原创')
    setEditFlagDialogVisible(true)
  }

  /** 提交flag修改 */
  const submitFlagChange = async () => {
    if (!currentBlog) return

    const updatedBlog = {
      ...currentBlog,
      flag: selectedFlag
    }

    const data = await fetchData(ENDPOINTS.ADMIN.BLOGS, 'POST', { blog: updatedBlog })
    if (data.code === 200) {
      showAlert('修改文章类型成功')
      setEditFlagDialogVisible(false)
      getBlogList()
    } else {
      showAlert('修改文章类型失败')
    }
  }

  /** 标签操作 */
  const showInput = (row: Blog) => {
    setBlogList(prev =>
      prev.map(item => (item.id === row.id ? { ...item, inputVisible: true } : item))
    )

    // 延迟聚焦输入框
    setTimeout(() => {
      editInputRef.current?.focus()
    }, 100)
  }

  const handleInputConfirm = async (row: Blog) => {
    const tagName = row.inputValue?.trim()
    if (!tagName) {
      setBlogList(prev =>
        prev.map(item =>
          item.id === row.id ? { ...item, inputVisible: false, inputValue: '' } : item
        )
      )
      return
    }

    try {
      let newTag: Tag | undefined
      const existingTag = tagList.find(item => item.name === tagName)

      if (existingTag) {
        newTag = existingTag
      } else {
        const res = await fetchData(ENDPOINTS.ADMIN.TAGS, 'POST', { tag: { name: tagName } })
        if (res.code === 200) {
          newTag = res.data
          setTagList(prev => [...prev, newTag as Tag])
        } else {
          throw new Error()
        }
      }

      if (!newTag) throw new Error('Tag not created')

      const updatedBlog = {
        ...row,
        tags: [...row.tags, newTag],
        inputVisible: false,
        inputValue: ''
      }

      const res = await fetchData(ENDPOINTS.ADMIN.BLOGS, 'POST', { blog: updatedBlog })
      if (res.code === 200) {
        showAlert('添加标签成功')
        setBlogList(prev => prev.map(item => (item.id === row.id ? updatedBlog : item)))
      } else {
        throw new Error()
      }
    } catch (error) {
      console.log('添加标签错误' + error)
      showAlert('添加标签失败')
    }
  }

  const handleTagClose = async (i: number, row: Blog) => {
    try {
      const updatedTags = [...row.tags]
      updatedTags.splice(i, 1)
      const validTags = updatedTags.filter(Boolean) as Tag[]

      const updatedBlog = { ...row, tags: validTags }

      const res1 = await fetchData(ENDPOINTS.ADMIN.BLOGS, 'POST', { blog: updatedBlog })
      if (res1.code !== 200) throw new Error()

      const deletedTag = row.tags[i]
      await fetchData(`${ENDPOINTS.ADMIN.DEAL_DELETED_TAG}/${deletedTag.id}`)

      showAlert('删除标签成功')
      setBlogList(prev => prev.map(item => (item.id === row.id ? updatedBlog : item)))
    } catch (error) {
      console.log('删除标签错误' + error)
      showAlert('删除标签失败')
    }
  }

  /** 推荐状态切换 */
  const toggleRecommend = async (blog: Blog) => {
    try {
      // 设置当前操作的博客ID为加载状态
      setUpdateRecommendLoading(blog.id)

      // 发送推荐状态更新请求
      const response = await fetchData(ENDPOINTS.ADMIN.BLOG_RECOMMEND, 'POST', {
        blogId: blog.id,
        recommend: !blog.recommend
      })

      if (response.code === 200) {
        // 本地更新推荐状态
        setBlogList(prev =>
          prev.map(item => (item.id === blog.id ? { ...item, recommend: !blog.recommend } : item))
        )
        showAlert(blog.recommend ? '取消推荐成功' : '推荐成功')
      } else {
        showAlert(blog.recommend ? '取消推荐失败' : '推荐失败')
      }
    } catch (error) {
      console.error('推荐状态更新失败:', error)
      showAlert('操作失败，请重试')
    } finally {
      // 清除加载状态
      setUpdateRecommendLoading(null)
    }
  }

  /** 搜索和筛选 */
  const handleTypeSelect = (typeName: string) => {
    const type = typeList.find(t => t.name === typeName)
    setSelectedType(typeName)
    setQueryInfo(prev => ({ ...prev, typeId: type?.id || null }))
  }

  const clearSearch = () => {
    setQueryInfo({ title: '', typeId: null })
    setSelectedType('')
    setPagenum(1)
  }

  /** 图片上传处理 */
  // 修改handleFileChange函数，添加图片压缩功能
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型和大小
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      showAlert('请上传JPG、PNG或WEBP格式的图片')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      showAlert('图片大小不能超过5MB')
      return
    }

    try {
      setIsUploading(true)
      setUploadProgress(0)

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
            // 将压缩后的blob转换为File对象，并保持原始文件名（修改扩展名为jpeg）
            const compressedFile = new File([compressedResult], newFileName, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })

            const formData = new FormData()
            formData.append('namespace', 'blog/blogs')
            formData.append('file', compressedFile) // 使用压缩后的文件

            const response = await apiClient({
              url: ENDPOINTS.FILE.UPLOAD,
              method: 'POST',
              data: formData,
              onUploadProgress: progressEvent => {
                if (progressEvent.total) {
                  const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100)
                  setUploadProgress(percent)
                }
              }
            })

            const data = response.data
            if (data.code === 200) {
              setDialogImageUrl(data.url)
              showAlert('图片压缩并上传成功')
            } else {
              showAlert('图片上传失败: ' + (data.msg || '未知错误'))
            }
          } catch (error) {
            console.error('图片上传错误', error)
            showAlert('图片上传失败，请重试')
          } finally {
            setIsUploading(false)
            setUploadProgress(0)
            // 清空input值，允许重复选择同一张图片
            if (uploadRef.current) uploadRef.current.value = ''
          }
        },
        error: err => {
          console.error('图片压缩失败:', err)
          showAlert('图片压缩失败，请重试')
          setIsUploading(false)
          setUploadProgress(0)
          if (uploadRef.current) uploadRef.current.value = ''
        }
      })
    } catch (error) {
      console.error('图片处理错误', error)
      showAlert('图片处理失败，请重试')
      setIsUploading(false)
      setUploadProgress(0)
      if (uploadRef.current) uploadRef.current.value = ''
    }
  }

  const handleRemoveImage = () => {
    setDialogImageUrl('')
    if (uploadRef.current) uploadRef.current.value = ''
  }

  /** 打开修改首图弹窗 */
  const openEditPicDialog = (blog: Blog) => {
    setCurrentBlog(blog)
    setDialogImageUrl(blog.firstPicture)
    setEditPicDialogVisible(true)
  }

  /** 提交首图修改 */
  const submitPicChange = async () => {
    if (!currentBlog || !dialogImageUrl) {
      showAlert('请先上传图片')
      return
    }

    const updatedBlog = {
      ...currentBlog,
      firstPicture: dialogImageUrl
    }

    const data = await fetchData(ENDPOINTS.ADMIN.BLOGS, 'POST', { blog: updatedBlog })
    if (data.code === 200) {
      showAlert('修改首图成功')
      setEditPicDialogVisible(false)
      setDialogImageUrl('')
      getBlogList()
    } else {
      showAlert('修改首图失败')
    }
  }

  // 处理Enter键按下事件
  const handleEnterKeyPress = (e: React.KeyboardEvent, row: Blog) => {
    if (e.key === 'Enter') {
      handleInputConfirm(row)
    }
  }

  // 生成分页页码（响应式优化）
  const generatePageNumbers = () => {
    const totalPages = Math.ceil(totalcount / pagesize)
    const pages = []
    const maxVisible = screenWidth < 640 ? 3 : 5 // 小屏幕只显示3个页码

    // 总是显示第一页
    if (pagenum > maxVisible) {
      pages.push(1)
      if (pagenum > maxVisible + 1) pages.push('...')
    }

    // 显示当前页附近的页码
    const startPage = Math.max(1, pagenum - Math.floor(maxVisible / 2))
    const endPage = Math.min(totalPages, startPage + maxVisible - 1)

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    // 总是显示最后一页
    if (pagenum < totalPages - maxVisible + 1) {
      if (pagenum < totalPages - maxVisible) pages.push('...')
      pages.push(totalPages)
    }

    return pages
  }

  // -------------------------- 页面渲染 --------------------------
  return (
    <div className="font-sans min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 text-slate-800 dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-200">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(50,100,200,0.1)_0%,transparent_40%),radial-gradient(circle_at_80%_80%,rgba(80,120,250,0.1)_0%,transparent_40%)] dark:opacity-100 opacity-0"></div>

      <main className="max-w-7xl mx-auto lg:px-2 lg:py-2 relative z-10">
        {/* 搜索筛选区域 - 优化布局：大屏幕同一行，小屏幕分类与按钮一行 */}
        <div className="bg-white/80 backdrop-blur-sm border-slate-200/50 lg:rounded-t-xl px-4 py-3 border shadow-sm dark:bg-slate-800/40 dark:border-slate-700/50">
          {/* 大屏幕：搜索框、分类、按钮在同一行 */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="搜索标题..."
                  value={queryInfo.title}
                  onChange={e => setQueryInfo(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/60 border-slate-300 focus:ring-blue-400 focus:outline-none focus:ring-2 transition-all dark:bg-slate-900/60 dark:border-slate-700 dark:focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="w-48 relative">
              <select
                value={selectedType}
                onChange={e => handleTypeSelect(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-white/60 border-slate-300 focus:ring-blue-400 focus:outline-none focus:ring-2 transition-all appearance-none dark:bg-slate-900/60 dark:border-slate-700 dark:focus:ring-blue-500"
              >
                <option value="">所有分类</option>
                {typeList.map(item => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
            </div>

            <div className="flex gap-2">
              <button
                onClick={clearSearch}
                className="px-4 py-2.5 rounded-lg bg-slate-200/60 hover:bg-slate-200 text-slate-700 transition-all flex items-center justify-center gap-2 dark:bg-slate-700/60 dark:hover:bg-slate-700 dark:text-slate-200"
              >
                <X className="h-4 w-4" />
                清除
              </button>
              <button
                onClick={getBlogList}
                disabled={loading}
                className="px-4 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-all flex items-center justify-center gap-2 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    搜索中...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    搜索
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 小屏幕：搜索框一行，分类与按钮一行 */}
          <div className="lg:hidden flex flex-col gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="搜索标题..."
                  value={queryInfo.title}
                  onChange={e => setQueryInfo(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/60 border-slate-300 focus:ring-blue-400 focus:outline-none focus:ring-2 transition-all dark:bg-slate-900/60 dark:border-slate-700 dark:focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 小屏幕：所有分类、清除与搜索按钮为一行 */}
            <div className="flex gap-2">
              <div className="flex-1 relative min-w-[120px]">
                <select
                  value={selectedType}
                  onChange={e => handleTypeSelect(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/60 border-slate-300 focus:ring-blue-400 focus:outline-none focus:ring-2 transition-all appearance-none text-sm dark:bg-slate-900/60 dark:border-slate-700 dark:focus:ring-blue-500"
                >
                  <option value="">所有分类</option>
                  {typeList.map(item => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
              </div>

              <button
                onClick={clearSearch}
                className="px-3 py-2.5 rounded-lg bg-slate-200/60 hover:bg-slate-200 text-slate-700 transition-all flex items-center justify-center gap-1 min-w-[80px] dark:bg-slate-700/60 dark:hover:bg-slate-700 dark:text-slate-200"
              >
                <X className="h-4 w-4" />
                <span className="text-sm">清除</span>
              </button>

              <button
                onClick={getBlogList}
                disabled={loading}
                className="px-3 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-all flex items-center justify-center gap-1 min-w-[80px] dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    <span className="text-sm">搜索</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 博客表格 */}
        <div className="bg-white/80 backdrop-blur-sm border-slate-200/50 rounded-b-xl overflow-hidden shadow-sm dark:bg-slate-800/40 dark:border-slate-700/50">
          {/* 表格头部 - 响应式调整：lg以下显示移动端布局 */}
          <div className="hidden lg:grid grid-cols-12 gap-2 px-4 py-3 sm:px-6 sm:py-4 bg-slate-100/40 border-slate-200/50 border-b text-xs sm:text-sm font-medium dark:bg-slate-900/40 dark:border-slate-700/50">
            <div className="col-span-1">首图</div>
            <div className="col-span-2">标题</div>
            <div className="col-span-1 text-center">推荐</div>
            <div className="col-span-1">分类</div>
            <div className="col-span-1">类型</div>
            <div className="col-span-2">标签</div>
            <div className="col-span-1 text-center">阅读量</div>
            <div className="col-span-2">更新时间</div>
            <div className="col-span-1 text-center">操作</div>
          </div>

          {/* 表格内容 */}
          {blogList.length > 0 ? (
            blogList.map(blog => (
              <div
                key={blog.id}
                className="border-b border-slate-200/30 hover:bg-slate-100/60 last:border-0 transition-all duration-300 dark:border-slate-700/30 dark:hover:bg-slate-800/60"
              >
                {/* 桌面端主行 - 只在lg以上显示 */}
                <div className="hidden lg:grid grid-cols-12 gap-2 px-4 py-3 sm:px-6 sm:py-4 items-center">
                  {/* 首图 */}
                  <div className="col-span-1">
                    <div className="relative w-14 h-9 sm:w-16 sm:h-10 rounded-md overflow-hidden border border-slate-300/50 dark:border-slate-700/50">
                      {blog.firstPicture ? (
                        <Image
                          src={blog.firstPicture}
                          alt={blog.title}
                          width={192}
                          height={144}
                          className="object-cover transition-transform hover:scale-110 duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-200/60 flex items-center justify-center dark:bg-slate-900/60">
                          <ImageIcon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 标题 */}
                  <div className="col-span-2 truncate">
                    <Link
                      href={`/blogInfo?id=${blog.id}`}
                      className="transition-colors font-medium text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {blog.title}
                    </Link>
                    <p className="text-xs mt-1 line-clamp-1 text-slate-500 dark:text-slate-400">
                      {blog.description || '暂无描述'}
                    </p>
                  </div>

                  {/* 推荐状态 */}
                  <div className="col-span-1 flex items-center justify-center">
                    <button
                      onClick={() => toggleRecommend(blog)}
                      disabled={updateRecommendLoading === blog.id}
                      className={`p-1.5 rounded-full transition-all ${
                        blog.recommend
                          ? 'bg-yellow-500/30 text-yellow-600 hover:bg-yellow-500/40 dark:bg-yellow-500/20 dark:text-yellow-400 dark:hover:bg-yellow-500/30'
                          : 'bg-slate-300/40 text-slate-500 hover:bg-slate-300/60 dark:bg-slate-700/40 dark:text-slate-400 dark:hover:bg-slate-700/60'
                      } ${updateRecommendLoading === blog.id ? 'opacity-70' : ''}`}
                      title={blog.recommend ? '取消推荐' : '推荐'}
                      aria-label={blog.recommend ? '取消推荐' : '推荐'}
                    >
                      {updateRecommendLoading === blog.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : blog.recommend ? (
                        <Star className="h-4 w-4 fill-yellow-400" />
                      ) : (
                        <StarOff className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* 分类 */}
                  <div className="col-span-1 flex items-center">
                    <span
                      className="transition-colors flex items-center gap-1 px-2 py-1 rounded-md text-xs whitespace-nowrap cursor-pointer hover:text-blue-600 bg-slate-200/40 dark:hover:text-blue-400 dark:bg-slate-700/40"
                      onClick={() => openChangeTypeDialog(blog)}
                    >
                      {blog.type.name}
                      <Edit className="h-3 w-3" />
                    </span>
                  </div>

                  {/* 文章类型flag */}
                  <div className="col-span-1 flex items-center">
                    <span
                      className="transition-colors flex items-center gap-1 px-2 py-1 rounded-md text-xs whitespace-nowrap cursor-pointer hover:text-blue-600 bg-amber-100/40 dark:hover:text-blue-400 dark:bg-amber-900/40 dark:text-amber-300"
                      onClick={() => openChangeFlagDialog(blog)}
                    >
                      {blog.flag || '原创'}
                    </span>
                  </div>

                  {/* 标签 */}
                  <div className="col-span-2 flex flex-wrap gap-1 max-h-10 overflow-hidden">
                    {blog.tags.map((tag, i) => (
                      <span
                        key={tag.id}
                        className="px-2 py-0.5 rounded text-xs flex items-center gap-1 bg-purple-100/60 text-purple-700 dark:bg-purple-600/20 dark:text-purple-300"
                      >
                        {tag.name}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-purple-900 dark:hover:text-white"
                          onClick={() => handleTagClose(i, blog)}
                        />
                      </span>
                    ))}
                    {!blog.inputVisible && (
                      <button
                        onClick={() => showInput(blog)}
                        className="px-2 py-0.5 border border-dashed rounded text-xs flex items-center border-slate-400 text-slate-500 hover:text-slate-700 hover:border-slate-500 dark:border-slate-600 dark:text-slate-400 dark:hover:text-white dark:hover:border-slate-400"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        添加
                      </button>
                    )}
                    {blog.inputVisible && (
                      <div className="relative">
                        <input
                          ref={editInputRef}
                          type="text"
                          value={blog.inputValue || ''}
                          onChange={e => {
                            setBlogList(prev =>
                              prev.map(item =>
                                item.id === blog.id ? { ...item, inputValue: e.target.value } : item
                              )
                            )
                          }}
                          onBlur={() => handleInputConfirm(blog)}
                          onKeyPress={e => handleEnterKeyPress(e, blog)}
                          className="w-24 px-2 py-0.5 text-xs border rounded border-slate-300 bg-white/60 focus:ring-blue-400 focus:outline-none focus:ring-1 dark:border-slate-600 dark:bg-slate-900/60 dark:focus:ring-blue-500"
                          placeholder="输入标签..."
                        />
                      </div>
                    )}
                  </div>

                  {/* 阅读量 */}
                  <div className="col-span-1 text-center text-sm text-slate-600 dark:text-slate-300">{blog.views}</div>

                  {/* 更新时间 */}
                  <div className="col-span-2 text-sm text-slate-500 dark:text-slate-400">
                    {format(new Date(blog.updateTime), 'yyyy-MM-dd HH:mm')}
                  </div>

                  {/* 操作 */}
                  <div className="col-span-1 flex justify-end gap-2">
                    <button
                      onClick={() => openEditBlogDialog(blog)}
                      className="p-2 rounded-lg transition-colors flex items-center justify-center bg-blue-100/40 hover:bg-blue-100/60 text-blue-600 dark:bg-blue-600/20 dark:hover:bg-blue-600/40 dark:text-blue-400"
                      title="编辑"
                      aria-label="编辑"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openEditPicDialog(blog)}
                      className="p-2 rounded-lg transition-colors flex items-center justify-center bg-green-100/40 hover:bg-green-100/60 text-green-600 dark:bg-green-600/20 dark:hover:bg-green-600/40 dark:text-green-400"
                      title="修改首图"
                      aria-label="修改首图"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeBlogById(blog.id)}
                      className="p-2 rounded-lg transition-colors flex items-center justify-center bg-red-100/40 hover:bg-red-100/60 text-red-600 dark:bg-red-600/20 dark:hover:bg-red-600/40 dark:text-red-400"
                      title="删除"
                      aria-label="删除"
                    >
                      <Delete className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* 移动端布局 - 在lg以下显示 */}
                <div className="lg:hidden p-4">
                  {/* 首行：标题和操作按钮 */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/blogInfo?id=${blog.id}`}
                        className="transition-colors font-medium text-base block truncate text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {blog.title}
                      </Link>
                      <p className="text-sm mt-1 line-clamp-2 text-slate-500 dark:text-slate-400">
                        {blog.description || '暂无描述'}
                      </p>
                    </div>
                    <div className="flex gap-1 ml-2 flex-shrink-0">
                      <button
                        onClick={() => openEditBlogDialog(blog)}
                        className="p-1.5 rounded-lg transition-colors bg-blue-100/40 hover:bg-blue-100/60 text-blue-600 dark:bg-blue-600/20 dark:hover:bg-blue-600/40 dark:text-blue-400"
                        title="编辑"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditPicDialog(blog)}
                        className="p-1.5 rounded-lg transition-colors bg-green-100/40 hover:bg-green-100/60 text-green-600 dark:bg-green-600/20 dark:hover:bg-green-600/40 dark:text-green-400"
                        title="修改首图"
                      >
                        <ImageIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeBlogById(blog.id)}
                        className="p-1.5 rounded-lg transition-colors bg-red-100/40 hover:bg-red-100/60 text-red-600 dark:bg-red-600/20 dark:hover:bg-red-600/40 dark:text-red-400"
                        title="删除"
                      >
                        <Delete className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* 第二行：首图、分类、推荐状态 */}
                  <div className="flex items-center gap-3 mb-3">
                    {/* 首图 */}
                    <div className="relative w-16 h-12 rounded-md overflow-hidden border flex-shrink-0 border-slate-300/50 dark:border-slate-700/50">
                      {blog.firstPicture ? (
                        <Image
                          src={blog.firstPicture}
                          alt={blog.title}
                          width={64}
                          height={48}
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-200/60 flex items-center justify-center dark:bg-slate-900/60">
                          <ImageIcon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-wrap gap-2 items-center">
                      {/* 分类 */}
                      <span
                        className="transition-colors flex items-center gap-1 px-2 py-1 rounded-md text-xs whitespace-nowrap cursor-pointer hover:text-blue-600 bg-slate-200/40 dark:hover:text-blue-400 dark:bg-slate-700/40"
                        onClick={() => openChangeTypeDialog(blog)}
                      >
                        {blog.type.name}
                        <Edit className="h-3 w-3" />
                      </span>

                      {/* 文章类型flag */}
                      <span
                        className="transition-colors flex items-center gap-1 px-2 py-1 rounded-md text-xs whitespace-nowrap cursor-pointer hover:text-blue-600 bg-amber-100/40 dark:hover:text-blue-400 dark:bg-amber-900/40 dark:text-amber-300"
                        onClick={() => openChangeFlagDialog(blog)}
                      >
                        {blog.flag || '原创'}
                      </span>

                      {/* 推荐状态 */}
                      <button
                        onClick={() => toggleRecommend(blog)}
                        disabled={updateRecommendLoading === blog.id}
                        className={`px-2 py-1 rounded-full transition-all flex items-center gap-1 text-xs ${
                          blog.recommend
                            ? 'bg-yellow-500/30 text-yellow-600 hover:bg-yellow-500/40 dark:bg-yellow-500/20 dark:text-yellow-400 dark:hover:bg-yellow-500/30'
                            : 'bg-slate-300/40 text-slate-500 hover:bg-slate-300/60 dark:bg-slate-700/40 dark:text-slate-400 dark:hover:bg-slate-700/60'
                        } ${updateRecommendLoading === blog.id ? 'opacity-70' : ''}`}
                      >
                        {updateRecommendLoading === blog.id ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : blog.recommend ? (
                          <>
                            <Star className="h-3 w-3 fill-yellow-400 mr-1" />
                            已推荐
                          </>
                        ) : (
                          <>
                            <StarOff className="h-3 w-3 mr-1" />
                            未推荐
                          </>
                        )}
                      </button>

                      {/* 阅读量 */}
                      <span className="text-xs px-2 py-1 rounded-md text-slate-600 bg-slate-200/40 dark:text-slate-300 dark:bg-slate-700/40">
                        阅读: {blog.views}
                      </span>
                    </div>
                  </div>

                  {/* 第三行：标签 */}
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {blog.tags.map((tag, i) => (
                        <span
                          key={tag.id}
                          className="px-2 py-0.5 rounded text-xs flex items-center gap-1 bg-purple-100/60 text-purple-700 dark:bg-purple-600/20 dark:text-purple-300"
                        >
                          {tag.name}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-purple-900 dark:hover:text-white"
                            onClick={() => handleTagClose(i, blog)}
                          />
                        </span>
                      ))}
                      {!blog.inputVisible && (
                        <button
                          onClick={() => showInput(blog)}
                          className="px-2 py-0.5 border border-dashed rounded text-xs flex items-center border-slate-400 text-slate-500 hover:text-slate-700 hover:border-slate-500 dark:border-slate-600 dark:text-slate-400 dark:hover:text-white dark:hover:border-slate-400"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          添加
                        </button>
                      )}
                      {blog.inputVisible && (
                        <div className="relative">
                          <input
                            ref={editInputRef}
                            type="text"
                            value={blog.inputValue || ''}
                            onChange={e => {
                              setBlogList(prev =>
                                prev.map(item =>
                                  item.id === blog.id
                                    ? { ...item, inputValue: e.target.value }
                                    : item
                                )
                              )
                            }}
                            onBlur={() => handleInputConfirm(blog)}
                            onKeyPress={e => handleEnterKeyPress(e, blog)}
                            className="w-24 px-2 py-0.5 text-xs border rounded border-slate-300 bg-white/60 focus:ring-blue-400 focus:outline-none focus:ring-1 dark:border-slate-600 dark:bg-slate-900/60 dark:focus:ring-blue-500"
                            placeholder="输入标签..."
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 第四行：更新时间 */}
                  <div className="text-xs pt-2 border-t text-slate-500 border-slate-200/30 dark:text-slate-400 dark:border-slate-700/30">
                    更新: {format(new Date(blog.updateTime), 'yyyy-MM-dd HH:mm')}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center min-h-[90vh] py-12 text-slate-500 dark:text-slate-400">
              <FolderOpen className="h-12 w-12 mx-auto mt-20 mb-4 opacity-50" />
            </div>
          )}
        </div>

        {/* 分页 */}
        {totalcount > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-4">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              共 <span className="font-medium text-blue-600 dark:text-blue-400">{totalcount}</span> 条记录
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagenum(prev => Math.max(1, prev - 1))}
                disabled={pagenum === 1}
                className="px-3 py-2 rounded-lg transition-all text-sm bg-slate-200/60 hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-700/60 dark:hover:bg-slate-700"
              >
                上一页
              </button>

              <div className="flex items-center gap-1">
                {generatePageNumbers().map((page, index) =>
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-2 py-1 text-slate-500 dark:text-slate-400">
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setPagenum(page as number)}
                      className={`px-3 py-1 rounded-lg transition-all text-sm ${
                        pagenum === page
                          ? 'bg-blue-500 text-white dark:bg-blue-600'
                          : 'bg-slate-200/60 hover:bg-slate-200 text-slate-700 dark:bg-slate-700/60 dark:hover:bg-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() =>
                  setPagenum(prev => Math.min(Math.ceil(totalcount / pagesize), prev + 1))
                }
                disabled={pagenum >= Math.ceil(totalcount / pagesize)}
                className="px-3 py-2 rounded-lg transition-all text-sm bg-slate-200/60 hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-700/60 dark:hover:bg-slate-700"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 模态框 */}
      {editTypeDialogVisible &&
        createPortal(
          <div className="fixed inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/90 border-slate-200/50 backdrop-blur-lg rounded-xl border w-full max-w-md p-6 shadow-2xl dark:bg-slate-800/90 dark:border-slate-700/50">
              <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">修改分类</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-600 dark:text-slate-300">选择分类</label>
                  <select
                    value={selectedType}
                    onChange={e => setSelectedType(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-blue-400 text-sm focus:outline-none focus:ring-2 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-blue-500"
                  >
                    {typeList.map(item => (
                      <option key={item.id} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setEditTypeDialogVisible(false)}
                    className="flex-1 px-4 py-3 rounded-lg transition-all bg-slate-200/60 hover:bg-slate-200 text-slate-700 dark:bg-slate-700/60 dark:hover:bg-slate-700 dark:text-slate-200"
                  >
                    取消
                  </button>
                  <button
                    onClick={submitTypeChange}
                    className="flex-1 px-4 py-3 rounded-lg text-white transition-all bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500"
                  >
                    确认修改
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {editFlagDialogVisible &&
        createPortal(
          <div className="fixed inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/90 border-slate-200/50 backdrop-blur-lg rounded-xl border w-full max-w-md p-6 shadow-2xl dark:bg-slate-800/90 dark:border-slate-700/50">
              <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">修改文章类型</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-600 dark:text-slate-300">选择文章类型</label>
                  <select
                    value={selectedFlag}
                    onChange={e => setSelectedFlag(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-blue-400 text-sm focus:outline-none focus:ring-2 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-blue-500"
                  >
                    <option value="原创">原创</option>
                    <option value="转载">转载</option>
                    <option value="翻译">翻译</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setEditFlagDialogVisible(false)}
                    className="flex-1 px-4 py-3 rounded-lg transition-all bg-slate-200/60 hover:bg-slate-200 text-slate-700 dark:bg-slate-700/60 dark:hover:bg-slate-700 dark:text-slate-200"
                  >
                    取消
                  </button>
                  <button
                    onClick={submitFlagChange}
                    className="flex-1 px-4 py-3 rounded-lg text-white transition-all bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500"
                  >
                    确认修改
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {editPicDialogVisible &&
        createPortal(
          <div className="fixed inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/90 border-slate-200/50 backdrop-blur-lg rounded-xl border w-full max-w-md p-6 shadow-2xl dark:bg-slate-800/90 dark:border-slate-700/50">
              <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">修改首图</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-600 dark:text-slate-300">上传图片</label>
                  <input
                    ref={uploadRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    onClick={() => uploadRef.current?.click()}
                    disabled={isUploading}
                    className="w-full px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 bg-slate-200/60 hover:bg-slate-200 text-slate-700 dark:bg-slate-700/60 dark:hover:bg-slate-700 dark:text-slate-200"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        上传中... {uploadProgress}%
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-4 w-4" />
                        选择图片
                      </>
                    )}
                  </button>
                </div>

                {dialogImageUrl && (
                  <div className="relative rounded-lg overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
                    <Image
                      src={dialogImageUrl}
                      alt="首图预览"
                      width={400}
                      height={300}
                      className="w-full h-auto object-cover"
                    />
                    <button
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-full transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setEditPicDialogVisible(false)
                      setDialogImageUrl('')
                    }}
                    className="flex-1 px-4 py-3 rounded-lg transition-all bg-slate-200/60 hover:bg-slate-200 text-slate-700 dark:bg-slate-700/60 dark:hover:bg-slate-700 dark:text-slate-200"
                  >
                    取消
                  </button>
                  <button
                    onClick={submitPicChange}
                    disabled={!dialogImageUrl}
                    className="flex-1 px-4 py-3 rounded-lg text-white transition-all disabled:opacity-50 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500"
                  >
                    确认修改
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {editBlogDialogVisible &&
        createPortal(
          <div className="fixed inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/90 border-slate-200/50 backdrop-blur-lg rounded-xl border w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl dark:bg-slate-800/90 dark:border-slate-700/50">
              <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
                <h3 className="text-xl font-semibold text-slate-800 dark:text-white">编辑博客</h3>
              </div>
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-600 dark:text-slate-300">标题</label>
                    <input
                      type="text"
                      value={editBlogForm.title}
                      onChange={e => setEditBlogForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg bg-white/60 border-slate-300 text-slate-800 focus:ring-blue-400 focus:outline-none focus:ring-2 transition-all dark:bg-slate-900/60 dark:border-slate-700 dark:text-slate-200 dark:focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-600 dark:text-slate-300">描述</label>
                    <textarea
                      value={editBlogForm.description}
                      onChange={e =>
                        setEditBlogForm(prev => ({ ...prev, description: e.target.value }))
                      }
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg bg-white/60 border-slate-300 text-slate-800 focus:ring-blue-400 focus:outline-none focus:ring-2 transition-all dark:bg-slate-900/60 dark:border-slate-700 dark:text-slate-200 dark:focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-600 dark:text-slate-300">内容</label>
                    <textarea
                      value={editBlogForm.content}
                      onChange={e =>
                        setEditBlogForm(prev => ({ ...prev, content: e.target.value }))
                      }
                      rows={12}
                      className="w-full px-4 py-3 rounded-lg bg-white/60 border-slate-300 text-slate-800 focus:ring-blue-400 focus:outline-none focus:ring-2 transition-all dark:bg-slate-900/60 dark:border-slate-700 dark:text-slate-200 dark:focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-200/50 dark:border-slate-700/50">
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditBlogDialogVisible(false)}
                    className="flex-1 px-4 py-3 rounded-lg transition-all bg-slate-200/60 hover:bg-slate-200 text-slate-700 dark:bg-slate-700/60 dark:hover:bg-slate-700 dark:text-slate-200"
                  >
                    取消
                  </button>
                  <button
                    onClick={saveBlogEdit}
                    className="flex-1 px-4 py-3 rounded-lg text-white transition-all bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500"
                  >
                    保存修改
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
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