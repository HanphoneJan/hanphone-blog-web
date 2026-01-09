'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useUser } from '@/contexts/UserContext'
import { ENDPOINTS } from '@/lib/api'
import apiClient from '@/lib/utils'
import {
  Camera,
  Upload,
  Save,
  User,
  Lock,
  Check,
  X,
  Loader2,
  Edit3,
  Plus,
  Trash2,
  Code,
  BookOpen,
  Heart,
  MessageSquare,
  Music,
  Video,
  Book,
  Gamepad,
  Dumbbell
} from 'lucide-react'
import { showAlert } from '@/lib/Alert'
import md5 from 'md5'

// 定义数据类型接口
interface Item {
  id: number
  category: 'skill' | 'work' | 'hobby' | 'evaluation'
  name: string
  description: string | null
  pic_url: string | null
  icon_src: string | null
  url: string | null
  rank: number // 新增rank字段，默认为0
}

// 首先定义联合类型，包含所有可能的项目类型
type ItemType = Skill | Work | Hobby | Evaluation | null

// 用户信息类型定义
interface UserInfo {
  id: number
  avatar: string
  nickname: string
  username: string
  email: string
  type: string // 0: 普通用户, 1: 管理员
}

// 技能类型定义
interface Skill {
  id: number
  name: string
  url: string
  desc: string
  icon_src: string
  icon: React.ReactNode
  rank: number // 新增rank字段
}

// 作品类型定义
interface Work {
  id: number
  name: string
  url: string
  desc: string
  pic_url: string
  icon_src: string
  icon: React.ReactNode
  rank: number // 新增rank字段
}

// 爱好类型定义
interface Hobby {
  id: number
  name: string
  url: string
  pic_url: string
  desc: string
  icon: React.ReactNode
  icon_src: string
  rank: number // 新增rank字段
}

interface Evaluation {
  id: number
  name: string
  rank: number // 新增rank字段
}

