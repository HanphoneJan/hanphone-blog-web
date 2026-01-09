'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { createPortal } from 'react-dom'
import { ENDPOINTS } from '@/lib/api'
import apiClient from '@/lib/utils'
import { showAlert } from '@/lib/Alert'
import { useUser } from '@/contexts/UserContext'
import {
  Edit3,
  Trash2,
  Save,
  Plus,
  X,
  Loader2,
  AlertCircle,
  FileText,
  FileVideo,
  FileImage,
  FileCode,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Star,
  StarOff
} from 'lucide-react'

// 定义文件类型
type FileType = 'IMAGE' | 'VIDEO' | 'TEXT' | 'OTHER'

// 定义文件信息接口
interface EssayFile {
  id: number
  url: string
  urlType: FileType
  urlDesc: string | null
  isValid: boolean
  createTime: string
  name?: string
}

// 定义随笔数据类型
interface Essay {
  id: number | null
  user_id: number | null
  title: string
  content: string
  createTime: string
  vis?: boolean
  essayFileUrls?: EssayFile[]
  color?: string | null
  image?: string | null
  praise?: number | null
  recommend?: boolean // 新增推荐状态
}

// 格式化日期的工具函数
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date)
}

// 判断文件类型
const getFileType = (file: File): FileType => {
  if (file.type.startsWith('image/')) {
    return 'IMAGE'
  } else if (file.type.startsWith('video/')) {
    return 'VIDEO'
  } else if (
    file.type.includes('pdf') ||
    file.type.includes('word') ||
    file.type.includes('powerpoint') ||
    file.name.endsWith('.md') ||
    file.name.endsWith('.txt')
  ) {
    return 'TEXT'
  }
  return 'OTHER'
}

// 根据urlType获取文件类型图标
const getFileIconByType = (urlType: FileType, fileName: string) => {
  if (urlType === 'IMAGE') {
    return <FileImage className="h-5 w-5" />
  } else if (urlType === 'VIDEO') {
    return <FileVideo className="h-5 w-5" />
  } else {
    if (fileName.endsWith('.pdf')) {
      return <FileText className="h-5 w-5" />
    } else if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
      return <FileText className="h-5 w-5" />
    } else if (fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) {
      return <FileText className="h-5 w-5" />
    } else if (fileName.endsWith('.md') || fileName.endsWith('.txt')) {
      return <FileCode className="h-5 w-5" />
    }
    return <FileText className="h-5 w-5" />
  }
}

// 本地文件信息接口
interface FileInfo {
  file: File
  previewUrl: string
  type: FileType
}

// 内容最大字数限制
const MAX_CONTENT_LENGTH = 3000
// 文件最大数量限制
const MAX_FILE_COUNT = 9

