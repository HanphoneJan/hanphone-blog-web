'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { useUser } from '@/contexts/UserContext'
import { ENDPOINTS } from '@/lib/api'
import apiClient from '@/lib/utils'
import {
  Search,
  Trash2,
  Loader2,
  User,
  Mail,
  MapPin,
  Calendar,
  Clock,
  X,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { showAlert } from '@/lib/Alert'

// 定义用户数据类型
interface User {
  id: number
  avatar: string
  nickname: string
  username: string
  email: string
  createTime: string
  lastLoginTime: string | null
  loginProvince: string
  loginCity: string
  type: '0' | '1' // 0: 普通用户, 1: 管理员
}

// 时间格式化函数
const dateFormat = (dateString: string): string => {
  if (!dateString) return ''
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

// 相对时间格式化
const timeAgo = (dateString: string): string => {
  if (!dateString) return '从未登录'

  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  let interval = Math.floor(seconds / 31536000)
  if (interval >= 1) {
    return `${interval}年前`
  }

  interval = Math.floor(seconds / 2592000)
  if (interval >= 1) {
    return `${interval}个月前`
  }

  interval = Math.floor(seconds / 86400)
  if (interval >= 1) {
    return `${interval}天前`
  }

  interval = Math.floor(seconds / 3600)
  if (interval >= 1) {
    return `${interval}小时前`
  }

  interval = Math.floor(seconds / 60)
  if (interval >= 1) {
    return `${interval}分钟前`
  }

  return '刚刚'
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

export default function UserManagementPage() {
  const [userList, setUserList] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [expandedUsers, setExpandedUsers] = useState<Set<number>>(new Set())
  const { userInfo } = useUser()

  // 切换用户详情展开状态
  const toggleUserExpanded = (userId: number) => {
    const newExpandedUsers = new Set(expandedUsers)
    if (newExpandedUsers.has(userId)) {
      newExpandedUsers.delete(userId)
    } else {
      newExpandedUsers.add(userId)
    }
    setExpandedUsers(newExpandedUsers)
  }

  // 获取用户列表
  const getUserList = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetchData(ENDPOINTS.ADMIN.USERS, 'GET', { search })

      if (res.code === 200) {
        let filteredData: User[] = res.data || []

        // 搜索过滤
        if (search) {
          const reg = new RegExp(search, 'i')
          filteredData = filteredData.filter(
            (item: User) => reg.test(item.nickname) || reg.test(item.username)
          )
        }

        setUserList(filteredData)
      } else {
        showAlert('获取用户信息失败！')
      }
    } catch (error) {
      console.error('获取用户列表出错:', error)
      showAlert('获取用户信息失败！')
    } finally {
      setLoading(false)
    }
  }, [search])

  // 页面加载时获取数据
  useEffect(() => {
    getUserList()
  }, [getUserList])

  // 处理搜索框回车
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      getUserList()
    }
  }

  // 修改用户权限状态
  const userStateChanged = async (row: User) => {
    try {
      setLoading(true)
      const res = await fetchData(ENDPOINTS.ADMIN.USER, 'POST', { user: row })

      if (res.code !== 200) {
        // 失败时恢复状态
        setUserList(prev =>
          prev.map(u => (u.id === row.id ? { ...u, type: u.type === '1' ? '0' : '1' } : u))
        )
        return showAlert('修改权限失败')
      }
      getUserList()
    } catch (error) {
      console.error('修改用户权限出错:', error)
      showAlert('修改权限失败')
    } finally {
      setLoading(false)
    }
  }

  // 删除用户
  const deleteUser = async (id: number) => {
    try {
      setLoading(true)
      const res = await fetchData(`${ENDPOINTS.ADMIN.USERS}/${id}/delete`, 'GET')

      if (res.code !== 200) {
        return showAlert('删除用户失败！')
      }
      showAlert('删除用户成功！')
      setConfirmDelete(null)
      getUserList()
    } catch (error) {
      console.error('删除用户出错:', error)
      showAlert('删除用户失败！')
    } finally {
      setLoading(false)
    }
  }

  // 渲染开关组件
  const renderSwitch = (checked: boolean, onChange: () => void, disabled: boolean) => (
    <div
      className={`relative w-10 h-5 rounded-full cursor-pointer transition-colors ${
        disabled ? 'bg-slate-300 dark:bg-slate-700' : checked ? 'bg-blue-600 dark:bg-blue-500' : 'bg-slate-400 dark:bg-slate-600'
      }`}
      onClick={disabled ? () => {} : onChange}
    >
      <div
        className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      >
        {checked && !disabled && (
          <Check className="absolute inset-0 m-auto w-3 h-3 text-blue-600 dark:text-blue-500" />
        )}
        {!checked && !disabled && <X className="absolute inset-0 m-auto w-3 h-3 text-slate-600 dark:text-slate-400" />}
      </div>
    </div>
  )

  return (
    <div className="font-sans min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-blue-50 text-slate-800 dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-200 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(50,100,200,0.1)_0%,transparent_40%),radial-gradient(circle_at_80%_80%,rgba(80,120,250,0.1)_0%,transparent_40%)] dark:opacity-100 opacity-0"></div>

      <main className="flex-1 w-full max-w-7xl mx-auto lg:px-2 lg:py-2 relative z-10">
        {/* 用户管理卡片 */}
        <div className="bg-white/80 backdrop-blur-sm lg:rounded-xl shadow-sm min-h-[100vh] border border-slate-200/50 overflow-hidden dark:bg-slate-800/40 dark:border-slate-700/50">
          {/* 搜索区域 - 合并搜索框和按钮 */}
          <div className="p-4 sm:p-6 border-b border-slate-200/50 dark:border-slate-700/50">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索用户名或昵称"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  className="w-full pl-10 pr-24 py-2 rounded-lg border border-slate-300 bg-white/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:ring-blue-500"
                />
                <button
                  onClick={() => getUserList()}
                  disabled={loading}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 rounded-md transition duration-300 flex items-center justify-center gap-1 ${
                    loading
                      ? 'bg-slate-300 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200'
                  }`}
                >
                  <span className="text-sm">搜索</span>
                </button>
              </div>
            </div>
          </div>

          {/* 用户列表 */}
          <div className="min-h-[90vh]">
            {loading ? (
              // 加载状态骨架屏
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 h-[400px] flex flex-col justify-center">
                {[1, 2, 3, 4, 5].map(item => (
                  <div key={item} className="flex animate-pulse gap-3 sm:gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-200/50 dark:bg-slate-700/50 flex-shrink-0"></div>
                    <div className="flex-1 grid grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-200/50 dark:bg-slate-700/50 rounded w-24"></div>
                        <div className="h-3 bg-slate-200/50 dark:bg-slate-700/50 rounded w-20"></div>
                      </div>
                      <div className="h-4 bg-slate-200/50 dark:bg-slate-700/50 rounded w-32 self-center"></div>
                      <div className="h-4 bg-slate-200/50 dark:bg-slate-700/50 rounded w-40 self-center hidden sm:block"></div>
                      <div className="h-6 bg-slate-200/50 dark:bg-slate-700/50 rounded w-16 self-center"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : userList.length > 0 ? (
              <div>
                {/* 桌面端列表表头 */}
                <div className="hidden lg:grid grid-cols-12 gap-4 px-4 sm:px-6 py-4 text-sm font-medium text-slate-500 dark:text-slate-400 border-b border-slate-200/50 dark:border-slate-700/50">
                  <div className="col-span-1">序号</div>
                  <div className="col-span-2">用户信息</div>
                  <div className="col-span-2">账号信息</div>
                  <div className="col-span-2">注册时间</div>
                  <div className="col-span-1">最近登录</div>
                  <div className="col-span-2">地址</div>
                  <div className="col-span-1">管理员</div>
                  <div className="col-span-1">操作</div>
                </div>

                {/* 列表内容 */}
                <ul className="lg:divide-y lg:divide-slate-200/30 dark:lg:divide-slate-700/30">
                  {userList.map((user, index) => (
                    <li
                      key={user.id}
                      className={`px-3 sm:px-4 lg:px-6 py-3 sm:py-4 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors ${
                        index > 0 ? 'lg:border-t-0 border-t border-slate-200/30 dark:border-slate-700/30' : ''
                      }`}
                    >
                      {/* 移动端和中等屏幕布局 */}
                      <div className="lg:hidden">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700 flex-shrink-0">
                              <Image
                                src={user.avatar || '/default-avatar.png'}
                                alt={`${user.nickname}的头像`}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-blue-600 dark:text-blue-400 text-sm truncate">
                                {user.nickname}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                @{user.username}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex-shrink-0">
                              {renderSwitch(
                                user.type === '1',
                                () =>
                                  userStateChanged({
                                    ...user,
                                    type: user.type === '1' ? '0' : '1'
                                  }),
                                Number(userInfo?.id) === user.id || user.id === 1
                              )}
                            </div>

                            <button
                              onClick={() => setConfirmDelete(user.id)}
                              disabled={Number(userInfo?.id) === user.id || user.id === 1}
                              className={`p-1.5 rounded-full transition-colors ${
                                Number(userInfo?.id) === user.id || user.id === 1
                                  ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
                                  : 'text-red-500 hover:bg-red-500/10 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300'
                              }`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => toggleUserExpanded(user.id)}
                              className="p-1.5 rounded-full text-slate-500 hover:bg-slate-200/50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-slate-200 transition-colors"
                            >
                              {expandedUsers.has(user.id) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* 移动端用户详情展开区域 */}
                        {expandedUsers.has(user.id) && (
                          <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/50 space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                              <span className="text-slate-600 dark:text-slate-400 min-w-[60px]">邮箱：</span>
                              <span className="text-slate-800 dark:text-slate-200 truncate">{user.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                              <span className="text-slate-600 dark:text-slate-400 min-w-[60px]">注册：</span>
                              <span className="text-slate-800 dark:text-slate-200 truncate">
                                {dateFormat(user.createTime)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                              <span className="text-slate-600 dark:text-slate-400 min-w-[60px]">登录：</span>
                              <span className="text-slate-800 dark:text-slate-200 truncate">
                                {user.lastLoginTime ? timeAgo(user.lastLoginTime) : '从未登录'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                              <span className="text-slate-600 dark:text-slate-400 min-w-[60px]">地址：</span>
                              <span className="text-slate-800 dark:text-slate-200 truncate">
                                {user.loginProvince} {user.loginCity}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 桌面端布局 */}
                      <div className="hidden lg:grid grid-cols-12 gap-4 items-center">
                        {/* 序号 */}
                        <div className="col-span-1 text-slate-500 dark:text-slate-400 text-sm">{index + 1}</div>

                        {/* 用户信息 */}
                        <div className="col-span-2 flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700 flex-shrink-0">
                            <Image
                              src={user.avatar || '/default-avatar.png'}
                              alt={`${user.nickname}的头像`}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-blue-600 dark:text-blue-400 truncate">
                              {user.nickname}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">@{user.username}</div>
                          </div>
                        </div>

                        {/* 账号信息 */}
                        <div className="col-span-2 flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                          <span className="text-slate-800 dark:text-slate-200 truncate">{user.email}</span>
                        </div>

                        {/* 注册时间 */}
                        <div className="col-span-2 flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                          <span className="text-slate-800 dark:text-slate-200 truncate">
                            {dateFormat(user.createTime)}
                          </span>
                        </div>

                        {/* 最近登录 */}
                        <div className="col-span-1 flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                          <span className="text-slate-800 dark:text-slate-200 truncate">
                            {user.lastLoginTime ? timeAgo(user.lastLoginTime) : '从未登录'}
                          </span>
                        </div>

                        {/* 地址 */}
                        <div className="col-span-2 flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                          <span className="text-slate-800 dark:text-slate-200 truncate">
                            {user.loginProvince} {user.loginCity}
                          </span>
                        </div>

                        {/* 管理员开关 */}
                        <div className="col-span-1 flex items-center">
                          {renderSwitch(
                            user.type === '1',
                            () =>
                              userStateChanged({
                                ...user,
                                type: user.type === '1' ? '0' : '1'
                              }),
                            Number(userInfo?.id) === user.id || user.id === 1
                          )}
                        </div>

                        {/* 操作按钮 */}
                        <div className="col-span-1">
                          <button
                            onClick={() => setConfirmDelete(user.id)}
                            disabled={Number(userInfo?.id) === user.id || user.id === 1}
                            className={`p-1.5 rounded-full transition-colors ${
                              Number(userInfo?.id) === user.id || user.id === 1
                                ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
                                : 'text-red-500 hover:bg-red-500/10 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300'
                            }`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              // 空状态
              <div className="flex flex-col items-center justify-center h-[400px] text-slate-500 dark:text-slate-400">
                <User className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm">暂无用户数据</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 删除确认弹窗 */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 rounded-xl border border-slate-200/50 w-full max-w-md p-5 sm:p-6 dark:bg-slate-800 dark:border-slate-700">
            <h3 className="text-base sm:text-lg font-semibold text-blue-600 mb-2 dark:text-blue-400">确认删除</h3>
            <p className="text-slate-600 mb-5 sm:mb-6 text-sm sm:text-base dark:text-slate-300">确定要删除该用户吗？此操作不可撤销。</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-3 sm:px-4 py-2 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                取消
              </button>
              <button
                onClick={() => deleteUser(confirmDelete)}
                disabled={loading}
                className="px-3 sm:px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-500 transition-colors flex items-center gap-2 text-sm"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}