interface PersonInfoFormData {
  name: string
  url?: string
  desc?: string
  pic_url?: string
  icon_src?: string
  id?: number // 编辑模式时存在
  rank?: number // 新增rank字段
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

const getIcon = (icon_src: string) => {
  switch (icon_src) {
    case 'music':
      return <Music className="h-5 w-5" />
    case 'video':
      return <Video className="h-5 w-5" />
    case 'sport':
      return <Dumbbell className="h-5 w-5" />
    case 'literature':
      return <Book className="h-5 w-5" />
    case 'game':
      return <Gamepad className="h-5 w-5" />
    case 'code':
      return <Code className="h-5 w-5" />
    default:
      return <Book className="h-5 w-5" />
  }
}

const getSkillIcon = (icon_src: string) => {
  switch (icon_src) {
    case 'music':
      return <Music className="h-8 w-8 text-blue-400" />
    case 'video':
      return <Video className="h-8 w-8 text-blue-400" />
    case 'sport':
      return <Dumbbell className="h-8 w-8 text-blue-400" />
    case 'literature':
      return <Book className="h-8 w-8 text-blue-400" />
    case 'game':
      return <Gamepad className="h-8 w-8 text-blue-400" />
    case 'code':
      return <Code className="h-8 w-8 text-blue-400" />
    default:
      return <Code className="h-8 w-8 text-blue-400" />
  }
}

// 获取章节名称
const getSectionName = (section: string) => {
  switch (section) {
    case 'skills':
      return '技能'
    case 'works':
      return '作品'
    case 'hobbys':
      return '爱好'
    case 'evaluations':
      return '评价'
    default:
      return ''
  }
}

// 导航项配置
const navItems = [
  { id: 'info', label: '基本信息', shortLabel: '信息', icon: <User className="h-5 w-5" /> },
  { id: 'skills', label: '技能管理', shortLabel: '技能', icon: <Code className="h-5 w-5" /> },
  { id: 'hobbys', label: '爱好管理', shortLabel: '爱好', icon: <Heart className="h-5 w-5" /> },
  { id: 'works', label: '作品管理', shortLabel: '作品', icon: <BookOpen className="h-5 w-5" /> },
  {
    id: 'evaluations',
    label: '自我评价',
    shortLabel: '评价',
    icon: <MessageSquare className="h-5 w-5" />
  }
]

export default function ProfilePage() {
  // 从全局上下文获取用户信息
  const { userInfo: globalUserInfo, updateUserInfo } = useUser()

  // 状态管理 - 用户信息表单
  const [userForm, setUserForm] = useState<UserInfo>({
    id: 0,
    avatar: '',
    nickname: '',
    username: '',
    email: '',
    type: '0'
  })

  // 状态管理 - 技能、作品、爱好、自我评价
  const [skills, setSkills] = useState<Skill[]>([])
  const [works, setWorks] = useState<Work[]>([])
  const [hobbys, setHobbys] = useState<Hobby[]>([])
  const [selfEvaluations, setSelfEvaluations] = useState<Evaluation[]>([])

  // 编辑状态管理
  const [activeSection, setActiveSection] = useState('info')
  const [dialogVisible, setDialogVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<ItemType>(null)
  const [currentItemIndex, setCurrentItemIndex] = useState(-1)
  const [formData, setFormData] = useState<PersonInfoFormData>({} as PersonInfoFormData)
  const [originalActiveSection, setOriginalActiveSection] = useState('info')

  // 其他状态
  const [imageUrl, setImageUrl] = useState('/default-avatar.png')
  const [loading, setLoading] = useState(false)
  const [isAddMode, setIsAddMode] = useState(true)
  const [resetPasswordVisible, setResetPasswordVisible] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // 页面加载时同步全局用户信息和个人资料数据
  useEffect(() => {
    if (globalUserInfo) {
      // 同步用户基本信息
      const userData = {
        id: Number(globalUserInfo.id) || 0,
        avatar: globalUserInfo.avatar || '',
        nickname: globalUserInfo.nickname || '',
        username: globalUserInfo.username || '',
        email: globalUserInfo.email || '',
        type: globalUserInfo.type || '0'
      }
      setUserForm(userData)
      setImageUrl(globalUserInfo.avatar || '/default-avatar.png')

      // 加载个人资料数据
      fetchProfileData()
    }
  }, [globalUserInfo])

  // 获取个人资料数据
  const fetchProfileData = async () => {
    try {
      setLoading(true)
      // 从API获取数据
      const res = await fetchData(ENDPOINTS.USER.PERSONINFOS)

      if (res.flag && res.code === 200) {
        // 按类别分组数据
        const skillsData = res.data.filter((item: Item) => item.category === 'skill')
        const worksData = res.data.filter((item: Item) => item.category === 'work')
        const hobbysData = res.data.filter((item: Item) => item.category === 'hobby')
        const evaluationsData = res.data.filter((item: Item) => item.category === 'evaluation')

        // 转换为当前组件需要的数据格式
        setSkills(
          skillsData
            .map((item: Item) => ({
              id: item.id,
              name: item.name,
              url: item.url || '',
              desc: item.description || '',
              icon_src: item.icon_src || '',
              icon: getSkillIcon(item.icon_src || ''),
              rank: item.rank || 0 // 添加rank字段，默认为0
            }))
            .sort((a, b) => {
              // 先按rank排序，rank值越小优先级越高
              if (a.rank !== b.rank) {
                return a.rank - b.rank
              }
              // 如果rank相同，按id排序
              return a.id - b.id
            })
        )

        setWorks(
          worksData
            .map((item: Item) => ({
              id: item.id,
              name: item.name,
              url: item.url || '',
              desc: item.description || '',
              pic_url: item.pic_url || '',
              icon_src: item.icon_src || '',
              icon: getIcon(item.icon_src || ''),
              rank: item.rank || 0 // 添加rank字段，默认为0
            }))
            .sort((a, b) => {
              // 先按rank排序，rank值越小优先级越高
              if (a.rank !== b.rank) {
                return a.rank - b.rank
              }
              // 如果rank相同，按id排序
              return a.id - b.id
            })
        )

        setHobbys(
          hobbysData
            .map((item: Item) => ({
              id: item.id,
              name: item.name,
              url: item.url || '',
              desc: item.description || '',
              pic_url: item.pic_url || '',
              icon_src: item.icon_src || '',
              icon: getIcon(item.icon_src || ''),
              rank: item.rank || 0 // 添加rank字段，默认为0
            }))
            .sort((a, b) => {
              // 先按rank排序，rank值越小优先级越高
              if (a.rank !== b.rank) {
                return a.rank - b.rank
              }
              // 如果rank相同，按id排序
              return a.id - b.id
            })
        )

        setSelfEvaluations(
          evaluationsData
            .map((item: Item) => ({
              id: item.id,
              name: item.name,
              rank: item.rank || 0 // 添加rank字段，默认为0
            }))
            .sort((a, b) => {
              // 先按rank排序，rank值越小优先级越高
              if (a.rank !== b.rank) {
                return a.rank - b.rank
              }
              // 如果rank相同，按id排序
              return a.id - b.id
            })
        )
      }
    } catch (error) {
      console.error('获取个人资料数据失败:', error)
      showAlert('获取个人资料数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 处理头像上传成功
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('namespace', 'blog/user')
    formData.append('file', file)

    try {
      setLoading(true)
      const response = await apiClient({
        url: ENDPOINTS.FILE.UPLOAD,
        method: 'POST',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (response.data.code === 200) {
        setImageUrl(response.data.url || '/default-avatar.png')
      } else {
        showAlert('头像上传失败')
      }
    } catch (error) {
      console.error('上传失败:', error)
      showAlert('头像上传失败')
    } finally {
      setLoading(false)
      e.target.value = ''
    }
  }

  // 设置头像
  const setAvatar = async () => {
    if (!imageUrl || imageUrl.trim() === '' || !globalUserInfo) {
      return showAlert('请先上传头像')
    }

    try {
      setLoading(true)
      const res = await fetchData(ENDPOINTS.USER.SET_AVATAR, 'POST', {
        pic_url: imageUrl,
        user_id: Number(globalUserInfo.id) || 0
      })

      if (res.code === 200) {
        if (updateUserInfo) {
          updateUserInfo(res.data)
        }
        setDialogVisible(false)
        showAlert('头像更新成功')
      } else {
        showAlert(res.message || '头像更新失败')
      }
    } catch (error) {
      console.error('更新头像失败:', error)
      showAlert('更新头像失败')
    } finally {
      setLoading(false)
    }
  }

  // 修改用户信息
  const changeUserInfo = async () => {
    if (!globalUserInfo) return showAlert('未获取到用户信息')

    try {
      setLoading(true)
      const res = await fetchData(ENDPOINTS.ADMIN.USER, 'POST', {
        user: userForm
      })

      if (res.code === 200) {
        if (updateUserInfo) {
          updateUserInfo(res.data)
        }
        showAlert('信息更新成功')
      } else {
        showAlert(res.message || '信息更新失败')
      }
    } catch (error) {
      console.error('更新用户信息失败:', error)
      showAlert('更新用户信息失败')
    } finally {
      setLoading(false)
    }
  }

  // 处理密码重置表单字段变化
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === 'newPassword') {
      setNewPassword(value)
    } else if (name === 'confirmPassword') {
      setConfirmPassword(value)
    }

    // 清除密码错误提示
    if (passwordError) {
      setPasswordError('')
    }
  }

  // 验证密码
  const validatePassword = () => {
    if (!newPassword) {
      setPasswordError('请输入新密码')
      return false
    }

    if (newPassword.length < 6) {
      setPasswordError('密码长度不能少于6位')
      return false
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('两次输入的密码不一致')
      return false
    }

    return true
  }

  // 重置密码
  const resetPassword = async () => {
    if (!validatePassword()) {
      return
    }

    if (!globalUserInfo) {
      return showAlert('未获取到用户信息')
    }

    try {
      setLoading(true)
      const res = await fetchData(ENDPOINTS.USER.RESET_PASSWORD, 'POST', {
        userId: Number(globalUserInfo.id) || 0,
        newPassword: md5(newPassword)
      })

      if (res.code === 200) {
        showAlert('密码重置成功')
        setResetPasswordVisible(false)
        setNewPassword('')
        setConfirmPassword('')
      } else {
        showAlert(res.message || '密码重置失败')
      }
    } catch (error) {
      console.error('重置密码失败:', error)
      showAlert('重置密码失败')
    } finally {
      setLoading(false)
    }
  }

  // 修改原changePassword函数
  const changePassword = () => {
    setResetPasswordVisible(true)
    setPasswordError('')
  }

  // 处理表单字段变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    // 确保name属性是PersonInfoFormData中存在的键
    if (['name', 'url', 'desc', 'pic_url', 'id', 'icon_src', 'rank'].includes(name)) {
      setFormData((prev: PersonInfoFormData) => ({
        ...prev,
        [name]: name === 'rank' ? (value ? Number(value) : 0) : value || ''
      }))
    }
  }

  // 处理用户信息表单变化
  const handleUserInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setUserForm(prev => ({
      ...prev,
      [name]: value || ''
    }))
  }

  // 打开编辑对话框
  const openEditDialog = (section: string, item?: ItemType, index?: number) => {
    setActiveSection(section)
    setCurrentItem(item || null)
    setCurrentItemIndex(index !== undefined ? index : -1)

    if (item && index !== undefined) {
      // 编辑模式
      setIsAddMode(false)
      setFormData({ ...item })
    } else {
      // 添加模式
      setIsAddMode(true)
      // 根据不同 section 设置默认表单数据
      switch (section) {
        case 'skills':
          setFormData({ name: '', url: '', desc: '', rank: 0 })
          break
        case 'works':
          setFormData({ name: '', url: '', desc: '', pic_url: '', rank: 0 })
          break
        case 'hobbys':
          setFormData({ name: '', url: '', desc: '', pic_url: '', rank: 0 })
          break
        case 'evaluations':
          setFormData({ name: '', rank: 0 })
          break
        default:
          setFormData({ name: '', rank: 0 })
      }
    }
    setDialogVisible(true)
  }

  // 关闭对话框
  const closeDialog = () => {
    setDialogVisible(false)
    setCurrentItem(null)
    setCurrentItemIndex(-1)
    setFormData({ name: '', rank: 0 })
    if (activeSection === 'avatar') {
      setActiveSection(originalActiveSection)
    }
  }

  // 保存编辑内容
  const saveItem = async () => {
    try {
      setLoading(true)
      const commonData = {
        name: formData.name,
        description: formData.desc || formData.desc,
        url: formData.url,
        icon_src: formData.icon_src,
        pic_url: formData.pic_url,
        rank: formData.rank || 0 // 添加rank字段，默认为0
      }

      // 确定分类
      let category: 'skill' | 'work' | 'hobby' | 'evaluation'
      switch (activeSection) {
        case 'skills':
          category = 'skill'
          break
        case 'works':
          category = 'work'
          break
        case 'hobbys':
          category = 'hobby'
          break
        case 'evaluations':
          category = 'evaluation'
          break
        default:
          throw new Error('Invalid section')
      }

      if (isAddMode) {
        // 添加项目 - 包装到personInfo字段
        const newItem = { personInfo: { ...commonData, category } }
        const res = await fetchData(ENDPOINTS.ADMIN.PERSONINFO, 'POST', newItem)
        if (res.code === 200) {
          fetchProfileData() // 重新获取数据
        } else {
          showAlert('添加失败: ' + (res.message || ''))
        }
      } else if (currentItemIndex !== -1) {
        // 编辑项目 - 包装到personInfo字段
        const updatedItem = {
          personInfo: { ...commonData, id: currentItem?.id, category }
        }
        const res = await fetchData(ENDPOINTS.ADMIN.PERSONINFO, 'POST', updatedItem)
        if (res.code === 200) {
          fetchProfileData() // 重新获取数据
        } else {
          showAlert('修改失败: ' + (res.message || ''))
        }
      }

      showAlert(isAddMode ? '添加成功' : '修改成功')
      closeDialog()
    } catch (error) {
      console.error('保存失败:', error)
      showAlert(isAddMode ? '添加失败' : '修改失败')
    } finally {
      setLoading(false)
    }
  }

  // 删除项目
  const deleteItem = async (section: string, index: number, id: number) => {
    try {
      setLoading(true)

      // 调用API删除
      const res = await fetchData(`${ENDPOINTS.ADMIN.PERSONINFO}/${id}/delete`, 'GET')

      if (res.code === 200) {
        // 删除成功后重新获取数据
        fetchProfileData()
        showAlert('删除成功')
      } else {
        showAlert('删除失败: ' + (res.message || ''))
      }
    } catch (error) {
      console.error('删除失败:', error)
      showAlert('删除失败')
    } finally {
      setLoading(false)
    }
  }

  // 如果没有全局用户信息，显示加载状态
  if (!globalUserInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 dark:bg-slate-100">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 dark:border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="font-sans min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-blue-50 text-slate-800 dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-200 relative overflow-hidden">
      {/* 背景效果 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(50,100,200,0.1)_0%,transparent_40%),radial-gradient(circle_at_80%_80%,rgba(80,120,250,0.1)_0%,transparent_40%)] dark:opacity-100 opacity-0"></div>
      <main className="flex-1 w-full max-w-7xl mx-auto lg:px-2 lg:py-2 relative z-10">
        {/* 顶部标签式导航 */}
        <div className="bg-white/80 backdrop-blur-sm lg:rounded-t-xl shadow-sm border border-slate-200/50 border-b-0 overflow-hidden dark:bg-slate-800/40 dark:border-slate-700/50">
          <div className="flex overflow-x-auto scrollbar-hide">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex-1 min-w-[50px] px-2 pt-2 pb-1 lg:py-3 transition-all ${
                  activeSection === item.id
                    ? 'bg-blue-500 text-white border-b-2 border-blue-600 dark:bg-blue-600 dark:border-blue-500'
                    : 'bg-white/60 text-slate-600 hover:bg-slate-100 border-b-2 border-transparent dark:bg-slate-800/40 dark:text-slate-300 dark:hover:bg-slate-700/40'
                }`}
              >
                {/* 桌面端显示 */}
                <div className="hidden sm:flex items-center justify-center gap-2">
                  {item.icon}
                  <span className="text-sm">{item.label}</span>
                </div>
                {/* 移动端显示 */}
                <div className="sm:hidden flex flex-col items-center justify-center gap-1">
                  {item.icon}
                  <span className="text-xs">{item.shortLabel}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 基本信息部分 - 合并用户信息与编辑表单 */}
        {activeSection === 'info' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-b-xl shadow-sm min-h-[100vh] border border-slate-200/50 border-t-0 overflow-hidden dark:bg-slate-800/40 dark:border-slate-700/50">
            <div className="py-3 px-6 border-b border-slate-200/50 dark:border-slate-700/50">
              <h2 className="text-lg font-semibold text-blue-600 flex items-center dark:text-blue-400">
                <Edit3 className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" />
                基本信息管理
              </h2>
            </div>

            <div className="p-2 lg:p-4">
              {/* 使用网格布局实现响应式对齐 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
                {/* 头像区域 - 小屏幕占满行，大屏幕占3列 */}
                <div className="lg:col-span-3 relative self-center">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-slate-300 mx-auto lg:ml-20 dark:border-slate-700">
                    <Image
                      src={globalUserInfo.avatar || '/default-avatar.png'}
                      alt={`${globalUserInfo.nickname || '用户'}的头像`}
                      height={196}
                      width={196}
                      priority
                      className="object-cover"
                    />
                    <div
                      className="absolute inset-0 bg-black/30 rounded-full border-2 border-slate-300 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer dark:border-slate-700"
                      onClick={() => {
                        setOriginalActiveSection(activeSection)
                        setActiveSection('avatar')
                        setDialogVisible(true)
                      }}
                    >
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>

                {/* 修改密码和表单区域 - 小屏幕占满行，大屏幕占10列 */}
                <div className="lg:col-span-9 flex flex-col gap-2">
                  {/* 使用网格布局确保修改密码与表单垂直对齐 */}
                  <div className="flex justify-between items-center mb-4">
                    {/* 修改密码按钮 - 与表单输入区域对齐 */}
                    <button
                      onClick={changePassword}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      <span>修改密码</span>
                    </button>
                  </div>

                  {/* 基本信息编辑表单 */}
                  <form className="space-y-5">
                    {/* 用户类型 */}
                    <div className="flex items-center gap-4">
                      <label className="text-sm text-slate-600 min-w-[80px] dark:text-slate-400">用户类型</label>
                      <div className="flex-1  max-w-sm">
                        <div className="text-slate-800 p-2 bg-white/60 rounded-lg border border-slate-300 dark:bg-slate-900/60 dark:text-slate-200 dark:border-slate-700">
                          {globalUserInfo.type === '1' ? '管理员' : ' 普通用户'}
                        </div>
                      </div>
                    </div>

                    {/* 昵称 */}
                    <div className="flex items-center gap-4">
                      <label htmlFor="nickname" className="text-sm text-slate-600 min-w-[80px] dark:text-slate-400">
                        昵称
                      </label>
                      <div className="flex-1 max-w-sm">
                        <input
                          id="nickname"
                          name="nickname"
                          type="text"
                          value={userForm.nickname}
                          onChange={handleUserInfoChange}
                          className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>

                    {/* 用户名 */}
                    <div className="flex items-center gap-4">
                      <label htmlFor="username" className="text-sm text-slate-600 min-w-[80px] dark:text-slate-400">
                        用户名
                      </label>
                      <div className="flex-1  max-w-sm">
                        <input
                          id="username"
                          name="username"
                          type="text"
                          value={userForm.username}
                          onChange={handleUserInfoChange}
                          className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>

                    {/* 邮箱 */}
                    <div className="flex items-center gap-4">
                      <label htmlFor="email" className="text-sm text-slate-600 min-w-[80px] dark:text-slate-400">
                        邮箱
                      </label>
                      <div className="flex-1  max-w-sm">
                        <input
                          id="email"
                          name="email"
                          type="email"
                          value={userForm.email}
                          onChange={handleUserInfoChange}
                          className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>

                    {/* 提交按钮 */}
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={changeUserInfo}
                        disabled={loading}
                        className={`px-4 py-2 rounded-lg transition duration-300 flex items-center justify-center gap-2 ${
                          loading
                            ? 'bg-slate-300 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                            : 'bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-500'
                        }`}
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        <span>保存修改</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 技能管理部分 */}
        {activeSection === 'skills' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-b-xl shadow-sm border border-slate-200/50 border-t-0 overflow-hidden dark:bg-slate-800/40 dark:border-slate-700/50">
            <div className="py-3 px-6 border-b border-slate-200/50 flex justify-between items-center dark:border-slate-700/50">
              <h2 className="text-lg font-semibold text-blue-600 flex items-center dark:text-blue-400">
                <Code className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" />
                技能管理
              </h2>
              <button
                onClick={() => openEditDialog('skills')}
                className="px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm flex items-center transition-colors dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                添加技能
              </button>
            </div>

            <div className="p-2 lg:p-4 min-h-[90vh]">
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
                </div>
              ) : skills.length === 0 ? (
                <div className="text-center py-10 text-slate-500 dark:text-slate-400">暂无技能数据</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {skills.map((skill, index) => (
                    <div
                      key={skill.id}
                      className="flex flex-col items-center text-center p-3 bg-white/60 rounded-lg border border-slate-200/50 hover:bg-white/80 transition-all duration-300 relative 
                            w-full max-w-[200px] mx-auto dark:bg-slate-800/60 dark:border-slate-700/50 dark:hover:bg-slate-800/80"
                    >
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          deleteItem('skills', index, skill.id)
                        }}
                        className="absolute top-2 right-2 text-slate-500 hover:text-red-500 transition-colors
                              sm:top-2 sm:right-2 sm:h-4 sm:w-4 dark:text-slate-400 dark:hover:text-red-400"
                        aria-label="删除技能"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          openEditDialog('skills', skill, index)
                        }}
                        className="absolute top-2 left-2 text-slate-500 hover:text-blue-500 transition-colors
                              sm:top-2 sm:left-2 sm:h-4 sm:w-4 dark:text-slate-400 dark:hover:text-blue-400"
                        aria-label="编辑技能"
                      >
                        <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>

                      <div
                        className="w-16 h-16 sm:w-18 sm:h-18 
                                bg-slate-200/60 rounded-full shadow-md flex items-center justify-center 
                                mb-2 sm:mb-3 transition-all duration-300 hover:shadow-lg hover:scale-110 dark:bg-slate-700/60"
                      >
                        {skill.icon}
                      </div>

                      <h3 className="text-sm sm:text-base font-semibold mb-1 text-slate-800 dark:text-slate-200">
                        {skill.name}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 dark:text-slate-300">{skill.desc}</p>

                      {skill.url && (
                        <a
                          href={skill.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 text-xs text-blue-600 hover:text-blue-700 transition-colors dark:text-blue-400 dark:hover:text-blue-300"
                          onClick={e => e.stopPropagation()}
                        >
                          查看详情
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 作品管理部分 */}
        {activeSection === 'works' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-b-xl shadow-sm border border-slate-200/50 border-t-0 overflow-hidden dark:bg-slate-800/40 dark:border-slate-700/50">
            <div className="py-3 px-6 border-b border-slate-200/50 flex justify-between items-center dark:border-slate-700/50">
              <h2 className="text-lg font-semibold text-blue-600 flex items-center dark:text-blue-400">
                <BookOpen className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" />
                作品管理
              </h2>
              <button
                onClick={() => openEditDialog('works')}
                className="px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm flex items-center transition-colors dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                添加作品
              </button>
            </div>

            <div className="p-2 lg:p-4 min-h-[90vh]">
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
                </div>
              ) : works.length === 0 ? (
                <div className="text-center py-10 text-slate-500 dark:text-slate-400">暂无作品数据</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {works.map((work, index) => (
                    <div
                      key={work.id}
                      className="bg-white/60 rounded-xl border border-slate-200/50 overflow-hidden transition-all duration-300 hover:bg-white/80 hover:shadow-lg relative
                              w-full max-w-[240px] mx-auto dark:bg-slate-800/60 dark:border-slate-700/50 dark:hover:bg-slate-800/80"
                    >
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          deleteItem('works', index, work.id)
                        }}
                        className="absolute top-2 right-2 bg-black/50 rounded-full p-1 text-slate-300 hover:text-red-500 transition-colors z-10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          openEditDialog('works', work, index)
                        }}
                        className="absolute top-2 left-2 bg-black/50 rounded-full p-1 text-slate-300 hover:text-blue-500 transition-colors z-10"
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>

                      <a
                        href={work.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block h-32 overflow-hidden relative"
                      >
                        <Image
                          src={work.pic_url || '/default-image.png'}
                          alt={work.name}
                          fill
                          className="object-fit w-full h-full transition-transform duration-700 hover:scale-110"
                        />
                      </a>
                      <div className="p-3">
                        <div className="flex items-center mb-2">
                          <span className="mr-2 text-blue-500 dark:text-blue-400">{work.icon}</span>
                          <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200">
                            {work.name}
                          </h3>
                        </div>
                        <p className="text-slate-600 text-xs sm:text-sm line-clamp-2 dark:text-slate-300">
                          {work.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 爱好管理部分 */}
        {activeSection === 'hobbys' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-b-xl shadow-sm border border-slate-200/50 border-t-0 overflow-hidden dark:bg-slate-800/40 dark:border-slate-700/50">
            <div className="py-3 px-6 border-b border-slate-200/50 flex justify-between items-center dark:border-slate-700/50">
              <h2 className="text-lg font-semibold text-blue-600 flex items-center dark:text-blue-400">
                <Heart className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" />
                爱好管理
              </h2>
              <button
                onClick={() => openEditDialog('hobbys')}
                className="px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm flex items-center transition-colors dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                添加爱好
              </button>
            </div>

            <div className="p-2 lg:p-4 min-h-[90vh]">
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
                </div>
              ) : hobbys.length === 0 ? (
                <div className="text-center py-10 text-slate-500 dark:text-slate-400">暂无爱好数据</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {hobbys.map((hobby, index) => (
                    <div
                      key={hobby.id}
                      className="bg-white/60 rounded-xl border border-slate-200/50 overflow-hidden transition-all duration-300 hover:bg-white/80 hover:shadow-lg relative
                              w-full max-w-[240px] mx-auto dark:bg-slate-800/60 dark:border-slate-700/50 dark:hover:bg-slate-800/80"
                    >
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          deleteItem('hobbys', index, hobby.id)
                        }}
                        className="absolute top-2 right-2 bg-black/50 rounded-full p-1 text-slate-300 hover:text-red-500 transition-colors z-10
                                sm:top-2 sm:right-2 sm:p-1 dark:text-slate-300 dark:hover:text-red-400"
                        aria-label="删除爱好"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          openEditDialog('hobbys', hobby, index)
                        }}
                        className="absolute top-2 left-2 bg-black/50 rounded-full p-1 text-slate-300 hover:text-blue-500 transition-colors z-10
                                sm:top-2 sm:left-2 sm:p-1 dark:text-slate-300 dark:hover:text-blue-400"
                        aria-label="编辑爱好"
                      >
                        <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>

                      <a
                        href={hobby.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block h-32 overflow-hidden relative"
                      >
                        <Image
                          src={hobby.pic_url}
                          alt={hobby.name}
                          fill
                          className="object-fit w-full h-full transition-transform duration-700 hover:scale-110"
                        />
                      </a>

                      <div className="p-3">
                        <div className="flex items-center mb-2">
                          <span className="mr-2 text-blue-500 dark:text-blue-400">{hobby.icon}</span>
                          <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200">
                            {hobby.name}
                          </h3>
                        </div>
                        <p className="text-slate-600 text-xs sm:text-sm line-clamp-2 dark:text-slate-300">
                          {hobby.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 自我评价部分 */}
        {activeSection === 'evaluations' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-b-xl shadow-sm border border-slate-200/50 border-t-0 overflow-hidden dark:bg-slate-800/40 dark:border-slate-700/50">
            <div className="py-3 px-6 border-b border-slate-200/50 flex justify-between items-center dark:border-slate-700/50">
              <h2 className="text-lg font-semibold text-blue-600 flex items-center dark:text-blue-400">
                <MessageSquare className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" />
                个人评价管理
              </h2>
              <button
                onClick={() => openEditDialog('evaluations')}
                className="px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm flex items-center transition-colors dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                添加评价
              </button>
            </div>

            <div className="p-2 lg:p-4 min-h-[90vh]">
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
                </div>
              ) : selfEvaluations.length === 0 ? (
                <div className="text-center py-10 text-slate-500 dark:text-slate-400">暂无评价数据</div>
              ) : (
                <div className="space-y-3">
                  {selfEvaluations.map((evaluation, index) => (
                    <div
                      key={evaluation.id}
                      className="bg-white/60 rounded-lg border border-slate-200/50 p-3 relative hover:bg-white/80 transition-all duration-300 dark:bg-slate-800/60 dark:border-slate-700/50 dark:hover:bg-slate-800/80"
                    >
                      <button
                        onClick={() => deleteItem('evaluations', index, evaluation.id)}
                        className="absolute top-3 right-3 text-slate-500 hover:text-red-500 transition-colors dark:text-slate-400 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditDialog('evaluations', evaluation, index)}
                        className="absolute top-3 right-10 text-slate-500 hover:text-blue-500 transition-colors dark:text-slate-400 dark:hover:text-blue-400"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <p className="text-slate-800 leading-relaxed pl-2 border-l-2 border-blue-500 dark:text-slate-200">
                        {evaluation.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 编辑对话框 - 修改后的版本，添加了高度限制和滚动功能 */}
        {dialogVisible && (
          <div className="fixed inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/90 rounded-xl border border-slate-200/50 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[80vh] flex flex-col dark:bg-slate-800 dark:border-slate-700">
              <div className="px-5 py-3 border-b border-slate-200/50 flex justify-between items-center flex-shrink-0 dark:border-slate-700/50">
                <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {activeSection === 'avatar'
                    ? '更换头像'
                    : isAddMode
                    ? `添加${getSectionName(activeSection)}`
                    : `编辑${getSectionName(activeSection)}`}
                </h3>
                <button
                  onClick={closeDialog}
                  className="text-slate-500 hover:text-slate-700 transition-colors dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-5 py-4 overflow-y-auto flex-1">
                {activeSection === 'avatar' ? (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-slate-300 dark:border-slate-700">
                        <Image
                          src={imageUrl}
                          alt="预览头像"
                          width={720}
                          height={480}
                          className="object-cover"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="flex items-center justify-center w-full px-4 py-2 border border-slate-300 rounded-lg cursor-pointer bg-white/60 text-slate-800 hover:bg-white/80 transition-colors dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800/80">
                        <Upload className="h-4 w-4 mr-2" />
                        <span>选择图片</span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleFileUpload}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeSection === 'skills' && (
                      <>
                        <div>
                          <label className="block text-sm text-slate-600 mb-1 dark:text-slate-400">技能名称</label>
                          <input
                            name="name"
                            type="text"
                            value={formData.name || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
                            placeholder="输入技能名称"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-600 mb-1 dark:text-slate-400">技能链接</label>
                          <input
                            name="url"
                            type="url"
                            value={formData.url || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
                            placeholder="输入技能相关链接"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-600 mb-1 dark:text-slate-400">技能类型</label>
                          <input
                            name="icon_src"
                            type="text"
                            value={formData.icon_src || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
                            placeholder="输入技能类型"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-600 mb-1 dark:text-slate-400">技能描述</label>
                          <textarea
                            name="desc"
                            value={formData.desc || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all min-h-[100px] dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
                            placeholder="输入技能描述"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-600 mb-1 dark:text-slate-400">排序优先级</label>
                          <input
                            name="rank"
                            type="text"
                            value={formData.rank || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
                            placeholder="输入排序优先级（数字）"
                          />
                          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
                            数字越小优先级越高，例如：1为最高优先级
                          </p>
                        </div>
                      </>
                    )}

                    {activeSection === 'works' && (
                      <>
                        <div>
                          <label className="block text-sm text-slate-600 mb-1 dark:text-slate-400">作品名称</label>
                          <input
                            name="name"
                            type="text"
                            value={formData.name || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
                            placeholder="输入作品名称"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-600 mb-1 dark:text-slate-400">作品类型</label>
                          <input
                            name="icon_src"
                            type="text"
                            value={formData.icon_src || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
                            placeholder="输入作品类型"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-600 mb-1 dark:text-slate-400">作品链接</label>
                          <input
                            name="url"
                            type="url"
                            value={formData.url || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
                            placeholder="输入作品链接"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-600 mb-1 dark:text-slate-400">作品图片URL</label>
                          <input
                            name="pic_url"
                            type="text"
                            value={formData.pic_url || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
                            placeholder="输入作品图片URL"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-600 mb-1 dark:text-slate-400">作品描述</label>
                          <textarea
                            name="desc"
                            value={formData.desc || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all min-h-[100px] dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
                            placeholder="输入作品描述"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-600 mb-1 dark:text-slate-400">排序优先级</label>
                          <input
                            name="rank"
                            type="text"
                            value={formData.rank || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
                            placeholder="输入排序优先级（数字）"
                          />
                          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
                            数字越小优先级越高，例如：1为最高优先级
                          </p>
                        </div>
                      </>
                    )}

                    {activeSection === 'hobbys' && (
                      <>
                        <div>
                          <label className="block text-sm text-slate-600 mb-1 dark:text-slate-400">爱好名称</label>
                          <input
                            name="name"
                            type="text"
                            value={formData.name || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
                            placeholder="输入爱好名称"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-600 mb-1 dark:text-slate-400">爱好类型</label>
                          <input
                            name="icon_src"
                            type="text"
                            value={formData.icon_src || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
                            placeholder="输入爱好类型"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-600 mb-1 dark:text-slate-400">相关链接</label>
                          <input
                            name="url"
                            type="url"
                            value={formData.url || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
                            placeholder="输入相关链接"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-600 mb-1 dark:text-slate-400">图片URL</label>
                          <input
                            name="pic_url"
                            type="text"
                            value={formData.pic_url || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
                            placeholder="输入图片URL"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-600 mb-1 dark:text-slate-400">爱好描述</label>
                          <textarea
                            name="desc"
                            value={formData.desc || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all min-h-[100px] dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
                            placeholder="输入爱好描述"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-600 mb-1 dark:text-slate-400">排序优先级</label>
                          <input
                            name="rank"
                            type="text"
                            value={formData.rank || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
                            placeholder="输入排序优先级（数字）"
                          />
                          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
                            数字越小优先级越高，例如：1为最高优先级
                          </p>
                        </div>
                      </>
                    )}

                    {activeSection === 'evaluations' && (
                      <>
                        <div>
                          <label className="block text-sm text-slate-600 mb-1 dark:text-slate-400">个人评价内容</label>
                          <textarea
                            name="name"
                            value={formData.name || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all min-h-[150px] dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
                            placeholder="输入评价内容"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-600 mb-1 dark:text-slate-400">排序优先级</label>
                          <input
                            name="rank"
                            type="text"
                            value={formData.rank || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
                            placeholder="输入排序优先级（数字）"
                          />
                          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
                            数字越小优先级越高，例如：1为最高优先级
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="px-5 py-3 border-t border-slate-200/50 flex justify-end gap-3 flex-shrink-0 dark:border-slate-700/50">
                <button
                  onClick={closeDialog}
                  className="px-4 py-2 rounded-lg border border-slate-300 bg-white/60 text-slate-800 hover:bg-white/80 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  取消
                </button>
                <button
                  onClick={activeSection === 'avatar' ? setAvatar : saveItem}
                  disabled={loading}
                  className={`px-4 py-2 rounded-lg transition duration-300 flex items-center justify-center gap-2 ${
                    loading
                      ? 'bg-slate-300 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                      : 'bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-500'
                  }`}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : activeSection === 'avatar' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>{activeSection === 'avatar' ? '确认更换' : '保存'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 密码重置对话框 */}
        {resetPasswordVisible && (
          <div className="fixed inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/90 rounded-xl border border-slate-200/50 w-full max-w-md overflow-hidden dark:bg-slate-800 dark:border-slate-700">
              <div className="p-5 border-b border-slate-200/50 flex justify-between items-center dark:border-slate-700/50">
                <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">重置密码</h3>
                <button
                  onClick={() => {
                    setResetPasswordVisible(false)
                    setNewPassword('')
                    setConfirmPassword('')
                    setPasswordError('')
                  }}
                  className="text-slate-500 hover:text-slate-700 transition-colors dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label htmlFor="newPassword" className="block text-sm text-slate-600 mb-1 dark:text-slate-400">
                    新密码
                  </label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
                    placeholder="请输入新密码"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm text-slate-600 mb-1 dark:text-slate-400">
                    确认密码
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
                    placeholder="请再次输入新密码"
                  />
                </div>

                {passwordError && <p className="text-red-500 text-sm mt-1 dark:text-red-400">{passwordError}</p>}
              </div>

              <div className="p-4 border-t border-slate-200/50 flex justify-end gap-3 dark:border-slate-700/50">
                <button
                  onClick={() => {
                    setResetPasswordVisible(false)
                    setNewPassword('')
                    setConfirmPassword('')
                    setPasswordError('')
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-300 bg-white/60 hover:bg-white/80 text-slate-800 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  取消
                </button>
                <button
                  onClick={resetPassword}
                  disabled={loading}
                  className={`px-4 py-2 rounded-lg transition duration-300 ${
                    loading
                      ? 'bg-slate-300 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                      : 'bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-500'
                  }`}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> : null}
                  确认重置
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}