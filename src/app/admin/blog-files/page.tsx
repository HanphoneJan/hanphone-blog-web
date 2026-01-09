'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ENDPOINTS } from '@/lib/api'
import apiClient from '@/lib/utils'
import { showAlert } from '@/lib/Alert'
import {
  Folder,
  File,
  Trash2,
  Upload,
  Plus,
  Download,
  Eye,
  AlertCircle,
  Loader2,
  X,
  ArrowLeft,
  ChevronRight
} from 'lucide-react'
import React from 'react'

// 定义文件和目录的类型
interface FileItem {
  name: string
  isDirectory: boolean
  size: number
  mtime: string
  birthtime: string
  category?: string | null
  namespace?: string | null
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化日期（简化移动视图显示）
const formatDate = (dateString: string, isMobile = false): string => {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    return '无效日期'
  }

  if (isMobile) {
    // 移动视图使用更简洁的日期格式
    return new Intl.DateTimeFormat('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// 获取文件扩展名
const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || ''
}

// 判断文件是否为图片
const isImageFile = (filename: string): boolean => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
  return imageExtensions.includes(getFileExtension(filename))
}

// 判断文件是否为PDF
const isPdfFile = (filename: string): boolean => {
  return getFileExtension(filename) === 'pdf'
}

// 判断文件是否为音频
const isAudioFile = (filename: string): boolean => {
  const audioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a']
  return audioExtensions.includes(getFileExtension(filename))
}

// 判断文件是否为视频
const isVideoFile = (filename: string): boolean => {
  const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv']
  return videoExtensions.includes(getFileExtension(filename))
}

// 判断文件是否可以在浏览器中预览
const canPreviewInBrowser = (filename: string): boolean => {
  return (
    isImageFile(filename) || isPdfFile(filename) || isAudioFile(filename) || isVideoFile(filename)
  )
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
    showAlert('操作失败，请重试')
    return { code: 500, data: null }
  }
}

