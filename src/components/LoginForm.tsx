'use client'

import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { ENDPOINTS } from '@/lib/api'
import { useUser } from '@/contexts/UserContext'
import md5 from 'md5'
import { getLocationInfo } from '@/lib/location' // 导入server action

// 登录表单数据类型
interface LoginFormData {
  username: string
  password: string
}

// 重置密码表单数据类型
interface ResetFormData {
  email: string
  captcha: string
  newPassword: string
}

// 错误信息类型
interface LoginErrors {
  username?: string
  password?: string
}

interface ResetErrors {
  email?: string
  captcha?: string
  newPassword?: string
}

// 位置信息类型
interface LocationInfo {
  loginProvince: string
  loginCity: string
  loginLat: number
  loginLng: number
}

interface AuthFormProps {
  visible: boolean
  onClose: () => void
}

const AuthForm: React.FC<AuthFormProps> = ({ visible, onClose }) => {
  const { setUserInfo, setToken, setRefreshToken, onShowRegister, setExpire } = useUser()
  const [isResetMode, setIsResetMode] = useState(false)

  // 明确声明loginData的类型
  const [loginData, setLoginData] = useState<LoginFormData>({
    username: '',
    password: ''
  })
  const [loginErrors, setLoginErrors] = useState<LoginErrors>({})

  const [resetData, setResetData] = useState<ResetFormData>({
    email: '',
    captcha: '',
    newPassword: ''
  })
  const [resetErrors, setResetErrors] = useState<ResetErrors>({})
  const [countdown, setCountdown] = useState(0)

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({
    text: '',
    type: ''
  })
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null)

  useEffect(() => {
    if (!visible) {
      resetAllForms()
      setIsResetMode(false)
    } else if (!isResetMode) {
      fetchLocationInfo()
    }
  }, [visible, isResetMode])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // 重构后的API调用函数，与项目中保持一致
  const fetchData = async (url: string, method: string = 'GET', data?: unknown) => {
    try {
      setLoading(true)
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      }

      if (data) {
        options.body = JSON.stringify(data)
      }

      const res = await fetch(url, options)
      const result = await res.json()

      setLoading(false)
      return result
    } catch (error) {
      console.log(`Error ${method} ${url}:`, error)
      setLoading(false)
      throw error
    }
  }

  // 使用server action获取位置信息
  const fetchLocationInfo = async () => {
    try {
      const location = await getLocationInfo()
      setLocationInfo(location)
    } catch (error) {
      console.log('获取地理位置失败:', error)
      // 使用默认位置信息
      setLocationInfo({
        loginProvince: '',
        loginCity: '',
        loginLat: 30.27,
        loginLng: 103.08
      })
    }
  }

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type })
    setTimeout(() => setMessage({ text: '', type: '' }), 3000)
  }

  const handleLoginInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setLoginData(prev => ({ ...prev, [name]: value }))

    if (loginErrors[name as keyof LoginErrors]) {
      setLoginErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleResetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setResetData(prev => ({ ...prev, [name]: value }))

    if (resetErrors[name as keyof ResetErrors]) {
      setResetErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const validateLoginForm = (): boolean => {
    const newErrors: LoginErrors = {}

    if (!loginData.username) {
      newErrors.username = '请输入用户名'
    } else if (loginData.username.length < 2 || loginData.username.length > 10) {
      newErrors.username = '长度在2-10个字符之间'
    }

    if (!loginData.password) {
      newErrors.password = '请输入密码'
    } else if (loginData.password.length < 6 || loginData.password.length > 10) {
      newErrors.password = '长度在6到10个字符'
    }

    setLoginErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateResetForm = (): boolean => {
    const newErrors: ResetErrors = {}

    if (!resetData.email) {
      newErrors.email = '请输入邮箱'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetData.email)) {
      newErrors.email = '请输入有效的邮箱地址'
    }

    if (!resetData.captcha) {
      newErrors.captcha = '请输入验证码'
    } else if (resetData.captcha.length !== 6) {
      newErrors.captcha = '验证码长度为6位'
    }

    if (!resetData.newPassword) {
      newErrors.newPassword = '请输入新密码'
    } else if (resetData.newPassword.length < 6 || resetData.newPassword.length > 10) {
      newErrors.newPassword = '密码长度在6到10个字符'
    }

    setResetErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 修改handleLoginSubmit方法中对locationInfo的判断逻辑
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateLoginForm()) return

    // 移除locationInfo存在性的判断，使用默认值兜底
    const loginLocation = locationInfo || {
      loginProvince: '',
      loginCity: '',
      loginLat: 30.27,
      loginLng: 103.08
    }

    try {
      const requestPayload = {
        user: {
          username: loginData.username,
          password: md5(loginData.password),
          ...loginLocation
        }
      }

      const response = await fetchData(ENDPOINTS.LOGIN, 'POST', requestPayload)

      if (response.code === 200) {
        setUserInfo({
          avatar: response.data.user.avatar || '/default-avatar.png',
          nickname: response.data.user.nickname,
          type: response.data.user.type,
          email: response.data.user.email,
          id: response.data.user.id,
          username: response.data.user.username,
          loginProvince: response.data.user.loginProvince,
          loginCity: response.data.user.loginCity
        })
        setToken(response.data.token)
        setRefreshToken(response.data.refreshToken)
        setExpire(response.data.expire)

        window.localStorage.setItem('token', JSON.stringify(response.data.token))
        window.localStorage.setItem('userInfo', JSON.stringify(response.data.user))
        window.localStorage.setItem('expire', JSON.stringify(response.data.expire))

        showMessage('登录成功', 'success')

        setTimeout(() => {
          onClose()
        }, 1000)
      } else {
        showMessage(response.message || '登录失败', 'error')
      }
    } catch (err) {
      showMessage('登录失败，请检查用户名和密码', 'error')
      console.log('登录错误' + err)
    }
  }

  const getCaptcha = async () => {
    if (!resetData.email) {
      setResetErrors(prev => ({ ...prev, email: '请输入邮箱' }))
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetData.email)) {
      setResetErrors(prev => ({ ...prev, email: '请输入有效的邮箱地址' }))
      return
    }

    try {
      const response = await fetchData(ENDPOINTS.USER.SEND_CAPTCHA, 'POST', {
        email: resetData.email
      })
      if (response.code === 200) {
        showMessage('验证码已发送到您的邮箱，请查收', 'success')
        setCountdown(60)
      } else {
        showMessage(response.message || '获取验证码失败', 'error')
      }
    } catch (error) {
      showMessage('获取验证码失败，请稍后再试', 'error')
      console.log('发送验证码错误' + error)
    }
  }

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateResetForm()) return

    try {
      const resetFormData = {
        email: resetData.email,
        captcha: resetData.captcha,
        newPassword: md5(resetData.newPassword)
      }

      const response = await fetchData(ENDPOINTS.USER.FORGET_PASSWORD, 'POST', resetFormData)
      if (response.code === 200) {
        showMessage('密码重置成功，请登录', 'success')
        setTimeout(() => {
          setIsResetMode(false)
        }, 1500)
      } else {
        showMessage(response.message || '密码重置失败', 'error')
      }
    } catch (error) {
      showMessage('密码重置失败，请检查信息是否正确', 'error')
      console.log('重置密码失败' + error)
    }
  }

  const resetAllForms = () => {
    setLoginData({
      username: '',
      password: ''
    })
    setLoginErrors({})

    setResetData({
      email: '',
      captcha: '',
      newPassword: ''
    })
    setResetErrors({})
    setCountdown(0)

    setMessage({ text: '', type: '' })
    setLoading(false)
    setLocationInfo(null)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50 w-full max-w-md transform transition-all duration-300 hover:shadow-xl hover:border-blue-800/50">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-slate-700/50">
          <h2 className="text-lg font-semibold text-blue-600 dark:text-blue-100">
            {isResetMode ? '找回密码' : '登录'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {message.text && (
          <div
            className={`px-6 py-2 text-sm ${
              message.type === 'success'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300'
                : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={isResetMode ? handleResetSubmit : handleLoginSubmit} className="p-6">
          {isResetMode ? (
            <>
              <div className="mb-4">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  邮箱
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={resetData.email}
                  onChange={handleResetInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    resetErrors.email
                      ? 'border-red-500 focus:ring-red-500/50'
                      : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500/50 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-100'
                  }`}
                  placeholder="请输入注册邮箱"
                />
                {resetErrors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{resetErrors.email}</p>
                )}
              </div>

              <div className="mb-4">
                <label
                  htmlFor="captcha"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  验证码
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="captcha"
                    name="captcha"
                    value={resetData.captcha}
                    onChange={handleResetInputChange}
                    className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      resetErrors.captcha
                        ? 'border-red-500 focus:ring-red-500/50'
                        : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500/50 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-100'
                    }`}
                    placeholder="请输入验证码"
                  />
                  <button
                    type="button"
                    onClick={getCaptcha}
                    disabled={loading || countdown > 0}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {countdown > 0 ? `重新发送(${countdown}s)` : '获取验证码'}
                  </button>
                </div>
                {resetErrors.captcha && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {resetErrors.captcha}
                  </p>
                )}
              </div>

              <div className="mb-6">
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  新密码
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={resetData.newPassword}
                  onChange={handleResetInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    resetErrors.newPassword
                      ? 'border-red-500 focus:ring-red-500/50'
                      : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500/50 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-100'
                  }`}
                  placeholder="请输入新密码"
                />
                {resetErrors.newPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {resetErrors.newPassword}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="mb-4">
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  用户名
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={loginData.username}
                  onChange={handleLoginInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    loginErrors.username
                      ? 'border-red-500 focus:ring-red-500/50'
                      : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500/50 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-100'
                  }`}
                  placeholder="请输入用户名"
                />
                {loginErrors.username && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {loginErrors.username}
                  </p>
                )}
              </div>

              <div className="mb-6">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  密码
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={loginData.password}
                  onChange={handleLoginInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    loginErrors.password
                      ? 'border-red-500 focus:ring-red-500/50'
                      : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500/50 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-100'
                  }`}
                  placeholder="请输入密码"
                />
                {loginErrors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {loginErrors.password}
                  </p>
                )}
              </div>
            </>
          )}
        </form>
        <div className="px-6 py-3 rounded-b-xl">
          <button
            type="submit"
            onClick={e => (isResetMode ? handleResetSubmit(e) : handleLoginSubmit(e))}
            disabled={loading}
            className="w-full py-2 bg-blue-600 dark:bg-blue-600/80 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-700/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500/50 disabled:opacity-50 transition-colors mb-3"
          >
            {loading
              ? isResetMode
                ? '重置中...'
                : '登录中...'
              : isResetMode
              ? '重置密码'
              : '登录'}
          </button>

          {isResetMode ? (
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
              想起密码了？{' '}
              <button
                onClick={() => setIsResetMode(false)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                立即登录
              </button>
            </p>
          ) : (
            <div className="flex justify-center items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
              <p>
                还没有账号？{' '}
                <button
                  onClick={() => {
                    onClose()
                    onShowRegister()
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  立即注册
                </button>
              </p>
              <span className="text-slate-400 dark:text-slate-600">|</span>
              <p>
                忘记密码？{' '}
                <button
                  onClick={() => setIsResetMode(true)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  找回密码
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthForm
