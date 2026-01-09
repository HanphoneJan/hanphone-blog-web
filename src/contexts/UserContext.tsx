'use client'
// 代码执行的顺序很重要
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

// 扩展用户信息类型，增加更多可能的字段
interface UserInfo {
  avatar?: string
  nickname?: string
  username?: string
  type?: string
  id: number | null // 新增用户ID字段
  email?: string // 新增邮箱字段
  loginProvince?: string // 新增登录省份字段
  loginCity?: string // 新增登录城市字段
}

// 定义上下文类型 - 增加了setAdministrator方法定义
interface UserContextType {
  userInfo: UserInfo | null
  token: string | null
  refreshToken: string | null
  expire: string | null // 新增expire字段
  administrator: boolean
  loginFormVisiable: boolean
  registorFormVisiable: boolean
  pageName: string
  setUserInfo: (info: UserInfo | null) => void
  updateUserInfo: (info: Partial<UserInfo>) => void // 新增部分更新方法
  setToken: (token: string | null) => void
  setRefreshToken: (refreshToken: string | null) => void
  setExpire: (expire: string | null) => void // 新增expire设置方法
  setLoginFormVisiable: (visible: boolean) => void
  setRegistorFormVisiable: (visible: boolean) => void
  setPageName: (name: string) => void
  setAdministrator: (isAdmin: boolean) => void // 修复：添加到接口定义
  onLogout: () => void
  onShowLogin: () => void
  onShowRegister: () => void
  onManageBlog: () => void
  refreshAccessToken: () => Promise<boolean>
}