export default function EssayManagementPage() {
  const { userInfo } = useUser()
  const [activeKey, setActiveKey] = useState('first')
  const [essayList, setEssayList] = useState<Essay[]>([])
  const [filteredEssayList, setFilteredEssayList] = useState<Essay[]>([]) // 用于搜索和排序的列表
  const [essay, setEssay] = useState<Essay>({
    id: null,
    user_id: null,
    title: '',
    content: '',
    createTime: '',
    essayFileUrls: [],
    recommend: false // 新增默认推荐状态
  })
  const [localFiles, setLocalFiles] = useState<FileInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [currentDeleteId, setCurrentDeleteId] = useState<number | null>(null)
  const [deleteFileModalVisible, setDeleteFileModalVisible] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<{
    index: number
    isLocal: boolean
    fileName: string
  } | null>(null)
  // 新增推荐状态加载标识
  const [updateRecommendLoading, setUpdateRecommendLoading] = useState<number | null>(null)

  // 新增搜索和排序状态
  const [searchKeyword, setSearchKeyword] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null) // 排序顺序，null表示未排序

  // API调用函数
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

  // 初始化获取随笔列表
  useEffect(() => {
    getEssayList()
  }, [])

  // 当原始列表、搜索关键词或排序顺序变化时，更新过滤和排序后的列表
  useEffect(() => {
    let result = [...essayList]

    // 应用搜索过滤
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase()
      result = result.filter(essay => essay.title.toLowerCase().includes(keyword))
    }

    // 应用排序
    if (sortOrder) {
      result.sort((a, b) => {
        const dateA = new Date(a.createTime).getTime()
        const dateB = new Date(b.createTime).getTime()
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
      })
    }

    setFilteredEssayList(result)
  }, [essayList, searchKeyword, sortOrder])

  // 切换标签页时的处理
  const handleTabChange = (key: string) => {
    setActiveKey(key)
    if (key === 'second') {
      getEssayList()
    }
  }

  // 获取随笔列表
  const getEssayList = async () => {
    try {
      const data = await fetchData(ENDPOINTS.ADMIN.ESSAYS)
      if (data.code === 200) {
        // 原始数据不排序，排序将在过滤时处理
        const list = data.data.map((item: Essay) => ({
          ...item,
          vis: false,
          recommend: item.recommend || false, // 确保推荐状态有默认值
          essayFileUrls: (item.essayFileUrls || []).map(file => ({
            ...file,
            name: file.name || file.url.split('/').pop() || `文件${file.id}`
          }))
        }))
        setEssayList(list)
      }
    } catch (error) {
      console.error('获取随笔列表失败:', error)
    }
  }

  // 切换排序顺序
  const toggleSortOrder = () => {
    if (sortOrder === null) {
      setSortOrder('desc') // 首次点击默认降序
    } else if (sortOrder === 'desc') {
      setSortOrder('asc') // 从降序切换到升序
    } else {
      setSortOrder(null) // 从升序切换到不排序
    }
  }

  // 新增推荐状态切换函数
  const toggleRecommend = async (essay: Essay) => {
    if (!essay.id) return

    try {
      // 设置当前操作的随笔ID为加载状态
      setUpdateRecommendLoading(essay.id)

      // 发送推荐状态更新请求
      const response = await fetchData(ENDPOINTS.ADMIN.ESSAY_RECOMMEND, 'POST', {
        essayId: essay.id,
        recommend: !essay.recommend
      })

      if (response.code === 200) {
        // 本地更新推荐状态
        setEssayList(prev =>
          prev.map(item => (item.id === essay.id ? { ...item, recommend: !essay.recommend } : item))
        )
        showAlert(essay.recommend ? '取消推荐成功' : '推荐成功')
      } else {
        showAlert(essay.recommend ? '取消推荐失败' : '推荐失败')
      }
    } catch (error) {
      console.error('推荐状态更新失败:', error)
      showAlert('操作失败，请重试')
    } finally {
      // 清除加载状态
      setUpdateRecommendLoading(null)
    }
  }

  // 文件选择处理
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // 计算已有的文件总数
    const existingCount = localFiles.length + (essay.essayFileUrls?.length || 0)

    // 检查是否超过最大数量
    const remaining = MAX_FILE_COUNT - existingCount
    if (files.length > remaining) {
      showAlert(`最多只能上传${MAX_FILE_COUNT}个文件，还可以上传${remaining}个`)
      return
    }

    // 处理选择的文件，生成预览
    Array.from(files).forEach(file => {
      const type = getFileType(file)
      const reader = new FileReader()

      reader.onload = event => {
        setLocalFiles(prev => [
          ...prev,
          {
            file,
            previewUrl: event.target?.result as string,
            type
          }
        ])
      }

      // 根据文件类型选择合适的读取方式
      if (type === 'IMAGE' || type === 'VIDEO') {
        reader.readAsDataURL(file)
      } else {
        // 文本文件不需要预览，使用空字符串或文件图标
        reader.readAsDataURL(new Blob(['']))
      }
    })

    // 清空input值，允许重复选择同一文件
    e.target.value = ''
  }

  // 打开文件删除确认框
  const openFileDeleteModal = (index: number, isLocal: boolean, fileName: string) => {
    setFileToDelete({ index, isLocal, fileName })
    setDeleteFileModalVisible(true)
  }

  // 关闭文件删除确认框
  const closeFileDeleteModal = () => {
    setDeleteFileModalVisible(false)
    setFileToDelete(null)
  }

  // 确认删除文件
  const confirmFileDelete = () => {
    if (!fileToDelete) return

    const { index, isLocal } = fileToDelete

    if (isLocal) {
      removeLocalFile(index)
    } else {
      removeUploadedFile(index)
    }

    closeFileDeleteModal()
  }

  // 移除本地文件（未上传的）
  const removeLocalFile = (index: number) => {
    setLocalFiles(prev => prev.filter((_, i) => i !== index))
  }

  // 移除已上传的文件
  const removeUploadedFile = async (index: number) => {
    const fileToRemove = essay.essayFileUrls![index]

    try {
      // 从服务器删除文件 - 使用文件名
      if (fileToRemove.id && fileToRemove.name) {
        await fetchData(ENDPOINTS.FILE.DELETE, 'DELETE', {
          name: fileToRemove.name,
          category: 'blog/essay',
          isDirectory: false
        })
      }

      // 从本地状态移除
      setEssay(prev => ({
        ...prev,
        essayFileUrls: prev.essayFileUrls?.filter((_, i) => i !== index) || []
      }))
    } catch (error) {
      console.error('文件删除失败:', error)
      showAlert('文件删除失败，但已从本地移除')
      // 即使服务器删除失败，也从本地移除
      setEssay(prev => ({
        ...prev,
        essayFileUrls: prev.essayFileUrls?.filter((_, i) => i !== index) || []
      }))
    }
  }

  // 上传单个文件到服务器
  const uploadSingleFile = async (file: File, fileType: FileType) => {
    try {
      const formData = new FormData()
      if (!file || !file.name || file.size <= 0) {
        throw new Error('无效的文件')
      }
      formData.append('namespace', 'blog/essay')
      formData.append('file', file)

      const response = await apiClient({
        url: ENDPOINTS.FILE.UPLOAD,
        method: 'POST',
        data: formData
      })

      const data = response.data
      if (response.status === 200) {
        // 创建文件信息对象，包含文件名
        const essayFile: EssayFile = {
          id: 0, // 服务器会分配ID
          url: data.url,
          urlType: fileType,
          urlDesc: null,
          isValid: true,
          createTime: new Date().toISOString(),
          name: file.name // 保存原始文件名
        }
        return essayFile
      } else {
        throw new Error(`文件上传失败: ${data.message || '未知错误'}`)
      }
    } catch (error) {
      console.error('文件上传失败:', error)
      throw error
    }
  }

  // 表单验证
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {}

    if (!essay.title.trim()) {
      errors.title = '标题不能为空！'
    } else if (essay.title.length > 100) {
      errors.title = '标题不超过100字！'
    }

    // 内容最大长度改为3000字
    if (essay.content.length > MAX_CONTENT_LENGTH) {
      errors.content = `内容不超过${MAX_CONTENT_LENGTH}字！`
    }

    // 至少需要有内容或文件
    const fileCount = (essay.essayFileUrls?.length || 0) + localFiles.length

    if (!essay.content.trim() && fileCount === 0) {
      errors.content = '内容和文件不能同时为空！'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // 发布/更新随笔 - 此时才上传文件
  const publishEssay = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)

      // 1. 先上传所有本地文件
      const uploadedFiles: EssayFile[] = []

      for (const localFile of localFiles) {
        try {
          const essayFile = await uploadSingleFile(localFile.file, localFile.type)
          uploadedFiles.push(essayFile)
        } catch (error) {
          showAlert(`部分文件上传失败，已跳过`)
          console.log('上传文件错误' + error)
        }
      }

      // 2. 合并已上传的文件和新上传的文件
      const allFiles: EssayFile[] = [...(essay.essayFileUrls || []), ...uploadedFiles]

      // 3. 准备随笔数据
      const essayData: Essay = {
        ...essay,
        essayFileUrls: allFiles,
        createTime: essay.createTime || new Date().toISOString(),
        user_id: userInfo?.id || 1000
      }

      // 4. 提交随笔数据到服务器
      const data = await fetchData(ENDPOINTS.ADMIN.ESSAY, 'POST', { essay: essayData })

      if (data.code === 200) {
        showAlert('操作成功！')
        // 重置表单
        setEssay({
          id: null,
          user_id: null,
          title: '',
          content: '',
          createTime: '',
          essayFileUrls: [],
          recommend: false
        })
        setLocalFiles([]) // 清空本地待上传文件
        // 切换到列表标签页并刷新列表
        setActiveKey('second')
        getEssayList()
      } else {
        showAlert('操作失败')
      }

      setLoading(false)
    } catch (error) {
      setLoading(false)
      console.error('发布随笔失败:', error)
      showAlert('发布随笔失败')
    }
  }

  // 打开删除确认框
  const openDeleteModal = (id: number) => {
    setCurrentDeleteId(id)
    setDeleteModalVisible(true)
  }

  // 关闭删除确认框
  const closeDeleteModal = () => {
    setDeleteModalVisible(false)
    setCurrentDeleteId(null)
  }

  // 确认删除随笔
  const confirmDelete = async () => {
    if (!currentDeleteId) return

    try {
      const data = await fetchData(`${ENDPOINTS.ADMIN.ESSAY}/${currentDeleteId}/delete`, 'GET')
      if (data.code === 200) {
        showAlert('删除成功！')
        getEssayList()
        closeDeleteModal()
      } else {
        showAlert('删除失败')
      }
    } catch (error) {
      console.error('删除随笔失败:', error)
      showAlert('删除失败')
    }
  }

  // 编辑随笔
  const editById = (row: Essay) => {
    setEssay({
      id: row.id,
      user_id: row.user_id,
      title: row.title,
      content: row.content,
      createTime: row.createTime,
      recommend: row.recommend || false, // 编辑时带入推荐状态
      // 确保文件名存在
      essayFileUrls: (row.essayFileUrls || []).map(file => ({
        ...file,
        name: file.name || file.url.split('/').pop() || `文件${file.id}`
      }))
    })
    setLocalFiles([]) // 清空本地待上传文件
    setActiveKey('first')
  }

  // 统计各类文件数量
  const countFilesByType = (files: EssayFile[]) => {
    return {
      images: files.filter(f => f.urlType === 'IMAGE').length,
      videos: files.filter(f => f.urlType === 'VIDEO').length,
      texts: files.filter(f => f.urlType === 'TEXT' || f.urlType === 'OTHER').length
    }
  }

  return (
    <div className="font-sans min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-blue-50 text-slate-800 dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-200 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(50,100,200,0.1)_0%,transparent_40%),radial-gradient(circle_at_80%_80%,rgba(80,120,250,0.1)_0%,transparent_40%)] dark:opacity-100 opacity-0"></div>

      <main className="flex-1 w-full max-w-7xl mx-auto lg:px-2 lg:py-2 relative z-10">
        {/* 标签页切换 */}
        <div className="bg-white/80 backdrop-blur-sm lg:rounded-xl shadow border border-slate-200/50 overflow-hidden mb-6 dark:bg-slate-800/40 dark:border-slate-700/50">
          <div className="flex border-b border-slate-200/50 dark:border-slate-700/50">
            <button
              className={`px-6 py-2 lg:py-3 text-sm font-medium transition-colors flex-1 ${
                activeKey === 'first'
                  ? 'text-blue-600 border-b-2 border-blue-500 dark:text-blue-400 dark:border-blue-500'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              onClick={() => handleTabChange('first')}
            >
              <Plus className="h-4 w-4 mr-2 inline-block" />
              新建随笔
            </button>
            <button
              className={`px-6 py-4 text-sm font-medium transition-colors flex-1 ${
                activeKey === 'second'
                  ? 'text-blue-600 border-b-2 border-blue-500 dark:text-blue-400 dark:border-blue-500'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              onClick={() => handleTabChange('second')}
            >
              <FileText className="h-4 w-4 mr-2 inline-block" />
              随笔管理
            </button>
          </div>

          {/* 新建随笔内容 */}
          {activeKey === 'first' && (
            <div className="p-6 space-y-6 min-h-[90vh]">
              {/* 标题输入 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 dark:text-slate-300">标题</label>
                <input
                  type="text"
                  value={essay.title}
                  onChange={e => setEssay(prev => ({ ...prev, title: e.target.value }))}
                  className={`w-full p-3 rounded-lg border ${
                    formErrors.title ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                  } bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500`}
                  placeholder="请输入随笔标题"
                  maxLength={100}
                />
                {formErrors.title && (
                  <p className="text-red-600 text-sm mt-1 flex items-center dark:text-red-400">
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    {formErrors.title}
                  </p>
                )}
                <div className="text-right text-xs text-slate-500 mt-1 dark:text-slate-400">
                  {essay.title.length}/100
                </div>
              </div>

              {/* 内容输入 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 dark:text-slate-300">内容</label>
                {formErrors.content && (
                  <p className="text-red-600 text-sm mb-2 flex items-center dark:text-red-400">
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    {formErrors.content}
                  </p>
                )}
                <textarea
                  value={essay.content}
                  onChange={e => setEssay(prev => ({ ...prev, content: e.target.value }))}
                  className={`w-full p-3 rounded-lg border ${
                    formErrors.content ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                  } bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all min-h-[200px] resize-y dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500`}
                  placeholder="分享你的想法..."
                  maxLength={MAX_CONTENT_LENGTH}
                />
                <div className="text-right text-xs text-slate-500 mt-1 dark:text-slate-400">
                  {essay.content.length}/{MAX_CONTENT_LENGTH}
                </div>
              </div>

              {/* 文件上传区域 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 dark:text-slate-300">
                  文件 ({localFiles.length + (essay.essayFileUrls?.length || 0)}/{MAX_FILE_COUNT})
                  <span className="text-xs text-slate-500 ml-2 dark:text-slate-400">
                    支持图片、视频、PDF、Word、PPT、MD等格式
                  </span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {/* 上传按钮 */}
                  {localFiles.length + (essay.essayFileUrls?.length || 0) < MAX_FILE_COUNT && (
                    <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-4 h-24 flex flex-col items-center justify-center text-slate-500 hover:border-blue-500 hover:text-blue-500 cursor-pointer transition-colors dark:text-slate-400 dark:hover:text-blue-400">
                      <Plus className="h-6 w-6 mb-1" />
                      <span className="text-xs">添加文件</span>
                      <input
                        type="file"
                        accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.md,.txt"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  )}

                  {/* 已选择的本地文件（未上传） */}
                  {localFiles.map((file, index) => (
                    <div
                      key={`local-${index}`}
                      className="relative rounded-lg overflow-hidden h-24 border border-blue-500/50 group"
                    >
                      {file.type === 'IMAGE' ? (
                        <Image
                          src={file.previewUrl}
                          alt={`待上传图片 ${index + 1}`}
                          width={144}
                          height={144}
                          className="w-full h-full object-cover"
                        />
                      ) : file.type === 'VIDEO' ? (
                        <video
                          src={file.previewUrl}
                          className="w-full h-full object-cover"
                          controls={false}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 p-2">
                          <div className="text-blue-500 mb-1 dark:text-blue-400">
                            {getFileIconByType(file.type, file.file.name)}
                          </div>
                          <span className="text-xs text-slate-700 truncate text-center dark:text-slate-300">
                            {file.file.name}
                          </span>
                        </div>
                      )}
                      <div className="absolute top-1 right-1 bg-blue-500/80 text-white text-xs px-1 rounded">
                        待上传
                      </div>
                      <button
                        type="button"
                        onClick={() => openFileDeleteModal(index, true, file.file.name)}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        aria-label="删除文件"
                      >
                        <X className="h-5 w-5 text-white" />
                      </button>
                    </div>
                  ))}

                  {/* 已上传的文件 */}
                  {essay.essayFileUrls?.map((file, index) => {
                    const fileName = file.name || file.url.split('/').pop() || ''
                    return (
                      <div
                        key={`uploaded-${file.id}-${index}`}
                        className="relative rounded-lg overflow-hidden h-24 border border-slate-300 dark:border-slate-700 group"
                      >
                        {file.urlType === 'IMAGE' ? (
                          <Image
                            src={file.url}
                            alt={`已上传图片 ${index + 1}`}
                            width={144}
                            height={144}
                            className="w-full h-full object-cover"
                          />
                        ) : file.urlType === 'VIDEO' ? (
                          <video
                            src={file.url}
                            className="w-full h-full object-cover"
                            controls={false}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 p-2">
                            <div className="text-blue-500 mb-1 dark:text-blue-400">
                              {getFileIconByType(file.urlType, fileName)}
                            </div>
                            <span className="text-xs text-slate-700 truncate text-center dark:text-slate-300">
                              {fileName}
                            </span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => openFileDeleteModal(index, false, fileName)}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          aria-label="删除文件"
                        >
                          <X className="h-5 w-5 text-white" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 发布按钮 */}
              <div className="flex justify-end">
                <button
                  onClick={publishEssay}
                  disabled={loading}
                  className={`px-6 py-2.5 rounded-lg transition-all duration-300 bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2 dark:bg-blue-600 dark:hover:bg-blue-500 ${
                    loading ? 'opacity-70' : ''
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4" />
                      上传文件并发布...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {essay.id ? '更新随笔' : '发布随笔'}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* 随笔管理列表 */}
          {activeKey === 'second' && (
            <div className="px-1 min-h-[90vh]">
              {/* 搜索和排序区域 - 确保始终在一行显示 */}
              <div className="p-4 flex items-center justify-between gap-2 min-w-0">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    placeholder="搜索标题..."
                    value={searchKeyword}
                    onChange={e => setSearchKeyword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-300 bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all min-w-0 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={toggleSortOrder}
                  className={`p-2 rounded-lg transition-all duration-300 flex items-center justify-center ${
                    sortOrder
                      ? 'bg-blue-100/60 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400'
                      : 'bg-white/60 text-slate-500 hover:text-slate-700 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                  aria-label={
                    sortOrder === 'asc'
                      ? '当前按时间升序排序，点击切换'
                      : sortOrder === 'desc'
                      ? '当前按时间降序排序，点击切换'
                      : '点击按时间排序'
                  }
                >
                  {sortOrder === 'asc' ? (
                    <ArrowUp className="h-5 w-5" />
                  ) : sortOrder === 'desc' ? (
                    <ArrowDown className="h-5 w-5" />
                  ) : (
                    <ArrowUpDown className="h-5 w-5" />
                  )}
                </button>
              </div>

              <div className="overflow-x-auto">
                {/* 桌面端表格 */}
                <table className="w-full min-w-[640px] border-collapse hidden md:table">
                  <thead>
                    <tr className="bg-slate-100/60 text-slate-700 text-sm dark:bg-slate-900/40 dark:text-slate-300">
                      <th className="py-3 px-4 text-left border-b border-slate-200/50 dark:border-slate-700/50">序号</th>
                      <th className="py-3 px-4 text-left border-b border-slate-200/50 dark:border-slate-700/50">随笔标题</th>
                      <th className="py-3 px-4 text-left border-b border-slate-200/50 dark:border-slate-700/50">文件</th>
                      <th className="py-3 px-4 text-left border-b border-slate-200/50 dark:border-slate-700/50">发布时间</th>
                      <th className="py-3 px-4 text-left border-b border-slate-200/50 dark:border-slate-700/50">推荐</th>
                      <th className="py-3 px-4 text-left border-b border-slate-200/50 dark:border-slate-700/50">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEssayList.length > 0 ? (
                      filteredEssayList.map((item, index) => {
                        const fileCounts = countFilesByType(item.essayFileUrls || [])
                        const totalFiles = fileCounts.images + fileCounts.videos + fileCounts.texts

                        return (
                          <tr key={item.id} className="hover:bg-slate-100/60 transition-colors dark:hover:bg-slate-800/60">
                            <td className="py-3 px-4 border-b border-slate-200/30 text-slate-700 dark:border-slate-700/30 dark:text-slate-300">
                              {index + 1}
                            </td>
                            <td className="py-3 px-4 border-b border-slate-200/30 text-slate-700 max-w-xs truncate dark:border-slate-700/30 dark:text-slate-300">
                              {item.title}
                            </td>
                            <td className="py-3 px-4 border-b border-slate-200/30 dark:border-slate-700/30">
                              {totalFiles > 0 ? (
                                <div className="flex items-center text-sm text-slate-700 dark:text-slate-300">
                                  {fileCounts.images > 0 && (
                                    <span className="flex items-center mr-2">
                                      <FileImage className="h-3.5 w-3.5 mr-1 text-blue-500 dark:text-blue-400" />
                                      图片: {fileCounts.images}
                                    </span>
                                  )}
                                  {fileCounts.videos > 0 && (
                                    <span className="flex items-center mr-2">
                                      <FileVideo className="h-3.5 w-3.5 mr-1 text-green-500 dark:text-green-400" />
                                      视频: {fileCounts.videos}
                                    </span>
                                  )}
                                  {fileCounts.texts > 0 && (
                                    <span className="flex items-center">
                                      <FileText className="h-3.5 w-3.5 mr-1 text-yellow-500 dark:text-yellow-400" />
                                      文档: {fileCounts.texts}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-500 text-sm dark:text-slate-400">无文件</span>
                              )}
                            </td>
                            <td className="py-3 px-4 border-b border-slate-200/30 text-slate-500 text-sm dark:border-slate-700/30 dark:text-slate-400">
                              {formatDate(item.createTime)}
                            </td>
                            <td className="py-3 px-4 border-b border-slate-200/30 dark:border-slate-700/30">
                              <button
                                onClick={() => toggleRecommend(item)}
                                disabled={updateRecommendLoading === item.id}
                                className={`p-1.5 rounded-full transition-colors ${
                                  item.recommend
                                    ? 'bg-yellow-100/60 text-yellow-600 hover:bg-yellow-100/80 dark:bg-yellow-500/20 dark:text-yellow-400 dark:hover:bg-yellow-500/30'
                                    : 'bg-slate-200/60 text-slate-500 hover:bg-slate-200/80 dark:bg-slate-700/50 dark:text-slate-400 dark:hover:bg-slate-700/80'
                                }`}
                                title={item.recommend ? '取消推荐' : '推荐'}
                              >
                                {updateRecommendLoading === item.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : item.recommend ? (
                                  <Star className="h-4 w-4 fill-yellow-500 dark:fill-yellow-400" />
                                ) : (
                                  <StarOff className="h-4 w-4" />
                                )}
                              </button>
                            </td>
                            <td className="py-3 px-4 border-b border-slate-200/30 dark:border-slate-700/30">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => editById(item)}
                                  className="p-1.5 rounded-full bg-blue-100/60 text-blue-600 hover:bg-blue-100/80 transition-colors dark:bg-blue-600/20 dark:text-blue-400 dark:hover:bg-blue-600/30"
                                  title="编辑"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => openDeleteModal(item.id as number)}
                                  className="p-1.5 rounded-full bg-red-100/60 text-red-600 hover:bg-red-100/80 transition-colors dark:bg-red-600/20 dark:text-red-400 dark:hover:bg-red-600/30"
                                  title="删除"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 dark:text-slate-400">
                          暂无匹配的随笔数据
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* 移动端列表视图 */}
                <div className="md:hidden">
                  {filteredEssayList.length > 0 ? (
                    <div className="space-y-4">
                      {filteredEssayList.map((item, index) => {
                        const fileCounts = countFilesByType(item.essayFileUrls || [])
                        const totalFiles = fileCounts.images + fileCounts.videos + fileCounts.texts

                        return (
                          <div
                            key={item.id}
                            className="bg-white/60 rounded-lg overflow-hidden border border-slate-200/30 dark:bg-slate-800/40 dark:border-slate-700/30"
                          >
                            {/* 标题栏 */}
                            <div className="bg-slate-100/60 px-4 py-3 border-b border-slate-200/50 flex justify-between items-center dark:bg-slate-900/40 dark:border-slate-700/50">
                              <span className="text-sm text-slate-500 dark:text-slate-400">序号: {index + 1}</span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => toggleRecommend(item)}
                                  disabled={updateRecommendLoading === item.id}
                                  className={`p-1.5 rounded-full transition-colors ${
                                    item.recommend
                                      ? 'bg-yellow-100/60 text-yellow-600 hover:bg-yellow-100/80 dark:bg-yellow-500/20 dark:text-yellow-400 dark:hover:bg-yellow-500/30'
                                      : 'bg-slate-200/60 text-slate-500 hover:bg-slate-200/80 dark:bg-slate-700/50 dark:text-slate-400 dark:hover:bg-slate-700/80'
                                  }`}
                                  title={item.recommend ? '取消推荐' : '推荐'}
                                >
                                  {updateRecommendLoading === item.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : item.recommend ? (
                                    <Star className="h-4 w-4 fill-yellow-500 dark:fill-yellow-400" />
                                  ) : (
                                    <StarOff className="h-4 w-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => editById(item)}
                                  className="p-1.5 rounded-full bg-blue-100/60 text-blue-600 hover:bg-blue-100/80 transition-colors dark:bg-blue-600/20 dark:text-blue-400 dark:hover:bg-blue-600/30"
                                  title="编辑"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => openDeleteModal(item.id as number)}
                                  className="p-1.5 rounded-full bg-red-100/60 text-red-600 hover:bg-red-100/80 transition-colors dark:bg-red-600/20 dark:text-red-400 dark:hover:bg-red-600/30"
                                  title="删除"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            {/* 内容区域 */}
                            <div className="p-4 space-y-3">
                              <div>
                                <span className="block text-xs text-slate-500 mb-1 dark:text-slate-400">随笔标题</span>
                                <span className="text-slate-700 dark:text-slate-300">{item.title}</span>
                              </div>

                              <div>
                                <span className="block text-xs text-slate-500 mb-1 dark:text-slate-400">文件</span>
                                {totalFiles > 0 ? (
                                  <div className="flex flex-wrap gap-2 text-sm text-slate-700 dark:text-slate-300">
                                    {fileCounts.images > 0 && (
                                      <span className="flex items-center">
                                        <FileImage className="h-3.5 w-3.5 mr-1 text-blue-500 dark:text-blue-400" />
                                        图片: {fileCounts.images}
                                      </span>
                                    )}
                                    {fileCounts.videos > 0 && (
                                      <span className="flex items-center">
                                        <FileVideo className="h-3.5 w-3.5 mr-1 text-green-500 dark:text-green-400" />
                                        视频: {fileCounts.videos}
                                      </span>
                                    )}
                                    {fileCounts.texts > 0 && (
                                      <span className="flex items-center">
                                        <FileText className="h-3.5 w-3.5 mr-1 text-yellow-500 dark:text-yellow-400" />
                                        文档: {fileCounts.texts}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-500 text-sm dark:text-slate-400">无文件</span>
                                )}
                              </div>

                              <div>
                                <span className="block text-xs text-slate-500 mb-1 dark:text-slate-400">发布时间</span>
                                <span className="text-slate-500 text-sm dark:text-slate-400">
                                  {formatDate(item.createTime)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="py-10 text-center text-slate-500 dark:text-slate-400">暂无匹配的随笔数据</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        {/* 删除确认对话框 */}
        {deleteModalVisible &&
          createPortal(
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white/90 rounded-lg p-6 max-w-sm mx-4 dark:bg-slate-800">
                <h3 className="text-lg font-medium text-slate-800 mb-4 dark:text-slate-200">确认删除</h3>
                <p className="text-slate-600 mb-6 dark:text-slate-400">确定要删除这篇随笔吗？此操作不可撤销。</p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={closeDeleteModal}
                    className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                  >
                    取消
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors"
                  >
                    确认删除
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
        {/* 文件删除确认对话框 */}
        {deleteFileModalVisible &&
          createPortal(
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white/90 rounded-lg p-6 max-w-sm mx-4 dark:bg-slate-800">
                <h3 className="text-lg font-medium text-slate-800 mb-4 dark:text-slate-200">确认删除文件</h3>
                <p className="text-slate-600 mb-6 dark:text-slate-400">
                  确定要删除文件 “{fileToDelete?.fileName}” 吗？此操作不可撤销。
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={closeFileDeleteModal}
                    className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                  >
                    取消
                  </button>
                  <button
                    onClick={confirmFileDelete}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors"
                  >
                    确认删除
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
      </main>
    </div>
  )
}