export default function FileManagementPage() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [currentDir, setCurrentDir] = useState('')
  const [showCreateDirModal, setShowCreateDirModal] = useState(false)
  const [newDirName, setNewDirName] = useState('')
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [currentDeleteItem, setCurrentDeleteItem] = useState<FileItem | null>(null)
  const uploadRef = useRef<HTMLInputElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isSmallScreen, setIsSmallScreen] = useState(false)
  const [previewModalVisible, setPreviewModalVisible] = useState(false)
  const [previewFile, setPreviewFile] = useState<{ name: string; url: string } | null>(null)

  // 检测屏幕尺寸
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      setIsMobile(width < 640) // 移动设备 < 640px
      setIsSmallScreen(width < 768) // 小屏幕 < 768px
    }

    // 初始化检测
    checkScreenSize()
    // 监听窗口大小变化
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // 获取文件列表
  const fetchFiles = async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await fetchData(ENDPOINTS.FILE.GET_FILES, 'GET', {
        namespace: currentDir
      })

      if (data.code === 200) {
        setFiles(data.items || [])
      } else {
        throw new Error(data.error || '获取文件列表失败')
      }
    } catch (err) {
      console.error('获取文件列表出错:', err)
      setError(err instanceof Error ? err.message : '获取文件列表时发生错误')
    } finally {
      setLoading(false)
    }
  }

  // 初始化加载文件列表
  useEffect(() => {
    fetchFiles()
  }, [currentDir])

  // 处理文件上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)

      const formData = new FormData()

      if (currentDir) {
        formData.append('namespace', '/' + currentDir)
      } else {
        formData.append('namespace', 'blog')
      }
      formData.append('file', file)
      const res = await apiClient({
        url: ENDPOINTS.FILE.UPLOAD,
        method: 'POST',
        data: formData
      })

      if (res.data.code === 200) {
        fetchFiles()
        e.target.value = ''
        showAlert('文件上传成功')
      } else {
        throw new Error(res.data.error || '文件上传失败')
      }
    } catch (err) {
      console.error('文件上传出错:', err)
      showAlert(err instanceof Error ? err.message : '文件上传时发生错误')
    } finally {
      setUploading(false)
    }
  }

  // 创建目录
  const handleCreateDirectory = async () => {
    if (!newDirName.trim()) {
      setError('目录名称不能为空')
      return
    }

    try {
      setLoading(true)

      const data = await fetchData(ENDPOINTS.FILE.DIRECTORY, 'POST', {
        name: newDirName,
        parentNamespace: currentDir
      })

      if (data.code === 200) {
        setShowCreateDirModal(false)
        setNewDirName('')
        fetchFiles()
        showAlert('目录创建成功')
      } else {
        throw new Error(data.error || '创建目录失败')
      }
    } catch (err) {
      console.error('创建目录出错:', err)
      setError(err instanceof Error ? err.message : '创建目录时发生错误')
    } finally {
      setLoading(false)
    }
  }

  // 打开删除确认框
  const openDeleteModal = (item: FileItem) => {
    setCurrentDeleteItem(item)
    setDeleteModalVisible(true)
  }

  // 关闭删除确认框
  const closeDeleteModal = () => {
    setDeleteModalVisible(false)
    setCurrentDeleteItem(null)
  }

  // 确认删除文件或目录
  const confirmDelete = async () => {
    if (!currentDeleteItem) return

    try {
      setLoading(true)

      const data = await fetchData(ENDPOINTS.FILE.DELETE, 'DELETE', {
        name: currentDeleteItem.name,
        category: currentDir,
        isDirectory: currentDeleteItem.isDirectory
      })

      if (data.code === 200) {
        showAlert('删除成功！')
        fetchFiles()
        closeDeleteModal()
      } else {
        throw new Error(data.error || '删除失败')
      }
    } catch (err) {
      console.error('删除出错:', err)
      showAlert(err instanceof Error ? err.message : '删除时发生错误')
    } finally {
      setLoading(false)
    }
  }

  // 下载文件
  const handleDownload = async (fileName: string) => {
    try {
      // 创建下载链接，强制下载而不是预览
      const encodedDir = currentDir ? encodeURIComponent(currentDir) + '/' : ''
      const encodedFileName = encodeURIComponent(fileName)
      const downloadUrl = `https://hanphone.top/${encodedDir}${encodedFileName}?download=1`

      // 在新窗口中打开下载链接
      window.open(downloadUrl, '_blank')

      showAlert('文件下载已开始')
    } catch (err) {
      console.error('下载文件出错:', err)
      showAlert(err instanceof Error ? err.message : '下载文件时发生错误')
    }
  }

  // 查看文件
  const handleViewFile = (fileName: string) => {
    try {
      const encodedDir = currentDir ? encodeURIComponent(currentDir) + '/' : ''
      const encodedFileName = encodeURIComponent(fileName)
      const url = `https://hanphone.top/${encodedDir}${encodedFileName}`

      // 如果是可以在浏览器中预览的文件，打开预览模态框
      if (canPreviewInBrowser(fileName)) {
        setPreviewFile({ name: fileName, url })
        setPreviewModalVisible(true)
      } else {
        // 否则直接触发下载
        handleDownload(fileName)
      }
    } catch (err) {
      console.error('查看文件出错:', err)
      showAlert(err instanceof Error ? err.message : '查看文件时发生错误')
    }
  }

  // 关闭预览模态框
  const closePreviewModal = () => {
    setPreviewModalVisible(false)
    setPreviewFile(null)
  }

  // 进入目录
  const handleEnterDirectory = (dirName: string) => {
    setCurrentDir(currentDir ? `${currentDir}/${dirName}` : dirName)
  }

  // 返回上级目录
  const handleGoBack = () => {
    if (!currentDir) return

    const dirs = currentDir.split('/')
    dirs.pop()
    setCurrentDir(dirs.join('/'))
  }

  // 渲染面包屑导航
  const renderBreadcrumbs = () => {
    if (!currentDir) {
      return
    }

    const dirs = currentDir.split('/')
    const breadcrumbs = []

    breadcrumbs.push(
      <button
        key="root"
        onClick={() => setCurrentDir('')}
        className="text-blue-600 hover:text-blue-500 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
      ></button>
    )

    let path = ''
    for (const [index, dir] of dirs.entries()) {
      path = path ? `${path}/${dir}` : dir
      breadcrumbs.push(
        <React.Fragment key={`breadcrumb-${index}`}>
          <ChevronRight className="h-3.5 w-3.5 mx-1 text-slate-500 dark:text-slate-400" />
          <button
            onClick={() => setCurrentDir(path)}
            className="text-blue-600 hover:text-blue-500 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
          >
            {dir}
          </button>
        </React.Fragment>
      )
    }

    return <>{breadcrumbs}</>
  }

  // 移动设备文件项渲染（时间与名称水平对齐）
  const renderMobileFileItem = (item: FileItem) => (
    <div className="border-b border-slate-200/30 p-3 last:border-0 dark:border-slate-700/50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center flex-1 min-w-0">
          {item.isDirectory ? (
            <Folder className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" />
          ) : (
            <File className="h-5 w-5 text-slate-400 mr-2 flex-shrink-0 dark:text-slate-500" />
          )}
          <button
            onClick={() => item.isDirectory && handleEnterDirectory(item.name)}
            className={`${
              item.isDirectory
                ? 'text-blue-600 hover:text-blue-500 hover:underline dark:text-blue-400 dark:hover:text-blue-300'
                : 'text-slate-700 dark:text-slate-300'
            } truncate`}
            title={item.name}
          >
            {item.name}
          </button>
        </div>
        <span className="text-xs text-slate-500 whitespace-nowrap ml-2 dark:text-slate-400">
          {formatDate(item.mtime, true)}
        </span>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {item.isDirectory ? '目录' : formatFileSize(item.size)}
        </span>

        <div className="flex gap-1 ml-2">
          {!item.isDirectory && (
            <>
              <button
                onClick={() => handleViewFile(item.name)}
                className="p-1.5 rounded-full bg-blue-100/60 text-blue-600 hover:bg-blue-100/80 transition-colors dark:bg-blue-600/20 dark:text-blue-400 dark:hover:bg-blue-600/30"
                disabled={loading}
                title={canPreviewInBrowser(item.name) ? '查看' : '下载'}
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleDownload(item.name)}
                className="p-1.5 rounded-full bg-green-100/60 text-green-600 hover:bg-green-100/80 transition-colors dark:bg-green-600/20 dark:text-green-400 dark:hover:bg-green-600/30"
                disabled={loading}
                title="下载"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          <button
            onClick={() => openDeleteModal(item)}
            className="p-1.5 rounded-full bg-red-100/60 text-red-600 hover:bg-red-100/80 transition-colors dark:bg-red-600/20 dark:text-red-400 dark:hover:bg-red-600/30"
            disabled={loading}
            title="删除"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )

  // 渲染文件预览内容
  const renderPreviewContent = () => {
    if (!previewFile) return null

    const { name, url } = previewFile

    if (isImageFile(name)) {
      return (
        <div className="flex justify-center items-center h-full">
          <img src={url} alt={name} className="max-w-full max-h-full object-contain" />
        </div>
      )
    } else if (isPdfFile(name)) {
      return <iframe src={url} className="w-full h-full" title={name} />
    } else if (isAudioFile(name)) {
      return (
        <div className="flex flex-col justify-center items-center h-full p-4">
          <div className="mb-4 text-slate-700 text-center dark:text-slate-300">
            <File className="h-16 w-16 mx-auto mb-2 text-slate-500 dark:text-slate-400" />
            <p className="text-lg font-medium">{name}</p>
          </div>
          <audio controls className="w-full max-w-md" src={url}>
            您的浏览器不支持音频播放。
          </audio>
        </div>
      )
    } else if (isVideoFile(name)) {
      return (
        <div className="flex justify-center items-center h-full">
          <video controls className="max-w-full max-h-full" src={url}>
            您的浏览器不支持视频播放。
          </video>
        </div>
      )
    }

    return null
  }

  return (
    <div className="font-sans min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-blue-50 text-slate-800 dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-200 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(50,100,200,0.1)_0%,transparent_40%),radial-gradient(circle_at_80%_80%,rgba(80,120,250,0.1)_0%,transparent_40%)] dark:opacity-100 opacity-0"></div>

      <main className="flex-1 w-full max-w-7xl mx-auto lg:px-2 lg:py-2 relative z-10">
        <div className="bg-white/80 backdrop-blur-sm lg:rounded-xl shadow border border-slate-200/50 overflow-hidden dark:bg-slate-800/40 dark:border-slate-700/50">
          {/* 顶部导航 - 始终保持在一行 */}
          <div className="px-4 py-3 border-b border-slate-200/50 bg-white/60 dark:border-slate-700/50 dark:bg-slate-900/40">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <h1 className="text-lg font-bold text-slate-800 truncate dark:text-slate-200">文件管理系统</h1>

              {/* 操作按钮区 - 压缩按钮大小以保持在一行 */}
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center px-2.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow transition-colors cursor-pointer text-xs dark:bg-blue-600 dark:hover:bg-blue-500">
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  上传
                  <input
                    ref={uploadRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading || loading}
                  />
                </label>

                <button
                  onClick={() => setShowCreateDirModal(true)}
                  className="inline-flex items-center px-2.5 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow transition-colors text-xs dark:bg-green-600 dark:hover:bg-green-500"
                  disabled={loading}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  新建目录
                </button>
              </div>
            </div>
          </div>

          {/* 主内容区 */}
          <div className="px-4 pb-1 min-h-[90vh]">
            {/* 错误提示 */}
            {error && (
              <div className="bg-red-100/60 border border-red-200/50 text-red-700 px-4 py-2 rounded-lg mb-3 flex items-center dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span>{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-600 hover:text-red-500 transition-colors dark:text-red-500 dark:hover:text-red-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* 面包屑导航 */}
            <div className="mb-1 mt-3 px-2 flex sm:text-base items-center text-xs overflow-x-auto pb-1 hide-scrollbar">
              <div className="flex items-center whitespace-nowrap">
                {renderBreadcrumbs()}
                {currentDir && (
                  <button
                    onClick={handleGoBack}
                    className="text-slate-500 hover:text-slate-700 flex items-center transition-colors dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                    返回
                  </button>
                )}
              </div>
            </div>

            {/* 文件列表 */}
            {loading ? (
              <div className="bg-white/60 rounded-lg shadow overflow-hidden border border-slate-200/50 dark:bg-slate-900/40 dark:border-slate-700/50">
                <div className="px-4 py-2 text-center text-slate-500 dark:text-slate-400">
                  <Loader2 className="animate-spin h-5 w-5 mx-auto mb-2 text-slate-600 dark:text-slate-500" />
                  加载中...
                </div>
              </div>
            ) : files.length === 0 ? (
              <div className="bg-white/60 rounded-lg shadow overflow-hidden border border-slate-200/50 dark:bg-slate-900/40 dark:border-slate-700/50">
                <div className="p-4 text-center text-slate-500 dark:text-slate-400">当前目录为空</div>
              </div>
            ) : isMobile ? (
              // 移动设备视图 - 时间与名称水平对齐
              <div className="bg-white/60 rounded-lg shadow overflow-hidden border border-slate-200/50 dark:bg-slate-900/40 dark:border-slate-700/50">
                {/* 先显示目录，再显示文件 */}
                {files
                  .filter(item => item.isDirectory)
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(item => (
                    <div key={`dir-${item.name}`}>{renderMobileFileItem(item)}</div>
                  ))}

                {files
                  .filter(item => !item.isDirectory)
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(item => (
                    <div key={`file-${item.name}`}>{renderMobileFileItem(item)}</div>
                  ))}
              </div>
            ) : (
              // 桌面设备视图 - 使用表格
              <div className="bg-white/60 rounded-lg shadow overflow-hidden border border-slate-200/50 dark:bg-slate-900/40 dark:border-slate-700/50">
                <table className="min-w-full divide-y divide-slate-200/50 dark:divide-slate-700/50">
                  <thead className="bg-slate-100/60 dark:bg-slate-800/60">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 py-2.5 text-left text-xs font-medium text-slate-700 uppercase tracking-wider dark:text-slate-400"
                      >
                        名称
                      </th>
                      <th
                        scope="col"
                        className={`px-4 py-2.5 text-left text-xs font-medium text-slate-700 uppercase tracking-wider ${
                          isSmallScreen ? 'hidden md:table-cell' : ''
                        } dark:text-slate-400`}
                      >
                        大小
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-2.5 text-left text-xs font-medium text-slate-700 uppercase tracking-wider dark:text-slate-400"
                      >
                        修改时间
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-2.5 text-right text-xs font-medium text-slate-700 uppercase tracking-wider dark:text-slate-400"
                      >
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                    {/* 先显示目录，再显示文件 */}
                    {files
                      .filter(item => item.isDirectory)
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(item => (
                        <tr
                          key={`dir-${item.name}`}
                          className="hover:bg-slate-100/60 transition-colors dark:hover:bg-slate-800/40"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <Folder className="h-4.5 w-4.5 text-yellow-500 mr-2" />
                              <button
                                onClick={() => handleEnterDirectory(item.name)}
                                className="text-blue-600 hover:text-blue-500 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                {item.name}
                              </button>
                            </div>
                          </td>
                          <td
                            className={`px-4 py-3 whitespace-nowrap text-xs text-slate-500 ${
                              isSmallScreen ? 'hidden md:table-cell' : ''
                            } dark:text-slate-400`}
                          >
                            -
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                            {formatDate(item.mtime)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-xs font-medium">
                            <button
                              onClick={() => openDeleteModal(item)}
                              className="p-1.25 rounded-full bg-red-100/60 text-red-600 hover:bg-red-100/80 transition-colors dark:bg-red-600/20 dark:text-red-400 dark:hover:bg-red-600/30"
                              disabled={loading}
                              title="删除"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}

                    {files
                      .filter(item => !item.isDirectory)
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(item => (
                        <tr
                          key={`file-${item.name}`}
                          className="hover:bg-slate-100/60 transition-colors dark:hover:bg-slate-800/40"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <File className="h-4.5 w-4.5 text-slate-400 mr-2 dark:text-slate-500" />
                              <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
                            </div>
                          </td>
                          <td
                            className={`px-4 py-3 whitespace-nowrap text-xs text-slate-500 ${
                              isSmallScreen ? 'hidden md:table-cell' : ''
                            } dark:text-slate-400`}
                          >
                            {formatFileSize(item.size)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                            {formatDate(item.mtime)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-xs font-medium">
                            <button
                              onClick={() => handleViewFile(item.name)}
                              className="p-1.25 rounded-full bg-blue-100/60 text-blue-600 hover:bg-blue-100/80 transition-colors mr-1.5 dark:bg-blue-600/20 dark:text-blue-400 dark:hover:bg-blue-600/30"
                              disabled={loading}
                              title={canPreviewInBrowser(item.name) ? '查看' : '下载'}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDownload(item.name)}
                              className="p-1.25 rounded-full bg-green-100/60 text-green-600 hover:bg-green-100/80 transition-colors mr-1.5 dark:bg-green-600/20 dark:text-green-400 dark:hover:bg-green-600/30"
                              disabled={loading}
                              title="下载"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => openDeleteModal(item)}
                              className="p-1.25 rounded-full bg-red-100/60 text-red-600 hover:bg-red-100/80 transition-colors dark:bg-red-600/20 dark:text-red-400 dark:hover:bg-red-600/30"
                              disabled={loading}
                              title="删除"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 创建目录模态框 */}
      {showCreateDirModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 animate-fadeIn">
            <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-200/50 w-full max-w-md transform transition-transform duration-300 scale-100 animate-scaleIn dark:bg-slate-800/95 dark:border-slate-600/30">
              <div className="p-4 border-b border-slate-200/50 flex justify-between items-center bg-white/60 rounded-t-xl dark:border-slate-700/50 dark:bg-slate-900/40">
                <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2 dark:text-slate-200">
                  <Folder className="h-4.5 w-4.5 text-yellow-500" />
                  创建新目录
                </h3>
                <button
                  onClick={() => {
                    setShowCreateDirModal(false)
                    setNewDirName('')
                    setError(null)
                  }}
                  className="text-slate-500 hover:text-slate-700 transition-colors p-1 rounded-full hover:bg-slate-200/50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700/50"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="p-4">
                <div className="mb-3">
                  <label className="block text-xs font-medium text-slate-700 mb-1 dark:text-slate-300">目录名称</label>
                  <input
                    type="text"
                    value={newDirName}
                    onChange={e => setNewDirName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 bg-white/60 text-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
                    placeholder="请输入目录名称"
                    autoFocus
                  />
                  {error && (
                    <p className="text-red-600 text-xs mt-1 flex items-center dark:text-red-400">
                      <AlertCircle className="h-3.5 w-3.5 mr-1" />
                      {error}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-3 border-t border-slate-200/50 flex justify-end gap-2 bg-white/60 rounded-b-xl dark:border-slate-700/50 dark:bg-slate-900/40">
                <button
                  onClick={() => {
                    setShowCreateDirModal(false)
                    setNewDirName('')
                    setError(null)
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-200/60 hover:bg-slate-200 text-slate-700 transition-all duration-200 text-sm dark:bg-slate-700/60 dark:hover:bg-slate-700 dark:text-slate-200"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateDirectory}
                  className="px-3 py-1.5 rounded-lg transition-all duration-300 bg-blue-500 hover:bg-blue-600 text-white text-sm dark:bg-blue-600 dark:hover:bg-blue-500"
                  disabled={!newDirName.trim() || loading}
                >
                  创建
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 删除确认模态框 */}
      {deleteModalVisible &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 animate-fadeIn">
            <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-200/50 w-full max-w-md transform transition-transform duration-300 scale-100 animate-scaleIn dark:bg-slate-800/95 dark:border-slate-600/30">
              <div className="p-4 border-b border-slate-200/50 flex justify-between items-center bg-white/60 rounded-t-xl dark:border-slate-700/50 dark:bg-slate-900/40">
                <h3 className="text-base font-semibold text-red-600 flex items-center gap-2 dark:text-red-300">
                  <AlertCircle className="h-4.5 w-4.5" />
                  确认删除
                </h3>
                <button
                  onClick={closeDeleteModal}
                  className="text-slate-500 hover:text-slate-700 transition-colors p-1 rounded-full hover:bg-slate-200/50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700/50"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="p-4">
                <p className="text-slate-700 text-sm dark:text-slate-300">
                  确定要删除 {currentDeleteItem?.isDirectory ? '目录' : '文件'}{' '}
                  <span className="font-medium">{currentDeleteItem?.name}</span>{' '}
                  吗？此操作不可撤销。
                </p>
              </div>

              <div className="p-3 border-t border-slate-200/50 flex justify-end gap-2 bg-white/60 rounded-b-xl dark:border-slate-700/50 dark:bg-slate-900/40">
                <button
                  onClick={closeDeleteModal}
                  className="px-3 py-1.5 rounded-lg bg-slate-200/60 hover:bg-slate-200 text-slate-700 transition-all duration-200 text-sm dark:bg-slate-700/60 dark:hover:bg-slate-700 dark:text-slate-200"
                >
                  取消
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={loading}
                  className={`px-3 py-1.5 rounded-lg transition-all duration-300 bg-red-600 hover:bg-red-500 text-white flex items-center gap-1.5 text-sm ${
                    loading ? 'opacity-70' : ''
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin h-3.5 w-3.5" />
                      处理中...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
                      确认删除
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 文件预览模态框 */}
      {previewModalVisible &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 animate-fadeIn">
            <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-200/50 w-full h-full max-w-5xl max-h-[90vh] transform transition-transform duration-300 scale-100 animate-scaleIn flex flex-col dark:bg-slate-800/95 dark:border-slate-600/30">
              <div className="p-4 border-b border-slate-200/50 flex justify-between items-center bg-white/60 rounded-t-xl dark:border-slate-700/50 dark:bg-slate-900/40">
                <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2 dark:text-slate-200">
                  <Eye className="h-4.5 w-4.5 text-blue-500 dark:text-blue-400" />
                  文件预览: {previewFile?.name}
                </h3>
                <button
                  onClick={closePreviewModal}
                  className="text-slate-500 hover:text-slate-700 transition-colors p-1 rounded-full hover:bg-slate-200/50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700/50"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4">{renderPreviewContent()}</div>

              <div className="p-3 border-t border-slate-200/50 flex justify-end gap-2 bg-white/60 rounded-b-xl dark:border-slate-700/50 dark:bg-slate-900/40">
                <button
                  onClick={() => previewFile && handleDownload(previewFile.name)}
                  className="px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-all duration-200 text-sm flex items-center gap-1.5 dark:bg-green-600 dark:hover:bg-green-500"
                >
                  <Download className="h-3.5 w-3.5" />
                  下载
                </button>
                <button
                  onClick={closePreviewModal}
                  className="px-3 py-1.5 rounded-lg bg-slate-200/60 hover:bg-slate-200 text-slate-700 transition-all duration-200 text-sm dark:bg-slate-700/60 dark:hover:bg-slate-700 dark:text-slate-200"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 上传中指示器 */}
      {uploading &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 animate-fadeIn">
            <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-200/50 w-full max-w-md transform transition-transform duration-300 scale-100 animate-scaleIn p-4 text-center dark:bg-slate-800/95 dark:border-slate-600/30">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 mx-auto mb-3 dark:border-blue-500"></div>
              <p className="text-slate-700 text-sm dark:text-slate-300">文件上传中，请稍候...</p>
            </div>
          </div>,
          document.body
        )}

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out forwards;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}