// 创建上下文并提供默认值（避免undefined检查）
const UserContext = createContext<UserContextType>({
  userInfo: null,
  token: null,
  refreshToken: null,
  expire: null, // 初始化expire默认值
  administrator: false,
  loginFormVisiable: false,
  registorFormVisiable: false,
  pageName: 'index',
  setUserInfo: () => {},
  updateUserInfo: () => {}, // 初始化默认方法
  setToken: () => {},
  setRefreshToken: () => {},
  setExpire: () => {}, // 初始化expire默认方法
  setLoginFormVisiable: () => {},
  setRegistorFormVisiable: () => {},
  setAdministrator: () => {}, // 修复：提供默认实现
  setPageName: () => {},
  onLogout: () => {},
  onShowLogin: () => {},
  onShowRegister: () => {},
  onManageBlog: () => {},
  refreshAccessToken: async () => false
})

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const router = useRouter()

  // 状态初始化
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const [expire, setExpire] = useState<string | null>(null) // 新增expire状态
  const [administrator, setAdministrator] = useState<boolean>(false)
  const [loginFormVisiable, setLoginFormVisiable] = useState<boolean>(false)
  const [registorFormVisiable, setRegistorFormVisiable] = useState<boolean>(false)
  const [pageName, setPageName] = useState<string>('index')

  // 检查token是否过期的辅助函数
  const isTokenExpired = (expireTime: string | null): boolean => {
    if (!expireTime) return true

    try {
      // 解析过期时间（支持ISO格式字符串）
      const expireDate = new Date(expireTime)
      const now = new Date()
      // 检查是否过期（提前1分钟过期，避免网络延迟问题）
      return expireDate.getTime() - now.getTime() < 60000
    } catch (error) {
      console.error('Failed to parse expire time:', error)
      return true // 解析失败视为过期
    }
  }

  // 从localStorage加载状态（增加错误处理的详细信息和过期检查）
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('userInfo')
      const storedToken = localStorage.getItem('token')
      const storedRefreshToken = localStorage.getItem('refreshToken')
      const storedExpire = localStorage.getItem('expire')

      // 检查是否过期
      const expired = isTokenExpired(storedExpire ? JSON.parse(storedExpire) : null)

      if (expired) {
        console.log('Token has expired, logging out user')
        // 清除过期数据
        // localStorage.removeItem('userInfo')
        // localStorage.removeItem('token')
        // localStorage.removeItem('refreshToken')
        // localStorage.removeItem('expire')
        // console.log('Cleared expired user data from localStorage')
        return // 不加载过期数据
      }

      if (storedUser) {
        const parsedUser: UserInfo = JSON.parse(storedUser)
        setUserInfo(parsedUser)
        console.log('Loaded user from localStorage')
        // 根据用户类型设置管理员状态
        setAdministrator(parsedUser.type === '1')
      }

      if (storedToken) {
        setToken(JSON.parse(storedToken))
      }

      if (storedRefreshToken) {
        setRefreshToken(JSON.parse(storedRefreshToken))
      }

      if (storedExpire) {
        setExpire(JSON.parse(storedExpire))
      }
    } catch (error) {
      console.log(
        'Failed to load user data from localStorage:',
        error instanceof Error ? error.message : error
      )
      // 清除可能损坏的本地存储数据
      localStorage.removeItem('userInfo')
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('expire')
    }
  }, [])

  // 监听用户信息变化，自动更新管理员状态
  useEffect(() => {
    if (userInfo) {
      setAdministrator(userInfo.type === '1')
    } else {
      setAdministrator(false)
    }
  }, [userInfo])

  // 监听expire变化，同步到localStorage
  useEffect(() => {
    if (expire) {
      localStorage.setItem('expire', JSON.stringify(expire))
    } else {
      localStorage.removeItem('expire')
    }
  }, [expire])

  // 修改token状态监听，添加cookie同步
  // useEffect(() => {
  //   if (token) {
  //     localStorage.setItem('token', JSON.stringify(token));
  //     syncTokenToCookie(token); // 同步到cookie
  //   } else {
  //     localStorage.removeItem('token');
  //     console.log('Token removed, clearing cookie');
  //     syncTokenToCookie(null); // 清除cookie
  //   }
  // }, [token]);

  // const syncTokenToCookie = (token: string | null) => {
  //   if (typeof document !== 'undefined') {
  //     if (token) {
  //       const date = new Date();
  //       date.setTime(date.getTime() + (7 * 24 * 60 * 60 * 1000));
  //       const expires = `expires=${date.toUTCString()}`;
  //       // 核心跨域配置：SameSite=None（允许跨域携带） + Secure（HTTPS 环境强制要求）
  //       document.cookie = `auth_token=${token}; ${expires}; path=/; SameSite=None; Secure`;
  //     } else {
  //       // 清除 Cookie 时需保持与设置时一致的跨域/路径配置，否则无法正确清除
  //       document.cookie = `auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure`;
  //     }
  //   }
  // };

  // 新增：部分更新用户信息的方法
  const updateUserInfo = (info: Partial<UserInfo>) => {
    if (!userInfo) return
    // 合并现有信息和新信息
    const updatedInfo = { ...userInfo, ...info }
    setUserInfo(updatedInfo)
    // 更新本地存储
    localStorage.setItem('userInfo', JSON.stringify(updatedInfo))
  }

  // 退出登录处理（增加路由跳转）
  const onLogout = () => {
    localStorage.removeItem('userInfo')
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('expire') // 清除expire数据
    setUserInfo(null)
    setToken(null)
    setRefreshToken(null)
    setExpire(null) // 重置expire状态
    setAdministrator(false)
    router.push('/') // 退出后跳转到首页
  }

  // 显示登录表单
  const onShowLogin = () => {
    setLoginFormVisiable(true)
    setRegistorFormVisiable(false)
  }

  // 显示注册表单
  const onShowRegister = () => {
    setRegistorFormVisiable(true)
    setLoginFormVisiable(false)
  }

  // 管理博客处理
  const onManageBlog = () => {
    if (administrator) {
      router.push('/admin')
    } else if (!token) {
      onShowLogin()
    } else {
      router.push('/error?message=您没有管理员权限，无法访问管理页面')
    }
  }

  // 刷新访问令牌（增强错误处理）
  const refreshAccessToken = async (): Promise<boolean> => {
    if (!refreshToken) {
      console.log('No refresh token available')
      onLogout()
      return false
    }

    try {
      const response = await fetch('/api/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to refresh token')
      }

      const data = await response.json()

      if (data.token) {
        setToken(data.token)
        if (data.refreshToken) {
          setRefreshToken(data.refreshToken)
        }
        if (data.expire) {
          // 处理expire数据
          setExpire(data.expire)
        }
        return true
      }

      return false
    } catch (error) {
      console.log('Error refreshing access token:', error instanceof Error ? error.message : error)
      onLogout()
      return false
    }
  }

  return (
    <UserContext.Provider
      value={{
        userInfo,
        token,
        refreshToken,
        expire, // 提供expire字段
        administrator,
        loginFormVisiable,
        registorFormVisiable,
        pageName,
        setUserInfo,
        updateUserInfo, // 暴露更新方法
        setToken,
        setRefreshToken,
        setExpire, // 提供setExpire方法
        setLoginFormVisiable,
        setRegistorFormVisiable,
        setPageName,
        setAdministrator, // 修复：将状态更新函数添加到上下文
        onLogout,
        onShowLogin,
        onShowRegister,
        onManageBlog,
        refreshAccessToken
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

// 自定义Hook简化上下文使用
export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
