'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { X, Plus, Trash2, Loader2 } from 'lucide-react'
import { ENDPOINTS } from '@/lib/api'
import { useUser } from '@/contexts/UserContext'
import md5 from 'md5'
import Compressor from 'compressorjs' // 引入compressorjs

// 用户数据类型定义
interface User {
  username: string
  nickname: string
  avatar: string
  email: string
  password: string
  type: number
  loginProvince?: string
  loginCity?: string
  loginLat?: number
  loginLng?: number
}

// 表单数据类型定义
interface FormData {
  nickname: string
  username: string
  password: string
  email: string
}

// 错误信息类型
interface FormErrors {
  nickname?: string
  username?: string
  password?: string
  email?: string
}

interface RegisterFormProps {
  visible: boolean
  onClose: () => void
}

const RegisterForm: React.FC<RegisterFormProps> = ({ visible, onClose }) => {
  const { setUserInfo, setToken } = useUser()
  const [formData, setFormData] = useState<FormData>({
    nickname: '',
    username: '',
    password: '',
    email: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({
    text: '',
    type: ''
  })
  const uploadRef = useRef<HTMLInputElement>(null) // 上传input的ref

  // 当visible变化时重置表单
  useEffect(() => {
    if (!visible) {
      resetForm()
    }
  }, [visible])

  // 修复Headers类型错误的API请求函数
  const fetchData = async (url: string, method: string = 'GET', data?: unknown) => {
    try {
      // 初始化选项对象
      const options: RequestInit = { method }

      // 处理请求头
      if (!(data instanceof FormData)) {
        options.headers = {
          'Content-Type': 'application/json'
        }
      }

      // 处理请求体
      if (data) {
        // 上传文件时特殊处理
        if (data instanceof FormData) {
          delete options.headers
          options.body = data
        } else {
          options.body = JSON.stringify(data)
        }
      }

      const res = await fetch(url, options)
      console.log('res' + res)
      const result = await res.json()

      return result
    } catch (error) {
      console.log(`Error ${method} ${url}:`, error)
      throw error
    }
  }

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type })
    setTimeout(() => setMessage({ text: '', type: '' }), 3000)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.nickname) {
      newErrors.nickname = '请输入昵称'
    } else if (formData.nickname.length < 2 || formData.nickname.length > 10) {
      newErrors.nickname = '长度在2-10个字符之间'
    }

    if (!formData.username) {
      newErrors.username = '请输入用户名'
    } else if (formData.username.length < 2 || formData.username.length > 10) {
      newErrors.username = '长度在2-10个字符之间'
    }

    if (!formData.password) {
      newErrors.password = '请输入密码'
    } else if (formData.password.length < 6 || formData.password.length > 10) {
      newErrors.password = '长度在6到10个字符'
    }

    if (!formData.email) {
      newErrors.email = '请输入邮箱'
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

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
          formData.append('namespace', 'blog/user')
          formData.append('file', compressedFile) // 使用带有原始文件名的压缩文件
          const data = await fetchData(ENDPOINTS.FILE.UPLOAD, 'POST', formData)
          if (data?.url) {
            setAvatarUrl(data?.url)
            showMessage('头像压缩并上传成功', 'success')
          } else {
            showMessage('头像上传失败', 'error')
          }
        } catch (error) {
          console.log('上传失败:', error)
          showMessage('头像上传失败', 'error')
        } finally {
          setUploading(false)
          if (uploadRef.current) uploadRef.current.value = ''
        }
      },
      error: err => {
        console.error('图片压缩失败:', err)
        showMessage('图片压缩失败，请重试', 'error')
        setUploading(false)
        if (uploadRef.current) uploadRef.current.value = ''
      }
    })
  }

  const handleRemoveAvatar = () => {
    setAvatarUrl('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      const encryptedPassword = md5(formData.password)
      const user: User = {
        ...formData,
        password: encryptedPassword,
        avatar: avatarUrl,
        type: 0
      }

      const response = await fetchData(ENDPOINTS.REGISTER, 'POST', { user })

      showMessage('注册成功', 'success')

      // 使用context的setter方法更新用户状态
      setToken(response.data.token)
      setUserInfo(response.data.user)

      // 注册成功后关闭表单
      setTimeout(() => {
        onClose()
      }, 1000)
    } catch (error) {
      console.log('注册错误' + error)
      showMessage('注册失败，请稍后重试', 'error')
    }
  }

  const resetForm = () => {
    setFormData({
      nickname: '',
      username: '',
      password: '',
      email: ''
    })
    setAvatarUrl('')
    setErrors({})
    setMessage({ text: '', type: '' })
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50 w-full max-w-md transform transition-all">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-slate-700/50">
          <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-100">请注册</h3>
          <button
            onClick={onClose}
            className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {message.text && (
          <div
            className={`px-6 py-2 text-sm ${
              message.type === 'success'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label
              htmlFor="nickname"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              昵称
            </label>
            <input
              id="nickname"
              name="nickname"
              type="text"
              value={formData.nickname}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.nickname
                  ? 'border-red-500 focus:ring-red-500/50'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500/50 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-100'
              }`}
            />
            {errors.nickname && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.nickname}</p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              用户名
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.username
                  ? 'border-red-500 focus:ring-red-500/50'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500/50 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-100'
              }`}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.username}</p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              密码
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.password
                  ? 'border-red-500 focus:ring-red-500/50'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500/50 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-100'
              }`}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              邮箱
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.email
                  ? 'border-red-500 focus:ring-red-500/50'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500/50 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-100'
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              头像
            </label>
            <div className="relative">
              <input
                ref={uploadRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
                id="avatar-upload"
              />

              <label
                htmlFor="avatar-upload"
                className={`cursor-pointer ${uploading ? 'opacity-70' : ''}`}
              >
                {avatarUrl ? (
                  <div className="relative w-24 h-24 rounded-md overflow-hidden border border-slate-300 dark:border-slate-700">
                    <Image
                      src={avatarUrl}
                      alt="用户头像"
                      width={144}
                      height={144}
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={e => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleRemoveAvatar()
                      }}
                      className="absolute top-0 right-0 bg-black/50 text-white dark:text-slate-200 p-1 hover:bg-black/70 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-md border-2 border-dashed border-slate-400 dark:border-slate-600 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                    <Plus className="h-6 w-6 mb-1" />
                    <span className="text-xs">上传头像</span>
                  </div>
                )}
              </label>

              {uploading && (
                <div className="absolute top-0 left-0 w-full h-full bg-white/70 dark:bg-slate-900/70 flex items-center justify-center rounded-md">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
              图片将自动压缩为JPEG格式，最大尺寸1200x1200px，保持原始文件名
            </p>
          </div>
        </form>

        <div className="px-6 py-3 bg-slate-100 dark:bg-slate-900/30 flex justify-end rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/50 mr-2 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            onClick={e => handleSubmit(e)}
            disabled={uploading}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-600/80 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-700/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500/50 disabled:opacity-50 transition-colors"
          >
            {uploading && <Loader2 className="h-4 w-4 animate-spin inline mr-2" />}
            注册
          </button>
        </div>
      </div>
    </div>
  )
}

export default RegisterForm
