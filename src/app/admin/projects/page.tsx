'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Plus,
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

// 定义项目类型接口
interface Project {
  id: number | null
  content: string
  title: string
  pic_url: string
  url: string
  type: number
  techs: string
  recommend?: boolean // 添加推荐状态字段
  inputVisible?: boolean
  inputValue?: string
  editingTitle?: boolean
  editingContent?: boolean
  editingImage?: boolean
  editingUrl?: boolean
  tempTitle?: string
  tempContent?: string
  tempImageUrl?: string
  tempUrl?: string
}

// 定义项目类型选项接口
interface ProjectType {
  id: number
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

const ProjectManagement = () => {
  // 状态管理
  const [project, setProject] = useState<Project>({
    id: null,
    content: '',
    title: '',
    pic_url: '',
    url: '',
    type: 0,
    techs: '',
    recommend: false // 初始化推荐状态
  })

  const [projectList, setProjectList] = useState<Project[]>([])
  const [filteredList, setFilteredList] = useState<Project[]>([]) // 筛选后的列表
  const [dialogImageUrl, setDialogImageUrl] = useState('')
  const [formValues, setFormValues] = useState({
    title: '',
    content: '',
    url: '',
    techs: '',
    type: 0
  })
  const [activeTab, setActiveTab] = useState('list')
  const [loading, setLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [updateRecommendLoading, setUpdateRecommendLoading] = useState<number | null>(null) // 添加推荐按钮加载状态

  // 本地输入状态管理
  const [localInputValues, setLocalInputValues] = useState<{
    [key: number]: {
      title?: string
      content?: string
      imageUrl?: string
      url?: string
      techInput?: string
    }
  }>({})

  // 筛选状态 - 仅保留类型筛选和新增标题搜索
  const [filters, setFilters] = useState({
    type: -1, // -1表示全部类型
    searchQuery: '' // 标题搜索关键词
  })

  // 类型选项 - 已更新类型名称和对应关系
  const types: ProjectType[] = [
    { id: 0, name: '未展示' },
    { id: 1, name: '完整项目' }, // 新增类型
    { id: 2, name: '工具箱' },
    { id: 3, name: '小游戏' },
    { id: 4, name: '小练习' } // 序号调整
  ]

  // 上传相关
  const uploadRef = useRef<HTMLInputElement>(null)
  const tagInputRef = useRef<HTMLInputElement>(null)
  const imageUploadRef = useRef<HTMLInputElement>(null)

  // 获取项目列表
  const getProjectList = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetchData(ENDPOINTS.ADMIN.PROJECTS)

      if (res.code === 200) {
        // 处理每个项目的额外状态
        const processedData = res.data.map((item: any) => ({
          ...item,
          techs: item.techs || '',
          recommend: item.recommend || false, // 确保推荐状态有默认值
          inputVisible: false,
          inputValue: '',
          editingTitle: false,
          editingContent: false,
          editingImage: false,
          editingUrl: false,
          tempTitle: item.title,
          tempContent: item.content,
          tempImageUrl: item.pic_url,
          tempUrl: item.url
        }))
        setProjectList(processedData)
        setFilteredList(processedData) // 初始筛选列表为全部数据
        // 重置本地输入状态
        setLocalInputValues({})
      } else {
        showAlert('获取项目列表失败')
      }
    } catch (error) {
      console.error('获取项目列表出错:', error)
      showAlert('获取项目列表失败')
    } finally {
      setLoading(false)
    }
  }, [])

  // 组件挂载时获取项目列表
  useEffect(() => {
    getProjectList()
  }, [getProjectList])

  // 筛选逻辑 - 基于类型和标题搜索
  useEffect(() => {
    let result = [...projectList]

    // 按类型筛选
    if (filters.type !== -1) {
      result = result.filter(item => item.type === filters.type)
    }

    // 按标题搜索 - 不区分大小写
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      result = result.filter(item => item.title.toLowerCase().includes(query))
    }

    setFilteredList(result)
  }, [projectList, filters])

  // 标签页切换处理
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    if (tab === 'list') {
      getProjectList()
    }
  }

  // 筛选器变化处理
  const handleFilterChange = (name: string, value: any) => {
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  // 重置筛选条件
  const resetFilters = () => {
    setFilters({
      type: -1,
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
          formData.append('namespace', 'blog/project')
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
  }

  // 技术标签相关
  const showInput = (row: Project) => {
    const updatedList: Project[] = projectList.map(item =>
      item.id === row.id ? { ...item, inputVisible: true } : item
    )
    setProjectList(updatedList)

    setTimeout(() => {
      tagInputRef.current?.focus()
    }, 0)
  }

  const handleInputConfirm = (row: Project) => {
    const projectId = row.id
    if (!projectId) return

    const currentTechs = row.techs || ''
    const inputValue = localInputValues[projectId]?.techInput || ''

    if (!inputValue.trim()) {
      // 如果输入为空，只关闭输入框
      const updatedList: Project[] = projectList.map(item =>
        item.id === projectId
          ? {
              ...item,
              inputValue: '',
              inputVisible: false
            }
          : item
      )
      setProjectList(updatedList)
      return
    }

    const updatedTechs = currentTechs ? `${currentTechs},${inputValue}` : inputValue

    const updatedList: Project[] = projectList.map(item => {
      if (item.id === projectId) {
        return {
          ...item,
          techs: updatedTechs,
          inputValue: '',
          inputVisible: false
        }
      }
      return item
    })

    setProjectList(updatedList)

    // 清除本地输入状态
    setLocalInputValues(prev => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        techInput: ''
      }
    }))

    const projectToUpdate = updatedList.find(item => item.id === projectId)
    if (projectToUpdate) {
      updateProject(projectToUpdate)
    }
  }

  const handleCloseTag = (i: number, row: Project) => {
    const currentTechs = row.techs || ''
    if (!currentTechs) return

    const tags = currentTechs.split(',')
    tags.splice(i, 1)
    const updatedTechs = tags.join(',')

    const updatedList: Project[] = projectList.map(item =>
      item.id === row.id ? { ...item, techs: updatedTechs } : item
    )

    setProjectList(updatedList)

    const projectToUpdate = updatedList.find(item => item.id === row.id)
    if (projectToUpdate) {
      updateProject(projectToUpdate)
    }
  }

  // 发布项目
  const publishProject = async () => {
    if (!formValues.title.trim()) return showAlert('请输入项目名称')
    if (!formValues.content.trim()) return showAlert('请输入项目描述')
    if (!formValues.url.trim()) return showAlert('请输入项目地址')
    if (!formValues.techs.trim()) return showAlert('请输入技术栈')
    if (!dialogImageUrl) return showAlert('请上传项目图片')

    try {
      setLoading(true)
      const projectData: Project = {
        ...project,
        pic_url: dialogImageUrl,
        title: formValues.title,
        content: formValues.content,
        url: formValues.url,
        techs: formValues.techs,
        type: formValues.type,
        recommend: false // 新项目默认不推荐
      }

      const res = await fetchData(ENDPOINTS.ADMIN.PROJECT, 'POST', { project: projectData })

      if (res.code === 200) {
        showAlert('项目发布成功')
        setFormValues({
          title: '',
          content: '',
          url: '',
          techs: '',
          type: 0
        })
        setDialogImageUrl('')
        setActiveTab('list')
        getProjectList()
      } else {
        showAlert(res.message || '项目发布失败')
      }
    } catch (error) {
      console.error('发布项目出错:', error)
      showAlert('项目发布失败')
    } finally {
      setLoading(false)
    }
  }

  // 删除项目相关
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return

    try {
      setLoading(true)
      const res = await fetchData(`${ENDPOINTS.ADMIN.PROJECT}/${deleteConfirm}/delete`, 'GET')

      if (res.code === 200) {
        showAlert('项目删除成功')
        getProjectList()
      } else {
        showAlert(res.message || '项目删除失败')
      }
    } catch (error) {
      console.error('删除项目出错:', error)
      showAlert('项目删除失败')
    } finally {
      setLoading(false)
      setDeleteConfirm(null)
    }
  }

  // 更新项目
  const updateProject = async (updatedProject: Project) => {
    try {
      setLoading(true)
      const res = await fetchData(ENDPOINTS.ADMIN.PROJECT, 'POST', { project: updatedProject })

      if (res.code === 200) {
        showAlert('项目更新成功')
      } else {
        showAlert(res.message || '项目更新失败')
        getProjectList()
      }
    } catch (error) {
      console.error('更新项目出错:', error)
      showAlert('项目更新失败')
      getProjectList()
    } finally {
      setLoading(false)
    }
  }

  // 更新项目类型
  const handleTypeChange = (projectId: number | null, type: number) => {
    const updatedList: Project[] = projectList.map(item =>
      item.id === projectId ? { ...item, type } : item
    )
    setProjectList(updatedList)

    const updatedProject = updatedList.find(item => item.id === projectId)
    if (updatedProject) {
      updateProject(updatedProject)
    }
  }

  // 本地输入处理函数
  const handleLocalInputChange = (projectId: number, field: string, value: string) => {
    setLocalInputValues(prev => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        [field]: value
      }
    }))
  }

  // 编辑项目地址
  const handleEditUrl = (projectId: number | null) => {
    if (!projectId) return
    const project = projectList.find(item => item.id === projectId)
    if (!project) return

    const updatedList: Project[] = projectList.map(item =>
      item.id === projectId ? { ...item, editingUrl: true } : item
    )
    setProjectList(updatedList)

    // 初始化本地输入值
    setLocalInputValues(prev => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        url: project.url
      }
    }))
  }

  const handleSaveUrl = (projectId: number | null) => {
    if (!projectId) return
    const localUrl = localInputValues[projectId]?.url

    const updatedList: Project[] = projectList.map(item =>
      item.id === projectId ? { ...item, url: localUrl || item.url, editingUrl: false } : item
    )
    setProjectList(updatedList)

    const updatedProject = updatedList.find(item => item.id === projectId)
    if (updatedProject) {
      updateProject(updatedProject)
    }
  }

  const handleCancelEditUrl = (projectId: number | null) => {
    const updatedList: Project[] = projectList.map(item =>
      item.id === projectId ? { ...item, editingUrl: false } : item
    )
    setProjectList(updatedList)
  }

  // 编辑项目名称
  const handleEditTitle = (projectId: number | null) => {
    if (!projectId) return
    const project = projectList.find(item => item.id === projectId)
    if (!project) return

    const updatedList: Project[] = projectList.map(item =>
      item.id === projectId ? { ...item, editingTitle: true } : item
    )
    setProjectList(updatedList)

    // 初始化本地输入值
    setLocalInputValues(prev => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        title: project.title
      }
    }))
  }

  const handleSaveTitle = (projectId: number | null) => {
    if (!projectId) return
    const localTitle = localInputValues[projectId]?.title

    const updatedList: Project[] = projectList.map(item =>
      item.id === projectId
        ? { ...item, title: localTitle || item.title, editingTitle: false }
        : item
    )
    setProjectList(updatedList)

    const updatedProject = updatedList.find(item => item.id === projectId)
    if (updatedProject) {
      updateProject(updatedProject)
    }
  }

  const handleCancelEditTitle = (projectId: number | null) => {
    const updatedList: Project[] = projectList.map(item =>
      item.id === projectId ? { ...item, editingTitle: false } : item
    )
    setProjectList(updatedList)
  }

  // 编辑项目描述
  const handleEditContent = (projectId: number | null) => {
    if (!projectId) return
    const project = projectList.find(item => item.id === projectId)
    if (!project) return

    const updatedList: Project[] = projectList.map(item =>
      item.id === projectId ? { ...item, editingContent: true } : item
    )
    setProjectList(updatedList)

    // 初始化本地输入值
    setLocalInputValues(prev => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        content: project.content
      }
    }))
  }

  const handleSaveContent = (projectId: number | null) => {
    if (!projectId) return
    const localContent = localInputValues[projectId]?.content

    const updatedList: Project[] = projectList.map(item =>
      item.id === projectId
        ? { ...item, content: localContent || item.content, editingContent: false }
        : item
    )
    setProjectList(updatedList)

    const updatedProject = updatedList.find(item => item.id === projectId)
    if (updatedProject) {
      updateProject(updatedProject)
    }
  }

  const handleCancelEditContent = (projectId: number | null) => {
    const updatedList: Project[] = projectList.map(item =>
      item.id === projectId ? { ...item, editingContent: false } : item
    )
    setProjectList(updatedList)
  }

  // 编辑项目图片
  const handleEditImage = (projectId: number | null) => {
    if (!projectId) return
    const project = projectList.find(item => item.id === projectId)
    if (!project) return

    const updatedList: Project[] = projectList.map(item =>
      item.id === projectId ? { ...item, editingImage: true } : item
    )
    setProjectList(updatedList)

    // 初始化本地输入值
    setLocalInputValues(prev => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        imageUrl: project.pic_url
      }
    }))
  }

  const handleSaveImageUrl = (projectId: number | null) => {
    if (!projectId) return
    const localImageUrl = localInputValues[projectId]?.imageUrl

    const updatedList: Project[] = projectList.map(item =>
      item.id === projectId
        ? { ...item, pic_url: localImageUrl || item.pic_url, editingImage: false }
        : item
    )
    setProjectList(updatedList)

    const updatedProject = updatedList.find(item => item.id === projectId)
    if (updatedProject) {
      updateProject(updatedProject)
    }
  }

  const handleCancelEditImage = (projectId: number | null) => {
    const updatedList: Project[] = projectList.map(item =>
      item.id === projectId ? { ...item, editingImage: false } : item
    )
    setProjectList(updatedList)
  }

  // 处理图片上传
  const handleImageFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    projectId: number | null
  ) => {
    if (!e.target.files?.[0] || !projectId) return

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
          formData.append('namespace', 'blog/project')
          formData.append('file', compressedFile)

          const data = await fetchData(ENDPOINTS.FILE.UPLOAD, 'POST', formData)
          if (data.url) {
            // 更新本地输入状态
            setLocalInputValues(prev => ({
              ...prev,
              [projectId]: {
                ...prev[projectId],
                imageUrl: data.url
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

  // 推荐功能 - 参照博客推荐逻辑
  const toggleRecommend = async (project: Project) => {
    try {
      // 设置当前操作的项目ID为加载状态
      setUpdateRecommendLoading(project.id)

      // 发送推荐状态更新请求
      const response = await fetchData(ENDPOINTS.ADMIN.PROJECT_RECOMMEND, 'POST', {
        projectId: project.id,
        recommend: !project.recommend
      })

      if (response.code === 200) {
        // 本地更新推荐状态
        setProjectList(prev =>
          prev.map(item =>
            item.id === project.id ? { ...item, recommend: !project.recommend } : item
          )
        )
        showAlert(project.recommend ? '取消推荐成功' : '推荐成功')
      } else {
        showAlert(project.recommend ? '取消推荐失败' : '推荐失败')
      }
    } catch (error) {
      console.error('推荐状态更新失败:', error)
      showAlert('操作失败，请重试')
    } finally {
      // 清除加载状态
      setUpdateRecommendLoading(null)
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
              发布项目
            </button>
            <button
              onClick={() => handleTabChange('list')}
              className={`flex-1 py-2 lg:py-3 px-6 text-center transition-colors ${
                activeTab === 'list'
                  ? 'text-blue-600 border-b-2 border-blue-500 dark:text-blue-400 dark:border-blue-500'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              项目列表
            </button>
          </div>

          {/* 发布项目内容 */}
          {activeTab === 'publish' && (
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="block text-sm text-slate-700 dark:text-slate-300">项目名称</label>
                <input
                  type="text"
                  name="title"
                  value={formValues.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
                  placeholder="请输入项目名称"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-slate-700 dark:text-slate-300">项目类型</label>
                <select
                  name="type"
                  value={formValues.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-blue-500"
                >
                  {types.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-slate-700 dark:text-slate-300">项目描述</label>
                <textarea
                  name="content"
                  value={formValues.content}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
                  placeholder="请输入项目描述"
                ></textarea>
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-slate-700 dark:text-slate-300">项目图片</label>
                <div className="flex items-center gap-4 flex-wrap">
                  <div
                    className="w-40 h-40 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors dark:border-slate-700"
                    onClick={() => uploadRef.current?.click()}
                  >
                    {dialogImageUrl ? (
                      <div className="relative w-full h-full rounded-lg overflow-hidden">
                        <Image
                          src={dialogImageUrl}
                          alt="项目图片预览"
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
                        className="px-3 py-1.5 rounded-md border border-slate-300 bg-white/60 text-slate-700 hover:bg-white/80 transition-colors text-sm flex items-center gap-1 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        <X className="h-3.5 w-3.5" />
                        移除
                      </button>
                    </div>
                  )}
                </div>
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
                <label className="block text-sm text-slate-700 dark:text-slate-300">技术栈（用英文逗号分隔）</label>
                <input
                  type="text"
                  name="techs"
                  value={formValues.techs}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
                  placeholder="请输入技术栈"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-slate-700 dark:text-slate-300">项目地址</label>
                <input
                  type="text"
                  name="url"
                  value={formValues.url}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
                  placeholder="请输入项目地址"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={publishProject}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors flex items-center gap-2 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  发布项目
                </button>
              </div>
            </div>
          )}

          {/* 项目列表内容 */}
          {activeTab === 'list' && (
            <div className="px-0 md:px-6 md:py-3 overflow-x-auto">
              {/* 筛选区域 - 包含类型筛选和标题搜索 */}
              <div className="md:mb-4 p-3 bg-white/60 lg:rounded-lg border border-slate-200/50 dark:bg-slate-900/40 dark:border-slate-700/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs text-slate-500 dark:text-slate-400">项目类型</label>
                    <select
                      value={filters.type}
                      onChange={e => handleFilterChange('type', Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-md border border-slate-300 bg-white text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-blue-500"
                    >
                      <option value={-1}>全部类型</option>
                      {types.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="block text-xs text-slate-500 dark:text-slate-400">标题搜索</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={filters.searchQuery}
                        onChange={e => handleFilterChange('searchQuery', e.target.value)}
                        placeholder="输入项目标题关键词搜索..."
                        className="w-full pl-9 pr-3 py-1.5 rounded-md border border-slate-300 bg-white text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-blue-500"
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400" />
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex justify-between items-center">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    共 {filteredList.length} 个项目（筛选自 {projectList.length} 个项目）
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
                <div className="space-y-4">
                  {filteredList.map((project, index) => {
                    const projectId = project.id
                    const localValues = projectId ? localInputValues[projectId] : {}

                    return (
                      <div
                        key={project.id}
                        className="bg-white/60 border border-slate-200/50 lg:rounded-lg p-4 hover:bg-slate-100/80 transition-all duration-300 dark:bg-slate-900/60 dark:border-slate-700/50 dark:hover:bg-slate-800/80"
                      >
                        {/* 响应式布局：图片占据左侧3列，内容占据右侧9列 */}
                        <div className="grid grid-cols-12 gap-4">
                          {/* 图片区域 - 在移动端占据全宽，桌面端占据3列，调整高度 */}
                          <div className="col-span-12 md:col-span-3 lg:col-span-3">
                            <div className="flex flex-col items-center md:items-start">
                              <p className="text-xs sm:text-sm text-slate-500 mb-2 self-start dark:text-slate-400">
                                项目图片
                              </p>
                              {project.editingImage ? (
                                <div className="w-full space-y-3">
                                  <div className="relative w-full h-32 md:h-36 rounded-lg overflow-hidden">
                                    <Image
                                      src={localValues.imageUrl || project.pic_url}
                                      alt={project.title}
                                      fill
                                      style={{ objectFit: 'cover' }}
                                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    <input
                                      value={localValues.imageUrl || ''}
                                      onChange={e =>
                                        projectId &&
                                        handleLocalInputChange(
                                          projectId,
                                          'imageUrl',
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-3 py-2 rounded border border-slate-300 bg-white text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-blue-500"
                                      placeholder="图片URL"
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => imageUploadRef.current?.click()}
                                        className="flex-1 px-3 py-2 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors text-sm flex items-center justify-center gap-1 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                      >
                                        <UploadIcon className="h-4 w-4" />
                                        上传
                                      </button>
                                      <button
                                        onClick={() => handleSaveImageUrl(project.id)}
                                        className="px-3 py-2 rounded bg-green-500 text-white hover:bg-green-600 transition-colors text-sm dark:bg-green-600 dark:hover:bg-green-500"
                                      >
                                        保存
                                      </button>
                                      <button
                                        onClick={() => handleCancelEditImage(project.id)}
                                        className="px-3 py-2 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors text-sm dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                                      >
                                        取消
                                      </button>
                                    </div>
                                  </div>
                                  <input
                                    ref={imageUploadRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={e => handleImageFileChange(e, project.id)}
                                    className="hidden"
                                  />
                                </div>
                              ) : (
                                <div className="relative group w-full">
                                  <div className="relative w-full h-32 md:h-36 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700">
                                    <Image
                                      src={project.pic_url}
                                      alt={project.title}
                                      fill
                                      style={{ objectFit: 'cover' }}
                                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                  </div>
                                  <button
                                    onClick={() => handleEditImage(project.id)}
                                    className="absolute top-2 right-2 p-2 rounded-full bg-white/80 text-slate-600 hover:bg-white hover:text-slate-700 transition-colors opacity-0 group-hover:opacity-100 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                                    title="编辑图片"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 内容区域 - 在移动端占据全宽，桌面端占据9列 */}
                          <div className="col-span-12 md:col-span-9 lg:col-span-9">
                            <div className="space-y-4">
                              {/* 第一行：标题和类型 */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* 项目标题 */}
                                <div className="space-y-2">
                                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">项目名称</p>
                                  {project.editingTitle ? (
                                    <div className="flex gap-2">
                                      <input
                                        value={localValues.title || ''}
                                        onChange={e =>
                                          projectId &&
                                          handleLocalInputChange(projectId, 'title', e.target.value)
                                        }
                                        className="flex-1 px-3 py-2 rounded border border-slate-300 bg-white text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-blue-500"
                                      />
                                      <button
                                        onClick={() => handleSaveTitle(project.id)}
                                        className="px-3 py-2 rounded bg-green-500 text-white hover:bg-green-600 transition-colors text-sm dark:bg-green-600 dark:hover:bg-green-500"
                                      >
                                        <Save className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleCancelEditTitle(project.id)}
                                        className="px-3 py-2 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors text-sm dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 group">
                                      <h3 className="text-base sm:text-lg font-medium text-slate-800 truncate dark:text-slate-200">
                                        {project.title}
                                      </h3>
                                      <button
                                        onClick={() => handleEditTitle(project.id)}
                                        className="p-1 rounded text-slate-500 hover:text-slate-700 transition-colors opacity-0 group-hover:opacity-100 dark:text-slate-400 dark:hover:text-slate-300"
                                        title="编辑标题"
                                      >
                                        <Edit2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* 项目类型 */}
                                <div className="space-y-2">
                                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">项目类型</p>
                                  <select
                                    value={project.type}
                                    onChange={e =>
                                      handleTypeChange(project.id, Number(e.target.value))
                                    }
                                    className="w-full px-3 py-2 rounded border border-slate-300 bg-white text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-blue-500"
                                  >
                                    {types.map(type => (
                                      <option key={type.id} value={type.id}>
                                        {type.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              {/* 第二行：描述和链接 */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* 项目描述 */}
                                <div className="space-y-2">
                                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">项目描述</p>
                                  {project.editingContent ? (
                                    <div className="space-y-2">
                                      <textarea
                                        value={localValues.content || ''}
                                        onChange={e =>
                                          projectId &&
                                          handleLocalInputChange(
                                            projectId,
                                            'content',
                                            e.target.value
                                          )
                                        }
                                        rows={3}
                                        className="w-full px-3 py-2 rounded border border-slate-300 bg-white text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-blue-500"
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => handleSaveContent(project.id)}
                                          className="px-3 py-2 rounded bg-green-500 text-white hover:bg-green-600 transition-colors text-sm dark:bg-green-600 dark:hover:bg-green-500"
                                        >
                                          保存
                                        </button>
                                        <button
                                          onClick={() => handleCancelEditContent(project.id)}
                                          className="px-3 py-2 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors text-sm dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                                        >
                                          取消
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="group">
                                      <p className="text-sm text-slate-700 line-clamp-3 dark:text-slate-300">
                                        {project.content}
                                      </p>
                                      <button
                                        onClick={() => handleEditContent(project.id)}
                                        className="mt-1 p-1 rounded text-slate-500 hover:text-slate-700 transition-colors opacity-0 group-hover:opacity-100 dark:text-slate-400 dark:hover:text-slate-300"
                                        title="编辑描述"
                                      >
                                        <Edit2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* 项目链接 */}
                                <div className="space-y-2">
                                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">项目地址</p>
                                  {project.editingUrl ? (
                                    <div className="space-y-2">
                                      <input
                                        value={localValues.url || ''}
                                        onChange={e =>
                                          projectId &&
                                          handleLocalInputChange(projectId, 'url', e.target.value)
                                        }
                                        className="w-full px-3 py-2 rounded border border-slate-300 bg-white text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-blue-500"
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => handleSaveUrl(project.id)}
                                          className="px-3 py-2 rounded bg-green-500 text-white hover:bg-green-600 transition-colors text-sm dark:bg-green-600 dark:hover:bg-green-500"
                                        >
                                          保存
                                        </button>
                                        <button
                                          onClick={() => handleCancelEditUrl(project.id)}
                                          className="px-3 py-2 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors text-sm dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                                        >
                                          取消
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 group">
                                      <Link
                                        href={project.url}
                                        target="_blank"
                                        rel="noopener"
                                        className="text-sm text-blue-600 hover:text-blue-700 truncate dark:text-blue-400 dark:hover:text-blue-300"
                                      >
                                        {project.url}
                                      </Link>
                                      <button
                                        onClick={() => handleEditUrl(project.id)}
                                        className="p-1 rounded text-slate-500 hover:text-slate-700 transition-colors opacity-0 group-hover:opacity-100 dark:text-slate-400 dark:hover:text-slate-300"
                                        title="编辑链接"
                                      >
                                        <Edit2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* 第三行：技术栈和操作按钮 */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* 技术栈 */}
                                <div className="flex items-center gap-2">
                                  <p className="text-xs sm:text-sm text-slate-500 whitespace-nowrap dark:text-slate-400">
                                    技术栈
                                  </p>
                                  <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                                    {project.techs &&
                                      project.techs.split(',').map((tag, i) => (
                                        <span
                                          key={i}
                                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white border border-slate-300 text-slate-700 text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                                        >
                                          {tag}
                                          <X
                                            className="h-3 w-3 cursor-pointer hover:text-red-500 dark:hover:text-red-400"
                                            onClick={() => handleCloseTag(i, project)}
                                          />
                                        </span>
                                      ))}
                                    {project.inputVisible ? (
                                      <input
                                        ref={tagInputRef}
                                        value={localValues.techInput || ''}
                                        onChange={e =>
                                          projectId &&
                                          handleLocalInputChange(
                                            projectId,
                                            'techInput',
                                            e.target.value
                                          )
                                        }
                                        onBlur={() => handleInputConfirm(project)}
                                        onKeyDown={e => {
                                          if (e.key === 'Enter') {
                                            handleInputConfirm(project)
                                          }
                                        }}
                                        className="w-20 px-2 py-1 rounded border border-slate-300 bg-white text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-blue-500"
                                      />
                                    ) : (
                                      <span
                                        onClick={() => showInput(project)}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white border border-slate-300 text-slate-500 hover:text-slate-700 cursor-pointer text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                                      >
                                        <Plus className="h-3 w-3" />
                                        添加
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* 操作按钮 */}
                                <div className="flex items-end justify-end gap-2">
                                  {/* 推荐按钮 */}
                                  <button
                                    onClick={() => toggleRecommend(project)}
                                    disabled={updateRecommendLoading === project.id}
                                    className={`px-4 py-2 rounded transition-colors text-sm flex items-center gap-2 ${
                                      project.recommend
                                        ? 'bg-yellow-100/60 text-yellow-600 hover:bg-yellow-100/80 dark:bg-yellow-500/20 dark:text-yellow-400 dark:hover:bg-yellow-500/30'
                                        : 'bg-slate-200/60 text-slate-500 hover:bg-slate-200/80 dark:bg-slate-700/50 dark:text-slate-400 dark:hover:bg-slate-700/80'
                                    }`}
                                    title={project.recommend ? '取消推荐' : '推荐项目'}
                                  >
                                    {updateRecommendLoading === project.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Star
                                        className={`h-4 w-4 ${
                                          project.recommend ? 'fill-current' : ''
                                        }`}
                                      />
                                    )}
                                    {project.recommend ? '已推荐' : '推荐'}
                                  </button>

                                  <button
                                    onClick={() => setDeleteConfirm(project.id)}
                                    className="px-4 py-2 rounded bg-red-100/60 text-red-600 hover:bg-red-100/80 transition-colors text-sm flex items-center gap-2 dark:bg-red-600/20 dark:text-red-400 dark:hover:bg-red-600/30"
                                  >
                                    <Trash2 className="h-4 w-4" />
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
                  <p className="text-slate-500 dark:text-slate-400">暂无项目数据</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* 删除确认对话框 */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 rounded-lg p-6 max-w-sm w-full border border-slate-200/50 dark:bg-slate-800 dark:border-slate-700">
            <h3 className="text-lg font-medium text-slate-800 mb-2 dark:text-slate-200">确认删除</h3>
            <p className="text-slate-600 mb-6 dark:text-slate-400">确定要删除这个项目吗？此操作不可撤销。</p>
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

export default ProjectManagement