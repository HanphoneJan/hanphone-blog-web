import { FileImage, FileVideo, FileText, FileCode } from 'lucide-react'
import { PICTURE_BASE_URL } from '@/lib/api'
import type { FileType, EssayFile, FileCounts } from './types'

// 内容最大字数限制
export const MAX_CONTENT_LENGTH = 10000

// 随笔文件存储命名空间前缀（admin-file 上传根目录下）
export const ESSAY_NAMESPACE = 'blog/essay'

// 格式化日期
export const formatDate = (dateString: string): string => {
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
export const getFileType = (file: File): FileType => {
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

// 根据urlType获取文件类型图标组件
export const getFileIconByType = (urlType: FileType, fileName: string) => {
  if (urlType === 'IMAGE') {
    return FileImage
  } else if (urlType === 'VIDEO') {
    return FileVideo
  } else {
    if (fileName.endsWith('.md') || fileName.endsWith('.txt')) {
      return FileCode
    }
    return FileText
  }
}

// 统计各类文件数量
export const countFilesByType = (files: EssayFile[]): FileCounts => {
  return {
    images: files.filter(f => f.urlType === 'IMAGE').length,
    videos: files.filter(f => f.urlType === 'VIDEO').length,
    texts: files.filter(f => f.urlType === 'TEXT' || f.urlType === 'OTHER').length
  }
}

// 表单验证
export interface ValidationResult {
  isValid: boolean
  errors: { [key: string]: string }
}

export const validateEssayForm = (
  title: string,
  content: string,
  uploadedFileCount: number,
  localFileCount: number
): ValidationResult => {
  const errors: { [key: string]: string } = {}

  if (!title.trim()) {
    errors.title = '标题不能为空！'
  } else if (title.length > 100) {
    errors.title = '标题不超过100字！'
  }

  if (content.length > MAX_CONTENT_LENGTH) {
    errors.content = `内容不超过${MAX_CONTENT_LENGTH}字！`
  }

  // 至少需要有内容或文件
  const fileCount = uploadedFileCount + localFileCount

  if (!content.trim() && fileCount === 0) {
    errors.content = '内容和文件不能同时为空！'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// 获取文件名
export const getFileName = (file: EssayFile): string => {
  return file.name || file.url.split('/').pop() || `文件${file.id}`
}

// 将随笔标题转换为安全的存储目录名
export const sanitizeTitleForPath = (title: string): string => {
  const sanitized = title
    .replace(/[\\/:*?"<>|\x00-\x1f]/g, '')
    .replace(/\.{2,}/g, '')
    .trim()
    .slice(0, 60)
  return sanitized || '未命名'
}

// 根据URL扩展名推断文件类型
export const getFileTypeByUrl = (url: string): FileType => {
  try {
    const pathname = decodeURIComponent(new URL(url).pathname)
    const ext = pathname.slice(pathname.lastIndexOf('.') + 1).toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'avif', 'apng', 'ico'].includes(ext)) {
      return 'IMAGE'
    }
    if (['mp4', 'webm', 'mov', 'avi', 'mkv', 'mpeg', 'mpg', 'flv', 'wmv', 'm4v'].includes(ext)) {
      return 'VIDEO'
    }
    if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'md', 'txt', 'xls', 'xlsx', 'rtf'].includes(ext)) {
      return 'TEXT'
    }
    return 'OTHER'
  } catch {
    return 'OTHER'
  }
}

// 校验是否为合法的文件URL
export const isValidFileUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

// 从URL中提取显示用文件名
export const getUrlFileName = (url: string): string => {
  try {
    const pathname = decodeURIComponent(new URL(url).pathname)
    const name = pathname.split('/').filter(Boolean).pop() || ''
    return name || '外链文件'
  } catch {
    return '外链文件'
  }
}

// 判断URL是否为本站文件服务托管的文件（外链文件删除时无需调用文件服务）
export const isInternalFileUrl = (url: string): boolean => {
  return url.startsWith(PICTURE_BASE_URL)
}

// 从文件URL解析出删除所需的 namespace 与实际文件名
// 兼容整段编码（blog%2Fessay）与按段编码（blog/essay/标题）两种格式
export const parseFileUrl = (url: string): { namespace: string; name: string } | null => {
  try {
    const parsed = new URL(url)
    if (!url.startsWith(PICTURE_BASE_URL)) return null
    const segments = parsed.pathname
      .split('/')
      .filter(Boolean)
      .map(segment => decodeURIComponent(segment))
    if (segments.length < 2) return null
    const name = segments.pop() as string
    return { namespace: segments.join('/'), name }
  } catch {
    return null
  }
}
