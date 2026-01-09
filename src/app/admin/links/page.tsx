'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Trash2,
  X,
  Upload as UploadIcon,
  Loader2,
  AlertCircle,
  Search,
  Edit2,
  Save,
  Star
} from 'lucide-react'
import { ENDPOINTS } from '@/lib/api'
import apiClient from '@/lib/utils'
import { showAlert } from '@/lib/Alert'
import Image from 'next/image'
import Compressor from 'compressorjs'
import Link from 'next/link'

// 定义友链类型接口
interface FriendLink {
  id: number | null
  type: string
  name: string
  description: string
  link_url: string
  url: string
  avatar: string
  color: string
  recommend: boolean
  createTime?: string // 修改为字符串类型，因为toISOString()返回字符串
  inputVisible?: boolean
  inputValue?: string
  editingName?: boolean
  editingDescription?: boolean
  editingAvatar?: boolean
  editingLinkUrl?: boolean
  editingUrl?: boolean
  editingColor?: boolean
  tempName?: string
  tempDescription?: string
  tempAvatar?: string
  tempLinkUrl?: string
  tempUrl?: string
  tempColor?: string
}

// 定义友链类型选项接口
interface FriendLinkType {
  id: string
  name: string
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

const FriendLinkManagement = () => {
  // 状态管理
  const [friendLink, setFriendLink] = useState<FriendLink>({
    id: null,
    type: '',
    name: '',
    description: '',
    link_url: '',
    url: '',
    avatar: '',
    color: '',
    recommend: false,
    createTime: new Date().toISOString() // 添加默认创建时间
  })

  const [friendLinkList, setFriendLinkList] = useState<FriendLink[]>([])
  const [filteredList, setFilteredList] = useState<FriendLink[]>([]) // 筛选后的列表
  const [dialogImageUrl, setDialogImageUrl] = useState('')
  const [avatarInputMode, setAvatarInputMode] = useState<'upload' | 'url'>('upload') // 头像输入模式
  const [avatarUrl, setAvatarUrl] = useState('') // 头像URL输入
  const [formValues, setFormValues] = useState({
    name: '',
    description: '',
    link_url: '',
    url: '',
    type: '',
    color: ''
  })
  const [activeTab, setActiveTab] = useState('list')
  const [loading, setLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [updateRecommendLoading, setUpdateRecommendLoading] = useState<number | null>(null) // 添加推荐按钮加载状态

  // 本地输入状态管理
  const [localInputValues, setLocalInputValues] = useState<{
    [key: number]: {
      name?: string
      description?: string
      avatar?: string
      linkUrl?: string
      url?: string
      color?: string
    }
  }>({})

  // 筛选状态 - 仅保留类型筛选和新增名称搜索
  const [filters, setFilters] = useState({
    type: '', // 空字符串表示全部类型
    searchQuery: '' // 名称搜索关键词
  })

  // 类型选项
  const types: FriendLinkType[] = [
    { id: 'friend', name: '朋友' },
    { id: 'resource', name: '资源' },
    { id: 'tool', name: '工具' },
    { id: 'blog', name: '文章' },
    { id: 'other', name: '其他' }
  ]

  // 上传相关
  const uploadRef = useRef<HTMLInputElement>(null)
  const imageUploadRef = useRef<HTMLInputElement>(null)

  // 获取友链列表
  const getFriendLinkList = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetchData(ENDPOINTS.ADMIN.FRIENDLINKS)

      if (res.code === 200) {
        // 处理每个友链的额外状态
        const processedData = res.data.map((item: any) => ({
          ...item,
          // 确保基本字段有默认值
          name: item.name || '未命名友链',
          type: item.type || 'other',
          description: item.description || '暂无描述',
          link_url: item.link_url || '',
          url: item.url || '',
          avatar: item.avatar || '/default-avatar.png',
          color: item.color || '#1890ff',
          recommend: item.recommend || false, // 确保推荐状态有默认值
          createTime: item.createTime || new Date().toISOString(), // 添加创建时间字段
          inputVisible: false,
          inputValue: '',
          editingName: false,
          editingDescription: false,
          editingAvatar: false,
          editingLinkUrl: false,
          editingUrl: false,
          editingColor: false,
          // 临时字段也设置默认值
          tempName: item.name || '未命名友链',
          tempDescription: item.description || '暂无描述',
          tempAvatar: item.avatar || '/default-avatar.png',
          tempLinkUrl: item.link_url || '',
          tempUrl: item.url || '',
          tempColor: item.color || '#1890ff'
        }))
        setFriendLinkList(processedData)
        setFilteredList(processedData) // 初始筛选列表为全部数据
        // 重置本地输入状态
        setLocalInputValues({})
      } else {
        showAlert('获取友链列表失败')
      }
    } catch (error) {
      console.error('获取友链列表出错:', error)
      showAlert('获取友链列表失败')
    } finally {
      setLoading(false)
    }
  }, [])

  // 组件挂载时获取友链列表
  useEffect(() => {
    getFriendLinkList()
  }, [getFriendLinkList])

  // 筛选逻辑 - 基于类型和名称搜索
  useEffect(() => {
    let result = [...friendLinkList]

    // 按类型筛选
    if (filters.type) {
      result = result.filter(item => item.type === filters.type)
    }

    // 按名称搜索 - 不区分大小写
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      result = result.filter(item => item.name.toLowerCase().includes(query))
    }

    setFilteredList(result)
  }, [friendLinkList, filters])

  // 标签页切换处理
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    if (tab === 'list') {
      getFriendLinkList()
    }
  }

  // 筛选器变化处理
  const handleFilterChange = (name: string, value: any) => {
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  // 重置筛选条件
  const resetFilters = () => {
    setFilters({
      type: '',
      searchQuery: ''
    })
  }

  // 表单输入变化处理
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormValues(prev => ({ ...prev, [name]: value }))
  }

  // 头像URL输入变化处理
  const handleAvatarUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarUrl(e.target.value)
    setDialogImageUrl(e.target.value)
  }

  // 切换头像输入模式
  const toggleAvatarInputMode = (mode: 'upload' | 'url') => {
    setAvatarInputMode(mode)
    if (mode === 'upload') {
      setDialogImageUrl('')
      setAvatarUrl('')
    } else {
      setDialogImageUrl(avatarUrl)
    }
  }

  // 图片上传相关 - 带压缩并保持原始文件名
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
          setLoading(true)

          // 将压缩后的blob转换为File对象，并保持原始文件名（修改扩展名为jpeg）
          const compressedFile = new File([compressedResult], newFileName, {
            type: 'image/jpeg',
            lastModified: Date.now()
          })

          const formData = new FormData()
          formData.append('namespace', 'blog/friendlink')
          formData.append('file', compressedFile)

          const data = await fetchData(ENDPOINTS.FILE.UPLOAD, 'POST', formData)
          if (data.url) {
            setDialogImageUrl(data.url)
            showAlert('图片压缩并上传成功')
          } else {
            showAlert('图片上传失败')
          }
        } catch (error) {
          console.error('图片上传出错:', error)
          showAlert('图片上传失败')
        } finally {
          setLoading(false)
          if (uploadRef.current) uploadRef.current.value = ''
        }
      },
      error: err => {
        console.error('图片压缩失败:', err)
        showAlert('图片压缩失败，请重试')
        setLoading(false)
        if (uploadRef.current) uploadRef.current.value = ''
      }
    })
  }

  const handleRemoveImage = () => {
    setDialogImageUrl('')
    setAvatarUrl('')
  }

  // 发布友链
  const publishFriendLink = async () => {
    if (!formValues.name.trim()) return showAlert('请输入友链名称')
    if (!formValues.type.trim()) return showAlert('请选择友链类型')
    if (!formValues.url.trim()) return showAlert('请输入友链链接')

    try {
      setLoading(true)
      const friendLinkData: FriendLink = {
        ...friendLink,
        avatar: dialogImageUrl,
        name: formValues.name,
        description: formValues.description,
        link_url: formValues.link_url,
        url: formValues.url,
        type: formValues.type,
        color: formValues.color,
        recommend: false, // 新友链默认不推荐
        createTime: new Date().toISOString() // 添加创建时间
      }

      const res = await fetchData(ENDPOINTS.ADMIN.FRIENDLINK, 'POST', {
        friendLink: friendLinkData
      })

      if (res.code === 200) {
        showAlert('友链发布成功')
        setFormValues({
          name: '',
          description: '',
          link_url: '',
          url: '',
          type: '',
          color: ''
        })
        setDialogImageUrl('')
        setAvatarUrl('')
        setActiveTab('list')
        getFriendLinkList()
      } else {
        showAlert(res.message || '友链发布失败')
      }
    } catch (error) {
      console.error('发布友链出错:', error)
      showAlert('友链发布失败')
    } finally {
      setLoading(false)
    }
  }

  // 删除友链相关
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return

    try {
      setLoading(true)
      const res = await fetchData(`${ENDPOINTS.ADMIN.FRIENDLINK}/${deleteConfirm}/delete`, 'GET')

      if (res.code === 200) {
        showAlert('友链删除成功')
        getFriendLinkList()
      } else {
        showAlert(res.message || '友链删除失败')
      }
    } catch (error) {
      console.error('删除友链出错:', error)
      showAlert('友链删除失败')
    } finally {
      setLoading(false)
      setDeleteConfirm(null)
    }
  }

  // 更新友链
  const updateFriendLink = async (updatedFriendLink: FriendLink) => {
    try {
      setLoading(true)
      const res = await fetchData(ENDPOINTS.ADMIN.FRIENDLINK, 'POST', {
        friendLink: updatedFriendLink
      })

      if (res.code === 200) {
        showAlert('友链更新成功')
      } else {
        showAlert(res.message || '友链更新失败')
        getFriendLinkList()
      }
    } catch (error) {
      console.error('更新友链出错:', error)
      showAlert('友链更新失败')
      getFriendLinkList()
    } finally {
      setLoading(false)
    }
  }

  // 更新友链类型
  const handleTypeChange = (friendLinkId: number | null, type: string) => {
    const updatedList: FriendLink[] = friendLinkList.map(item =>
      item.id === friendLinkId ? { ...item, type } : item
    )
    setFriendLinkList(updatedList)

    const updatedFriendLink = updatedList.find(item => item.id === friendLinkId)
    if (updatedFriendLink) {
      updateFriendLink(updatedFriendLink)
    }
  }

  // 本地输入处理函数
  const handleLocalInputChange = (friendLinkId: number, field: string, value: string) => {
    setLocalInputValues(prev => ({
      ...prev,
      [friendLinkId]: {
        ...prev[friendLinkId],
        [field]: value
      }
    }))
  }

  // 编辑友链名称
  const handleEditName = (friendLinkId: number | null) => {
    if (!friendLinkId) return
    const friendLink = friendLinkList.find(item => item.id === friendLinkId)
    if (!friendLink) return

    const updatedList: FriendLink[] = friendLinkList.map(item =>
      item.id === friendLinkId ? { ...item, editingName: true } : item
    )
    setFriendLinkList(updatedList)

    // 初始化本地输入值
    setLocalInputValues(prev => ({
      ...prev,
      [friendLinkId]: {
        ...prev[friendLinkId],
        name: friendLink.name
      }
    }))
  }

  const handleSaveName = (friendLinkId: number | null) => {
    if (!friendLinkId) return
    const localName = localInputValues[friendLinkId]?.name

    const updatedList: FriendLink[] = friendLinkList.map(item =>
      item.id === friendLinkId
        ? { ...item, name: localName || item.name, editingName: false }
        : item
    )
    setFriendLinkList(updatedList)

    const updatedFriendLink = updatedList.find(item => item.id === friendLinkId)
    if (updatedFriendLink) {
      updateFriendLink(updatedFriendLink)
    }
  }

  const handleCancelEditName = (friendLinkId: number | null) => {
    const updatedList: FriendLink[] = friendLinkList.map(item =>
      item.id === friendLinkId ? { ...item, editingName: false } : item
    )
    setFriendLinkList(updatedList)
  }

  // 编辑友链描述
  const handleEditDescription = (friendLinkId: number | null) => {
    if (!friendLinkId) return
    const friendLink = friendLinkList.find(item => item.id === friendLinkId)
    if (!friendLink) return

    const updatedList: FriendLink[] = friendLinkList.map(item =>
      item.id === friendLinkId ? { ...item, editingDescription: true } : item
    )
    setFriendLinkList(updatedList)

    // 初始化本地输入值
    setLocalInputValues(prev => ({
      ...prev,
      [friendLinkId]: {
        ...prev[friendLinkId],
        description: friendLink.description
      }
    }))
  }

  const handleSaveDescription = (friendLinkId: number | null) => {
    if (!friendLinkId) return
    const localDescription = localInputValues[friendLinkId]?.description

    const updatedList: FriendLink[] = friendLinkList.map(item =>
      item.id === friendLinkId
        ? { ...item, description: localDescription || item.description, editingDescription: false }
        : item
    )
    setFriendLinkList(updatedList)

    const updatedFriendLink = updatedList.find(item => item.id === friendLinkId)
    if (updatedFriendLink) {
      updateFriendLink(updatedFriendLink)
    }
  }

  const handleCancelEditDescription = (friendLinkId: number | null) => {
    const updatedList: FriendLink[] = friendLinkList.map(item =>
      item.id === friendLinkId ? { ...item, editingDescription: false } : item
    )
    setFriendLinkList(updatedList)
  }

  // 编辑友链头像
  const handleEditAvatar = (friendLinkId: number | null) => {
    if (!friendLinkId) return
    const friendLink = friendLinkList.find(item => item.id === friendLinkId)
    if (!friendLink) return

    const updatedList: FriendLink[] = friendLinkList.map(item =>
      item.id === friendLinkId ? { ...item, editingAvatar: true } : item
    )
    setFriendLinkList(updatedList)

    // 初始化本地输入值
    setLocalInputValues(prev => ({
      ...prev,
      [friendLinkId]: {
        ...prev[friendLinkId],
        avatar: friendLink.avatar
      }
    }))
  }

  const handleSaveAvatar = (friendLinkId: number | null) => {
    if (!friendLinkId) return
    const localAvatar = localInputValues[friendLinkId]?.avatar

    const updatedList: FriendLink[] = friendLinkList.map(item =>
      item.id === friendLinkId
        ? { ...item, avatar: localAvatar || item.avatar, editingAvatar: false }
        : item
    )
    setFriendLinkList(updatedList)

    const updatedFriendLink = updatedList.find(item => item.id === friendLinkId)
    if (updatedFriendLink) {
      updateFriendLink(updatedFriendLink)
    }
  }

  const handleCancelEditAvatar = (friendLinkId: number | null) => {
    const updatedList: FriendLink[] = friendLinkList.map(item =>
      item.id === friendLinkId ? { ...item, editingAvatar: false } : item
    )
    setFriendLinkList(updatedList)
  }

  // 编辑友链地址
  const handleEditLinkUrl = (friendLinkId: number | null) => {
    if (!friendLinkId) return
    const friendLink = friendLinkList.find(item => item.id === friendLinkId)
    if (!friendLink) return

    const updatedList: FriendLink[] = friendLinkList.map(item =>
      item.id === friendLinkId ? { ...item, editingLinkUrl: true } : item
    )
    setFriendLinkList(updatedList)

    // 初始化本地输入值
    setLocalInputValues(prev => ({
      ...prev,
      [friendLinkId]: {
        ...prev[friendLinkId],
        linkUrl: friendLink.link_url
      }
    }))
  }

  const handleSaveLinkUrl = (friendLinkId: number | null) => {
    if (!friendLinkId) return
    const localLinkUrl = localInputValues[friendLinkId]?.linkUrl

    const updatedList: FriendLink[] = friendLinkList.map(item =>
      item.id === friendLinkId
        ? { ...item, link_url: localLinkUrl || item.link_url, editingLinkUrl: false }
        : item
    )
    setFriendLinkList(updatedList)

    const updatedFriendLink = updatedList.find(item => item.id === friendLinkId)
    if (updatedFriendLink) {
      updateFriendLink(updatedFriendLink)
    }
  }

  const handleCancelEditLinkUrl = (friendLinkId: number | null) => {
    const updatedList: FriendLink[] = friendLinkList.map(item =>
      item.id === friendLinkId ? { ...item, editingLinkUrl: false } : item
    )
    setFriendLinkList(updatedList)
  }

  // 编辑友链链接
  const handleEditUrl = (friendLinkId: number | null) => {
    if (!friendLinkId) return
    const friendLink = friendLinkList.find(item => item.id === friendLinkId)
    if (!friendLink) return

    const updatedList: FriendLink[] = friendLinkList.map(item =>
      item.id === friendLinkId ? { ...item, editingUrl: true } : item
    )
    setFriendLinkList(updatedList)

    // 初始化本地输入值
    setLocalInputValues(prev => ({
      ...prev,
      [friendLinkId]: {
        ...prev[friendLinkId],
        url: friendLink.url
      }
    }))
  }

  const handleSaveUrl = (friendLinkId: number | null) => {
    if (!friendLinkId) return
    const localUrl = localInputValues[friendLinkId]?.url

    const updatedList: FriendLink[] = friendLinkList.map(item =>
      item.id === friendLinkId ? { ...item, url: localUrl || item.url, editingUrl: false } : item
    )
    setFriendLinkList(updatedList)

    const updatedFriendLink = updatedList.find(item => item.id === friendLinkId)
    if (updatedFriendLink) {
      updateFriendLink(updatedFriendLink)
    }
  }

  const handleCancelEditUrl = (friendLinkId: number | null) => {
    const updatedList: FriendLink[] = friendLinkList.map(item =>
      item.id === friendLinkId ? { ...item, editingUrl: false } : item
    )
    setFriendLinkList(updatedList)
  }

  // 编辑友链颜色
  const handleEditColor = (friendLinkId: number | null) => {
    if (!friendLinkId) return
    const friendLink = friendLinkList.find(item => item.id === friendLinkId)
    if (!friendLink) return

    const updatedList: FriendLink[] = friendLinkList.map(item =>
      item.id === friendLinkId ? { ...item, editingColor: true } : item
    )
    setFriendLinkList(updatedList)

    // 初始化本地输入值
    setLocalInputValues(prev => ({
      ...prev,
      [friendLinkId]: {
        ...prev[friendLinkId],
        color: friendLink.color
      }
    }))
  }

  const handleSaveColor = (friendLinkId: number | null) => {
    if (!friendLinkId) return
    const localColor = localInputValues[friendLinkId]?.color

    const updatedList: FriendLink[] = friendLinkList.map(item =>
      item.id === friendLinkId
        ? { ...item, color: localColor || item.color, editingColor: false }
        : item
    )
    setFriendLinkList(updatedList)

    const updatedFriendLink = updatedList.find(item => item.id === friendLinkId)
    if (updatedFriendLink) {
      updateFriendLink(updatedFriendLink)
    }
  }

  const handleCancelEditColor = (friendLinkId: number | null) => {
    const updatedList: FriendLink[] = friendLinkList.map(item =>
      item.id === friendLinkId ? { ...item, editingColor: false } : item
    )
    setFriendLinkList(updatedList)
  }

  // 处理图片上传
  const handleImageFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    friendLinkId: number | null
  ) => {
    if (!e.target.files?.[0] || !friendLinkId) return

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
          setLoading(true)

          // 将压缩后的blob转换为File对象，并保持原始文件名（修改扩展名为jpeg）
          const compressedFile = new File([compressedResult], newFileName, {
            type: 'image/jpeg',
            lastModified: Date.now()
          })

          const formData = new FormData()
          formData.append('namespace', 'blog/friendlink')
          formData.append('file', compressedFile)

          const data = await fetchData(ENDPOINTS.FILE.UPLOAD, 'POST', formData)
          if (data.url) {
            // 更新本地输入状态
            setLocalInputValues(prev => ({
              ...prev,
              [friendLinkId]: {
                ...prev[friendLinkId],
                avatar: data.url
              }
            }))
            showAlert('图片压缩并上传成功')
          } else {
            showAlert('图片上传失败')
          }
        } catch (error) {
          console.error('图片上传出错:', error)
          showAlert('图片上传失败')
        } finally {
          setLoading(false)
          if (imageUploadRef.current) imageUploadRef.current.value = ''
        }
      },
      error: err => {
        console.error('图片压缩失败:', err)
        showAlert('图片压缩失败，请重试')
        setLoading(false)
        if (imageUploadRef.current) imageUploadRef.current.value = ''
      }
    })
  }

  // 推荐功能
  const toggleRecommend = async (friendLink: FriendLink) => {
    try {
      // 设置当前操作的友链ID为加载状态
      setUpdateRecommendLoading(friendLink.id)

      // 发送推荐状态更新请求
      const response = await fetchData(ENDPOINTS.ADMIN.FRIENDLINK_RECOMMEND, 'POST', {
        friendLinkId: friendLink.id,
        recommend: !friendLink.recommend
      })

      if (response.code === 200) {
        // 本地更新推荐状态
        setFriendLinkList(prev =>
          prev.map(item =>
            item.id === friendLink.id ? { ...item, recommend: !friendLink.recommend } : item
          )
        )
        showAlert(friendLink.recommend ? '取消推荐成功' : '推荐成功')
      } else {
        showAlert(friendLink.recommend ? '取消推荐失败' : '推荐失败')
      }
    } catch (error) {
      console.error('推荐状态更新失败:', error)
      showAlert('操作失败，请重试')
    } finally {
      // 清除加载状态
      setUpdateRecommendLoading(null)
    }
  }

  // 格式化日期显示
  const formatDate = (dateString?: string) => {
    if (!dateString) return '未知时间'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return '无效日期'
      console.error('日期格式化错误:', error)
    }
  }

  return (
    <div className="font-sans min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-blue-50 text-slate-800 dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-200 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(50,100,200,0.1)_0%,transparent_40%),radial-gradient(circle_at_80%_80%,rgba(80,120,250,0.1)_0%,transparent_40%)] dark:opacity-100 opacity-0"></div>

      <main className="flex-1 w-full max-w-7xl mx-auto lg:px-2 lg:py-2 relative z-10">
        {/* 主内容区卡片 */}
        <div className="bg-white/80 backdrop-blur-sm lg:rounded-xl shadow-sm min-h-[100vh] border border-slate-200/50 overflow-hidden dark:bg-slate-800/40 dark:border-slate-700/50">
          {/* 标签页导航 */}
          <div className="flex border-b border-slate-200/50 dark:border-slate-700/50">
            <button
              onClick={() => handleTabChange('publish')}
              className={`flex-1 py-2 lg:py-3 px-6 text-center transition-colors ${
                activeTab === 'publish'
                  ? 'text-blue-600 border-b-2 border-blue-500 dark:text-blue-400 dark:border-blue-500'
                  : 'text-slate-500 hover:text-slate-700 border-b-2 border-transparent dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              发布友链
            </button>
            <button
              onClick={() => handleTabChange('list')}
              className={`flex-1 py-2 lg:py-3 px-6 text-center transition-colors ${
                activeTab === 'list'
                  ? 'text-blue-600 border-b-2 border-blue-500 dark:text-blue-400 dark:border-blue-500'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              友链列表
            </button>
          </div>

          {/* 发布友链内容 */}
          {activeTab === 'publish' && (
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="block text-sm text-slate-700 dark:text-slate-300">
                  友链名称 <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formValues.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
                  placeholder="请输入友链名称"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-slate-700 dark:text-slate-300">
                  友链类型 <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <select
                  name="type"
                  value={formValues.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-blue-500"
                >
                  <option value="">请选择类型</option>
                  {types.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-slate-700 dark:text-slate-300">友链描述</label>
                <textarea
                  name="description"
                  value={formValues.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
                  placeholder="请输入友链描述"
                ></textarea>
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-slate-700 dark:text-slate-300">友链头像</label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => toggleAvatarInputMode('upload')}
                    className={`px-3 py-1 rounded text-sm ${
                      avatarInputMode === 'upload'
                        ? 'bg-blue-500 text-white dark:bg-blue-600'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    上传图片
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleAvatarInputMode('url')}
                    className={`px-3 py-1 rounded text-sm ${
                      avatarInputMode === 'url'
                        ? 'bg-blue-500 text-white dark:bg-blue-600'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    图片URL
                  </button>
                </div>

                {avatarInputMode === 'upload' ? (
                  <div className="flex items-center gap-4 flex-wrap">
                    <div
                      className="w-40 h-40 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors dark:border-slate-700"
                      onClick={() => uploadRef.current?.click()}
                    >
                      {dialogImageUrl ? (
                        <div className="relative w-full h-full rounded-lg overflow-hidden">
                          <Image
                            src={dialogImageUrl}
                            alt="友链头像预览"
                            fill
                            style={{ objectFit: 'cover' }}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        </div>
                      ) : (
                        <div className="text-center">
                          <UploadIcon className="h-8 w-8 mx-auto text-slate-500 dark:text-slate-400" />
                          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">上传</p>
                        </div>
                      )}
                    </div>

                    {dialogImageUrl && (
                      <div className="flex gap-2">
                        <button
                          onClick={handleRemoveImage}
                          className="px-3 py-1.5 rounded-md border border-slate-300 bg-white/60 text-slate-700 hover:bg-slate-100 transition-colors text-sm flex items-center gap-1 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          <X className="h-3.5 w-3.5" />
                          移除
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={avatarUrl}
                      onChange={handleAvatarUrlChange}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
                      placeholder="请输入图片URL"
                    />
                    {avatarUrl && (
                      <div className="relative w-40 h-40 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700">
                        <Image
                          src={avatarUrl}
                          alt="友链头像预览"
                          fill
                          style={{ objectFit: 'cover' }}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                    )}
                  </div>
                )}

                <input
                  ref={uploadRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
                  图片将自动压缩为JPEG格式，最大尺寸1200x1200px，保持原始文件名
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-slate-700 dark:text-slate-300">友链地址</label>
                <input
                  type="text"
                  name="link_url"
                  value={formValues.link_url}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
                  placeholder="请输入友链地址"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-slate-700 dark:text-slate-300">
                  友链链接 <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="url"
                  value={formValues.url}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
                  placeholder="请输入友链链接"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-slate-700 dark:text-slate-300">友链颜色</label>
                <input
                  type="text"
                  name="color"
                  value={formValues.color}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
                  placeholder="请输入友链颜色（如：#1890ff）"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={publishFriendLink}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors flex items-center gap-2 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  发布友链
                </button>
              </div>
            </div>
          )}

          {/* 友链列表内容 */}
          {activeTab === 'list' && (
            <div className="px-0 md:px-6 md:py-3 overflow-x-auto">
              {/* 筛选区域 - 包含类型筛选和名称搜索 */}
              <div className="md:mb-4 p-3 bg-white/60 lg:rounded-lg border border-slate-200/50 dark:bg-slate-900/40 dark:border-slate-700/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs text-slate-500 dark:text-slate-400">友链类型</label>
                    <select
                      value={filters.type}
                      onChange={e => handleFilterChange('type', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-md border border-slate-300 bg-white text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-blue-500"
                    >
                      <option value="">全部类型</option>
                      {types.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="block text-xs text-slate-500 dark:text-slate-400">名称搜索</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={filters.searchQuery}
                        onChange={e => handleFilterChange('searchQuery', e.target.value)}
                        placeholder="输入友链名称关键词搜索..."
                        className="w-full pl-9 pr-3 py-1.5 rounded-md border border-slate-300 bg-white text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-blue-500"
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400" />
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex justify-between items-center">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    共 {filteredList.length} 个友链（筛选自 {friendLinkList.length} 个友链）
                  </div>

                  <button
                    onClick={resetFilters}
                    className="px-3 py-1 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    重置筛选
                  </button>
                </div>
              </div>

              {loading ? (
                // 加载状态骨架屏
                <div className="space-y-3 h-[400px] flex flex-col justify-center">
                  {[1, 2, 3, 4, 5].map(item => (
                    <div key={item} className="animate-pulse bg-slate-200/50 rounded-lg h-48 dark:bg-slate-700/50"></div>
                  ))}
                </div>
              ) : filteredList.length > 0 ? (
                <div className="space-y-3">
                  {filteredList.map((friendLink, index) => {
                    const friendLinkId = friendLink.id
                    const localValues = friendLinkId ? localInputValues[friendLinkId] : {}

                    return (
                      <div
                        key={friendLink.id}
                        className="bg-white/60 border border-slate-200/50 lg:rounded-lg p-3 hover:bg-slate-100/80 transition-all duration-300 dark:bg-slate-900/60 dark:border-slate-700/50 dark:hover:bg-slate-800/80"
                      >
                        {/* 响应式布局：头像占据左侧3列，内容占据右侧9列 */}
                        <div className="grid grid-cols-12 gap-3">
                          {/* 头像区域 - 在移动端占据全宽，桌面端占据3列，调整高度 */}
                          <div className="col-span-12 md:col-span-3 lg:col-span-3">
                            <div className="flex flex-col items-center md:items-start">
                              <p className="text-xs sm:text-sm text-slate-500 mb-1 self-start dark:text-slate-400">
                                友链头像
                              </p>
                              {friendLink.editingAvatar ? (
                                <div className="w-full space-y-2">
                                  <div className="relative w-full h-24 md:h-28 rounded-lg overflow-hidden">
                                    <Image
                                      src={localValues.avatar || friendLink.avatar}
                                      alt={friendLink.name}
                                      fill
                                      style={{ objectFit: 'cover' }}
                                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <input
                                      value={localValues.avatar || ''}
                                      onChange={e =>
                                        friendLinkId &&
                                        handleLocalInputChange(
                                          friendLinkId,
                                          'avatar',
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 rounded border border-slate-300 bg-white text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-blue-500"
                                      placeholder="头像URL"
                                    />
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => imageUploadRef.current?.click()}
                                        className="flex-1 px-2 py-1 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors text-sm flex items-center justify-center gap-1 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                      >
                                        <UploadIcon className="h-3 w-3" />
                                        上传
                                      </button>
                                      <button
                                        onClick={() => handleSaveAvatar(friendLink.id)}
                                        className="px-2 py-1 rounded bg-green-500 text-white hover:bg-green-600 transition-colors text-sm dark:bg-green-600 dark:hover:bg-green-500"
                                      >
                                        保存
                                      </button>
                                      <button
                                        onClick={() => handleCancelEditAvatar(friendLink.id)}
                                        className="px-2 py-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors text-sm dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                                      >
                                        取消
                                      </button>
                                    </div>
                                  </div>
                                  <input
                                    ref={imageUploadRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={e => handleImageFileChange(e, friendLink.id)}
                                    className="hidden"
                                  />
                                </div>
                              ) : (
                                <div className="relative group w-full">
                                  <div className="relative w-full h-24 md:h-28 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700">
                                    <Image
                                      src={friendLink.avatar || '/default-avatar.png'}
                                      alt={friendLink.name}
                                      fill
                                      style={{ objectFit: 'cover' }}
                                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                  </div>
                                  <button
                                    onClick={() => handleEditAvatar(friendLink.id)}
                                    className="absolute top-2 right-2 p-1 rounded-full bg-white/80 text-slate-600 hover:bg-white hover:text-slate-700 transition-colors opacity-0 group-hover:opacity-100 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                                    title="编辑头像"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 内容区域 - 在移动端占据全宽，桌面端占据9列 */}
                          <div className="col-span-12 md:col-span-9 lg:col-span-9">
                            <div className="space-y-3">
                              {/* 第一行：名称和类型 */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* 友链名称 */}
                                <div className="space-y-1">
                                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">友链名称</p>
                                  {friendLink.editingName ? (
                                    <div className="flex gap-1">
                                      <input
                                        value={localValues.name || ''}
                                        onChange={e =>
                                          friendLinkId &&
                                          handleLocalInputChange(
                                            friendLinkId,
                                            'name',
                                            e.target.value
                                          )
                                        }
                                        className="flex-1 px-2 py-1 rounded border border-slate-300 bg-white text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-blue-500"
                                      />
                                      <button
                                        onClick={() => handleSaveName(friendLink.id)}
                                        className="px-2 py-1 rounded bg-green-500 text-white hover:bg-green-600 transition-colors text-sm dark:bg-green-600 dark:hover:bg-green-500"
                                      >
                                        <Save className="h-3 w-3" />
                                      </button>
                                      <button
                                        onClick={() => handleCancelEditName(friendLink.id)}
                                        className="px-2 py-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors text-sm dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 group">
                                      <h3 className="text-base sm:text-lg font-medium text-slate-800 truncate dark:text-slate-200">
                                        {friendLink.name}
                                      </h3>
                                      <button
                                        onClick={() => handleEditName(friendLink.id)}
                                        className="p-1 rounded text-slate-500 hover:text-slate-700 transition-colors opacity-0 group-hover:opacity-100 dark:text-slate-400 dark:hover:text-slate-300"
                                        title="编辑名称"
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* 友链类型 */}
                                <div className="space-y-1">
                                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">友链类型</p>
                                  <select
                                    value={friendLink.type}
                                    onChange={e => handleTypeChange(friendLink.id, e.target.value)}
                                    className="w-full px-2 py-1 rounded border border-slate-300 bg-white text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-blue-500"
                                  >
                                    {types.map(type => (
                                      <option key={type.id} value={type.id}>
                                        {type.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              {/* 第二行：描述和地址 */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* 友链描述 */}
                                <div className="space-y-1">
                                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">友链描述</p>
                                  {friendLink.editingDescription ? (
                                    <div className="space-y-1">
                                      <textarea
                                        value={localValues.description || '暂无'}
                                        onChange={e =>
                                          friendLinkId &&
                                          handleLocalInputChange(
                                            friendLinkId,
                                            'description',
                                            e.target.value
                                          )
                                        }
                                        rows={2}
                                        className="w-full px-2 py-1 rounded border border-slate-300 bg-white text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-blue-500"
                                      />
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() => handleSaveDescription(friendLink.id)}
                                          className="px-2 py-1 rounded bg-green-500 text-white hover:bg-green-600 transition-colors text-sm dark:bg-green-600 dark:hover:bg-green-500"
                                        >
                                          保存
                                        </button>
                                        <button
                                          onClick={() => handleCancelEditDescription(friendLink.id)}
                                          className="px-2 py-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors text-sm dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                                        >
                                          取消
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="group">
                                      <p className="text-sm text-slate-700 line-clamp-2 dark:text-slate-300">
                                        {friendLink.description}
                                      </p>
                                      <button
                                        onClick={() => handleEditDescription(friendLink.id)}
                                        className="mt-1 p-1 rounded text-slate-500 hover:text-slate-700 transition-colors opacity-0 group-hover:opacity-100 dark:text-slate-400 dark:hover:text-slate-300"
                                        title="编辑描述"
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* 友链地址 */}
                                <div className="space-y-1">
                                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">友链地址</p>
                                  {friendLink.editingLinkUrl ? (
                                    <div className="space-y-1">
                                      <input
                                        value={localValues.linkUrl}
                                        onChange={e =>
                                          friendLinkId &&
                                          handleLocalInputChange(
                                            friendLinkId,
                                            'linkUrl',
                                            e.target.value
                                          )
                                        }
                                        className="w-full px-2 py-1 rounded border border-slate-300 bg-white text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-blue-500"
                                      />
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() => handleSaveLinkUrl(friendLink.id)}
                                          className="px-2 py-1 rounded bg-green-500 text-white hover:bg-green-600 transition-colors text-sm dark:bg-green-600 dark:hover:bg-green-500"
                                        >
                                          保存
                                        </button>
                                        <button
                                          onClick={() => handleCancelEditLinkUrl(friendLink.id)}
                                          className="px-2 py-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors text-sm dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                                        >
                                          取消
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 group">
                                      <Link
                                        href={friendLink.link_url}
                                        target="_blank"
                                        rel="noopener"
                                        className="text-sm text-blue-600 hover:text-blue-700 truncate dark:text-blue-400 dark:hover:text-blue-300"
                                      >
                                        {friendLink.link_url || '暂无'}
                                      </Link>
                                      <button
                                        onClick={() => handleEditLinkUrl(friendLink.id)}
                                        className="p-1 rounded text-slate-500 hover:text-slate-700 transition-colors opacity-0 group-hover:opacity-100 dark:text-slate-400 dark:hover:text-slate-300"
                                        title="编辑地址"
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* 第三行：链接和颜色 */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* 友链链接 */}
                                <div className="space-y-1">
                                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">友链链接</p>
                                  {friendLink.editingUrl ? (
                                    <div className="space-y-1">
                                      <input
                                        value={localValues.url || ''}
                                        onChange={e =>
                                          friendLinkId &&
                                          handleLocalInputChange(
                                            friendLinkId,
                                            'url',
                                            e.target.value
                                          )
                                        }
                                        className="w-full px-2 py-1 rounded border border-slate-300 bg-white text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-blue-500"
                                      />
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() => handleSaveUrl(friendLink.id)}
                                          className="px-2 py-1 rounded bg-green-500 text-white hover:bg-green-600 transition-colors text-sm dark:bg-green-600 dark:hover:bg-green-500"
                                        >
                                          保存
                                        </button>
                                        <button
                                          onClick={() => handleCancelEditUrl(friendLink.id)}
                                          className="px-2 py-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors text-sm dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                                        >
                                          取消
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 group">
                                      <Link
                                        href={friendLink.url}
                                        target="_blank"
                                        rel="noopener"
                                        className="text-sm text-blue-600 hover:text-blue-700 truncate dark:text-blue-400 dark:hover:text-blue-300"
                                      >
                                        {friendLink.url}
                                      </Link>
                                      <button
                                        onClick={() => handleEditUrl(friendLink.id)}
                                        className="p-1 rounded text-slate-500 hover:text-slate-700 transition-colors opacity-0 group-hover:opacity-100 dark:text-slate-400 dark:hover:text-slate-300"
                                        title="编辑链接"
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* 友链颜色 */}
                                <div className="space-y-1">
                                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">友链颜色</p>
                                  {friendLink.editingColor ? (
                                    <div className="space-y-1">
                                      <input
                                        value={localValues.color || ''}
                                        onChange={e =>
                                          friendLinkId &&
                                          handleLocalInputChange(
                                            friendLinkId,
                                            'color',
                                            e.target.value
                                          )
                                        }
                                        className="w-full px-2 py-1 rounded border border-slate-300 bg-white text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-blue-500"
                                      />
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() => handleSaveColor(friendLink.id)}
                                          className="px-2 py-1 rounded bg-green-500 text-white hover:bg-green-600 transition-colors text-sm dark:bg-green-600 dark:hover:bg-green-500"
                                        >
                                          保存
                                        </button>
                                        <button
                                          onClick={() => handleCancelEditColor(friendLink.id)}
                                          className="px-2 py-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors text-sm dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                                        >
                                          取消
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 group">
                                      <div className="flex items-center gap-1">
                                        <div
                                          className="w-5 h-5 rounded-full border border-slate-400 dark:border-slate-600"
                                          style={{ backgroundColor: friendLink.color || '#1890ff' }}
                                        ></div>
                                        <span className="text-sm text-slate-700 dark:text-slate-300">
                                          {friendLink.color || '#1890ff'}
                                        </span>
                                      </div>
                                      <button
                                        onClick={() => handleEditColor(friendLink.id)}
                                        className="p-1 rounded text-slate-500 hover:text-slate-700 transition-colors opacity-0 group-hover:opacity-100 dark:text-slate-400 dark:hover:text-slate-300"
                                        title="编辑颜色"
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* 第四行：创建时间和操作按钮 */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* 创建时间 */}
                                <div className="space-y-1">
                                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">创建时间</p>
                                  <p className="text-sm text-slate-700 dark:text-slate-300">
                                    {formatDate(friendLink.createTime)}
                                  </p>
                                </div>

                                {/* 操作按钮 */}
                                <div className="flex items-end justify-end gap-2">
                                  {/* 推荐按钮 */}
                                  <button
                                    onClick={() => toggleRecommend(friendLink)}
                                    disabled={updateRecommendLoading === friendLink.id}
                                    className={`px-3 py-1 rounded transition-colors text-sm flex items-center gap-1 ${
                                      friendLink.recommend
                                        ? 'bg-yellow-100/60 text-yellow-600 hover:bg-yellow-100/80 dark:bg-yellow-500/20 dark:text-yellow-400 dark:hover:bg-yellow-500/30'
                                        : 'bg-slate-200/60 text-slate-500 hover:bg-slate-200/80 dark:bg-slate-700/50 dark:text-slate-400 dark:hover:bg-slate-700/80'
                                    }`}
                                    title={friendLink.recommend ? '取消推荐' : '推荐友链'}
                                  >
                                    {updateRecommendLoading === friendLink.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Star
                                        className={`h-3 w-3 ${
                                          friendLink.recommend ? 'fill-current' : ''
                                        }`}
                                      />
                                    )}
                                    {friendLink.recommend ? '已推荐' : '推荐'}
                                  </button>

                                  <button
                                    onClick={() => setDeleteConfirm(friendLink.id)}
                                    className="px-3 py-1 rounded bg-red-100/60 text-red-600 hover:bg-red-100/80 transition-colors text-sm flex items-center gap-1 dark:bg-red-600/20 dark:text-red-400 dark:hover:bg-red-600/30"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    删除
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12 min-h-[90vh]">
                  <AlertCircle className="mx-auto h-12 w-12 text-slate-500 mb-4 dark:text-slate-400" />
                  <p className="text-slate-500 dark:text-slate-400">暂无友链数据</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* 删除确认对话框 */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 rounded-lg p-6 max-w-sm w-full border border-slate-200/50 dark:bg-slate-800 dark:border-slate-700">
            <h3 className="text-lg font-medium text-slate-800 mb-2 dark:text-slate-200">确认删除</h3>
            <p className="text-slate-600 mb-6 dark:text-slate-400">确定要删除这个友链吗？此操作不可撤销。</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                取消
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-500 transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FriendLinkManagement