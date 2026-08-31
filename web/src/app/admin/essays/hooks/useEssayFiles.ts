'use client'

import { useState, useCallback } from 'react'
import { ENDPOINTS } from '@/lib/api'
import apiClient from '@/lib/utils'
import { TIME, API_CODE } from '@/lib/constants'
import { showAlert } from '@/lib/Alert'
import { ADMIN_ESSAY_LABELS } from '@/lib/labels'
import type { FileType, EssayFile, FileInfo, FileToDelete, UploadProgress, UploadResult } from '../types'
import { ESSAY_NAMESPACE, getFileType, sanitizeTitleForPath, isInternalFileUrl, parseFileUrl } from '../utils'

export function useEssayFiles(
  fetchData: (url: string, method?: string, data?: unknown) => Promise<{ code: number; data?: { url: string }; message?: string }>
) {
  const [localFiles, setLocalFiles] = useState<FileInfo[]>([])
  const [deleteFileModalVisible, setDeleteFileModalVisible] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<FileToDelete | null>(null)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)

  // 文件选择处理
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

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
        // 文本文件不需要预览，使用空字符串
        reader.readAsDataURL(new Blob(['']))
      }
    })

    // 清空input值，允许重复选择同一文件
    e.target.value = ''
  }, [])

  // 打开文件删除确认框
  const openFileDeleteModal = useCallback((index: number, isLocal: boolean, fileName: string, id?: number) => {
    setFileToDelete({ index, isLocal, fileName, id })
    setDeleteFileModalVisible(true)
  }, [])

  // 关闭文件删除确认框
  const closeFileDeleteModal = useCallback(() => {
    setDeleteFileModalVisible(false)
    setFileToDelete(null)
  }, [])

  // 移除本地文件（未上传的）
  const removeLocalFile = useCallback((index: number) => {
    setLocalFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  // 上移/下移本地文件（控制上传后的追加顺序）
  const moveLocalFile = useCallback((index: number, direction: 'up' | 'down') => {
    setLocalFiles(prev => {
      const target = direction === 'up' ? index - 1 : index + 1
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }, [])

  // 从文件服务器删除物理文件（仅本站托管文件）
  const deletePhysicalFile = useCallback(async (url: string): Promise<boolean> => {
    if (!isInternalFileUrl(url)) return true
    const parsed = parseFileUrl(url)
    if (!parsed) return true
    try {
      const res = await fetchData(ENDPOINTS.FILE.DELETE, 'DELETE', {
        name: parsed.name,
        namespace: parsed.namespace,
        isDirectory: false
      })
      if (res?.code === API_CODE.SUCCESS) {
        return true
      }
      showAlert(ADMIN_ESSAY_LABELS.FILE_DELETE_FAIL)
      return false
    } catch (error) {
      console.error('文件删除失败:', error)
      showAlert(ADMIN_ESSAY_LABELS.FILE_DELETE_FAIL)
      return false
    }
  }, [fetchData])

  // 确认删除文件
  // 未入库（id===0）的本站文件立即从服务器删除；已入库文件仅从表单移除，保存随笔时由服务端回收
  const confirmFileDelete = useCallback(async (
    onRemoveUploaded: (index: number) => void,
    uploadedFiles: EssayFile[]
  ): Promise<boolean> => {
    if (!fileToDelete) return false

    const { index, isLocal } = fileToDelete

    if (isLocal) {
      removeLocalFile(index)
    } else {
      const file = uploadedFiles[index]
      if (file && file.id === 0 && isInternalFileUrl(file.url)) {
        try {
          await deletePhysicalFile(file.url)
        } catch (error) {
          console.error('文件删除失败:', error)
          showAlert(ADMIN_ESSAY_LABELS.FILE_DELETE_FAIL)
        }
      }
      onRemoveUploaded(index)
    }

    closeFileDeleteModal()
    return true
  }, [fileToDelete, removeLocalFile, closeFileDeleteModal, deletePhysicalFile])

  // 上传单个文件到服务器
  const uploadSingleFile = useCallback(async (file: File, fileType: FileType, namespace: string): Promise<EssayFile | null> => {
    const formData = new FormData()
    if (!file || !file.name || file.size <= 0) {
      throw new Error('无效的文件')
    }
    formData.append('namespace', namespace)
    formData.append('file', file)

    // 上传请求使用独立的超时时间，避免大文件/多文件上传时因全局10s超时误报失败
    const response = await apiClient({
      url: ENDPOINTS.FILE.UPLOAD,
      method: 'POST',
      data: formData,
      timeout: TIME.UPLOAD_TIMEOUT
    })

    const data = response.data
    if (response.status === 200) {
      const essayFile: EssayFile = {
        id: 0, // 服务器会分配ID
        url: data.url,
        urlType: fileType,
        urlDesc: null,
        isValid: true,
        createTime: new Date().toISOString(),
        name: file.name // 保存原始文件名用于展示
      }
      return essayFile
    }
    throw new Error(`文件上传失败: ${data?.message || '未知错误'}`)
  }, [])

  // 上传所有本地文件：成功的文件挂到随笔表单，失败的文件保留在本地列表等待重试
  const uploadAllFiles = useCallback(async (title: string): Promise<UploadResult> => {
    if (localFiles.length === 0) {
      return { succeeded: [], failed: [] }
    }

    const namespace = `${ESSAY_NAMESPACE}/${sanitizeTitleForPath(title)}`
    const succeeded: EssayFile[] = []
    const failedFiles: FileInfo[] = []
    const total = localFiles.length

    for (let i = 0; i < localFiles.length; i++) {
      const localFile = localFiles[i]
      setUploadProgress({ current: i + 1, total, fileName: localFile.file.name })
      try {
        const essayFile = await uploadSingleFile(localFile.file, localFile.type, namespace)
        if (essayFile) {
          succeeded.push(essayFile)
        }
      } catch (error) {
        console.error(`文件 ${localFile.file.name} 上传失败:`, error)
        failedFiles.push(localFile)
      }
    }

    setUploadProgress(null)
    setLocalFiles(failedFiles)
    return { succeeded, failed: failedFiles.map(f => f.file.name) }
  }, [localFiles, uploadSingleFile])

  // 清空本地文件
  const clearLocalFiles = useCallback(() => {
    setLocalFiles([])
    setUploadProgress(null)
  }, [])

  return {
    localFiles,
    deleteFileModalVisible,
    fileToDelete,
    uploadProgress,
    handleFileSelect,
    openFileDeleteModal,
    closeFileDeleteModal,
    confirmFileDelete,
    removeLocalFile,
    moveLocalFile,
    uploadAllFiles,
    clearLocalFiles
  }
}
