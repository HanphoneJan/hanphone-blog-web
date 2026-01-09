'use client'

import { useState, useEffect, useReducer } from 'react'
import Image from 'next/image'
import { useUser } from '@/contexts/UserContext'
import { ENDPOINTS } from '@/lib/api'
import { MessageSquare, Send, Reply, Delete, User } from 'lucide-react'
import { showAlert } from '@/lib/Alert'

interface Message {
  id: number
  nickname: string
  avatar: string
  content: string
  createTime: string
  parentMessage: Message | null
  adminMessage: boolean
  children?: Message[]
}

interface MessageForm {
  content: string
}

interface ReplyForm {
  [key: number]: string
}

// 定义消息操作的类型
type MessageAction =
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'ADD_REPLY'; payload: { parentId: number; reply: Message } }
  | { type: 'DELETE_MESSAGE'; payload: number }
  | { type: 'DELETE_REPLY'; payload: { parentId: number; replyId: number } }

// 消息状态管理reducer
const messageReducer = (state: Message[], action: MessageAction): Message[] => {
  switch (action.type) {
    case 'SET_MESSAGES':
      return action.payload

    case 'ADD_MESSAGE':
      return [action.payload, ...state]

    case 'ADD_REPLY':
      const { parentId, reply } = action.payload
      return state.map(message => {
        if (message.id === parentId) {
          return {
            ...message,
            children: [...(message.children || []), reply]
          }
        }

        // 检查是否是回复的子回复
        if (message.children) {
          const updatedChildren = message.children.map(child => {
            if (child.id === parentId) {
              return {
                ...child,
                children: [...(child.children || []), reply]
              }
            }
            return child
          })

          // 如果有子回复被更新，返回更新后的消息
          if (JSON.stringify(updatedChildren) !== JSON.stringify(message.children)) {
            return {
              ...message,
              children: updatedChildren
            }
          }
        }

        return message
      })

    case 'DELETE_MESSAGE':
      return state.filter(message => message.id !== action.payload)

    case 'DELETE_REPLY':
      const { parentId: pId, replyId } = action.payload
      return state.map(message => {
        if (message.id === pId) {
          return {
            ...message,
            children: message.children?.filter(child => child.id !== replyId) || []
          }
        }

        // 检查是否是删除的子回复
        if (message.children) {
          const updatedChildren = message.children.map(child => {
            if (child.id === pId) {
              return {
                ...child,
                children: child.children?.filter(subChild => subChild.id !== replyId) || []
              }
            }
            return child
          })

          // 如果有子回复被更新，返回更新后的消息
          if (JSON.stringify(updatedChildren) !== JSON.stringify(message.children)) {
            return {
              ...message,
              children: updatedChildren
            }
          }
        }

        return message
      })

    default:
      return state
  }
}

export default function MessagePage() {
  const { userInfo, administrator } = useUser()

  const [messageList, setMessageList] = useState<Message[]>([])
  const [rootMessageTree, dispatch] = useReducer(messageReducer, [])
  const [messageForm, setMessageForm] = useState<MessageForm>({ content: '' })
  const [replyForm, setReplyForm] = useState<ReplyForm>({})
  const [formErrors, setFormErrors] = useState<{ content?: string; [key: number]: string }>({})
  const [loading, setLoading] = useState(true)
  const [replyingMessageId, setReplyingMessageId] = useState<number | null>(null)
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  )
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)
  const CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = screenWidth < 768

  const fetchData = async (url: string, method: string = 'GET', data?: unknown) => {
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      }

      if (data && method !== 'GET') {
        options.body = JSON.stringify(data)
      }

      const res = await fetch(url, options)
      const result = await res.json()
      return result
    } catch (error) {
      console.log(`Error fetching ${url}:`, error)
      return { code: 500, data: [] }
    }
  }

  useEffect(() => {
    // 检查缓存是否过期
    const now = Date.now()
    if (now - lastFetchTime > CACHE_DURATION) {
      getMessageList()
    }
  }, [])

  const validateForm = (content: string): boolean => {
    const errors: { content?: string } = {}

    if (!content.trim()) {
      errors.content = '内容不能为空！'
    } else if (content.length > 500) {
      errors.content = '内容不超过500字！'
    }

    setFormErrors(prev => ({ ...prev, ...errors }))
    return Object.keys(errors).length === 0
  }

  const validateReplyForm = (messageId: number, content: string): boolean => {
    const errors: { [key: number]: string } = {}

    if (!content.trim()) {
      errors[messageId] = '回复内容不能为空！'
    } else if (content.length > 500) {
      errors[messageId] = '回复内容不超过500字！'
    }

    setFormErrors(prev => ({ ...prev, ...errors }))
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageForm({
      ...messageForm,
      [e.target.name]: e.target.value
    })

    if (formErrors.content) {
      setFormErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.content
        return newErrors
      })
    }
  }

  const handleReplyChange = (e: React.ChangeEvent<HTMLTextAreaElement>, messageId: number) => {
    const { value } = e.target
    setReplyForm(prev => ({ ...prev, [messageId]: value }))

    if (formErrors[messageId]) {
      setFormErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[messageId]
        return newErrors
      })
    }
  }

  const publish = async () => {
    if (!validateForm(messageForm.content)) return
    try {
      const message = {
        content: messageForm.content,
        nickname: userInfo?.nickname || '匿名用户',
        avatar: userInfo?.avatar || '/default-avatar.png',
        parentMessage: null
      }

      const res = await fetchData(ENDPOINTS.MESSAGES, 'POST', { message })

      if (res.code === 200) {
        // 直接添加新消息到状态中，而不是重新获取所有数据
        const newMessage: Message = {
          ...message,
          id: res.data.id, // 假设服务器返回新消息的ID
          createTime: new Date().toISOString(),
          parentMessage: null,
          adminMessage: administrator || false,
          children: []
        }

        dispatch({ type: 'ADD_MESSAGE', payload: newMessage })
        setMessageForm({ content: '' })
        showAlert('留言发表成功')
      } else {
        showAlert('留言发表失败！')
      }
    } catch (error) {
      console.log('发布留言失败:', error)
      showAlert('留言发表失败！')
    }
  }

  const replyToMessage = async (messageId: number) => {
    const replyContent = replyForm[messageId] || ''

    if (!validateReplyForm(messageId, replyContent)) return
    try {
      const targetMessage = findMessageById(rootMessageTree, messageId)
      if (!targetMessage) {
        showAlert('回复的留言不存在')
        return
      }

      const message = {
        content: replyContent,
        nickname: userInfo?.nickname || '匿名用户',
        avatar: userInfo?.avatar || '/default-avatar.png',
        parentId: targetMessage.id
      }

      const res = await fetchData(`${ENDPOINTS.MESSAGES}`, 'POST', { message })

      if (res.code === 200) {
        // 直接添加新回复到状态中，而不是重新获取所有数据
        const newReply: Message = {
          ...message,
          id: res.data.id, // 假设服务器返回新回复的ID
          createTime: new Date().toISOString(),
          parentMessage: targetMessage,
          adminMessage: administrator || false,
          children: []
        }

        // 确定父消息ID（如果是回复的回复，需要找到顶级父消息）
        let parentId = messageId
        if (targetMessage.parentMessage) {
          parentId = findTopLevelParentId(rootMessageTree, messageId) || messageId
        }

        dispatch({ type: 'ADD_REPLY', payload: { parentId, reply: newReply } })
        setReplyForm(prev => {
          const newReplies = { ...prev }
          delete newReplies[messageId]
          return newReplies
        })
        setReplyingMessageId(null)
        showAlert('回复成功')
      } else {
        showAlert('回复失败！')
      }
    } catch (error) {
      console.log('回复留言失败:', error)
      showAlert('回复失败！')
    }
  }

  const findMessageById = (messages: Message[], id: number): Message | undefined => {
    for (const message of messages) {
      if (message.id === id) {
        return message
      }
      if (message.children && message.children.length > 0) {
        const found = findMessageById(message.children, id)
        if (found) return found
      }
    }
    return undefined
  }

  const findTopLevelParentId = (messages: Message[], id: number): number | null => {
    for (const message of messages) {
      if (message.id === id) {
        return message.id
      }
      if (message.children && message.children.length > 0) {
        const found = findMessageById(message.children, id)
        if (found) return message.id
      }
    }
    return null
  }

  const handleDeleteMessage = async (id: number) => {
    try {
      setLoading(true)
      const res = await fetchData(`${ENDPOINTS.MESSAGES}/${id}/delete`, 'GET')

      if (res.code === 200) {
        // 检查是否是顶级消息
        const isTopLevel = rootMessageTree.some(msg => msg.id === id)

        if (isTopLevel) {
          // 如果是顶级消息，直接删除
          dispatch({ type: 'DELETE_MESSAGE', payload: id })
        } else {
          // 如果是回复，找到其父消息并删除
          for (const message of rootMessageTree) {
            if (message.children?.some(child => child.id === id)) {
              dispatch({ type: 'DELETE_REPLY', payload: { parentId: message.id, replyId: id } })
              break
            }

            // 检查是否是回复的回复
            if (message.children) {
              for (const child of message.children) {
                if (child.children?.some(subChild => subChild.id === id)) {
                  dispatch({ type: 'DELETE_REPLY', payload: { parentId: child.id, replyId: id } })
                  break
                }
              }
            }
          }
        }

        showAlert('删除成功')
      } else {
        showAlert(res.message || '删除失败，请稍后再试')
      }
    } catch (err) {
      showAlert('删除失败')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getMessageList = async () => {
    setLoading(true)
    const res = await fetchData(ENDPOINTS.MESSAGES)

    if (res.code === 200 && res.flag) {
      setMessageList(res.data)
      buildMessageTree(res.data)
      setLastFetchTime(Date.now()) // 更新最后获取时间
    }
    setLoading(false)
  }

  const buildMessageTree = (messages: Message[]) => {
    const messageMap = new Map<number, Message>()
    messages.forEach(msg => {
      messageMap.set(msg.id, { ...msg, children: [] })
    })

    const findTopLevelParent = (
      parentId: number,
      map: Map<number, Message>
    ): Message | undefined => {
      const parent = map.get(parentId)
      if (!parent) return undefined
      if (parent.parentMessage === null) {
        return parent
      }
      return findTopLevelParent(parent.parentMessage.id, map)
    }

    const rootMessages: Message[] = []

    messages.forEach(msg => {
      const currentMessage = messageMap.get(msg.id)!

      if (msg.parentMessage === null) {
        rootMessages.push(currentMessage)
      } else {
        const topLevelParent = findTopLevelParent(msg.parentMessage.id, messageMap)
        if (topLevelParent) {
          topLevelParent.children?.push(currentMessage)
        } else {
          rootMessages.push(currentMessage)
        }
      }
    })

    const sortChildren = (messages: Message[]) => {
      messages.forEach(msg => {
        if (msg.children && msg.children.length > 0) {
          msg.children.sort(
            (a, b) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime()
          )
        }
      })
    }

    rootMessages.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
    sortChildren(rootMessages)
    dispatch({ type: 'SET_MESSAGES', payload: rootMessages })
  }

  const toggleReply = (messageId: number) => {
    if (replyingMessageId === messageId) {
      setReplyingMessageId(null)
    } else {
      setReplyingMessageId(messageId)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date)
  }

  // 修改 renderMessageItem 函数
  const renderMessageItem = (message: Message, level = 0) => {
    const isRootMessage = level === 0

    return (
      <li
        key={message.id}
        className={`pt-1 pb-2 md:pt-2 ${
          isRootMessage ? 'border-b border-slate-200 dark:border-slate-700/30' : ''
        } `}
      >
        <div className="flex gap-4">
          <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-0.5">
            <Image
              src={message.avatar || '/default-avatar.png'}
              alt={`${message.nickname}的头像`}
              fill
              loading="eager"
              className="object-cover w-full h-full"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-blue-100">
                  {message.nickname}
                </span>
                {message.parentMessage && (
                  <span className="text-xs text-slate-500 dark:text-slate-500">
                    回复{' '}
                    <span className="text-blue-600 dark:text-blue-300">
                      {message.parentMessage.nickname}
                    </span>
                  </span>
                )}
                <span className="text-xs text-slate-500 dark:text-slate-500">
                  {formatDate(message.createTime)}
                </span>
              </div>
              {administrator && (
                <button
                  onClick={() => handleDeleteMessage(message.id)}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1"
                >
                  <Delete className="h-3 w-3" />
                  <span>删除</span>
                </button>
              )}
            </div>

            <p
              className={`text-sm text-slate-700 dark:text-slate-300 ${
                isMobile
                  ? 'cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700/20 rounded'
                  : ''
              }`}
              onClick={() => isMobile && toggleReply(message.id)}
            >
              {message.content}
            </p>

            {/* 非移动端显示回复按钮 */}
            {!isMobile && (
              <div className="mt-2 flex items-center gap-4">
                <button
                  onClick={() => toggleReply(message.id)}
                  className="text-xs flex items-center gap-1 transition-colors text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <Reply className="h-3.5 w-3.5" />
                  回复
                </button>
              </div>
            )}

            {replyingMessageId === message.id && (
              <div className="mt-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700/50">
                <textarea
                  value={replyForm[message.id] || ''}
                  onChange={e => handleReplyChange(e, message.id)}
                  rows={isMobile ? 2 : 3}
                  placeholder="输入回复内容..."
                  className={`w-full p-2 rounded text-sm border ${
                    formErrors[message.id]
                      ? 'border-red-500'
                      : 'border-slate-300 dark:border-slate-700'
                  } bg-white/80 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none`}
                ></textarea>
                {formErrors[message.id] && (
                  <p className="text-red-400 text-xs mt-1">{formErrors[message.id]}</p>
                )}
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => replyToMessage(message.id)}
                    disabled={loading}
                    className="px-3 py-1 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-1"
                  >
                    <Send className="h-3.5 w-3.5" />
                    发送回复
                  </button>
                </div>
              </div>
            )}

            {message.children && message.children.length > 0 && (
              <div
                className={`mt-4 pl-4 ${
                  !isMobile && 'border-l border-slate-200 dark:border-slate-700/30 ml-2'
                }`}
              >
                <ul className="space-y-4">
                  {message.children.map(child => renderMessageItem(child, 1))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </li>
    )
  }

  return (
    <div className="min-h-screen z-1 flex flex-col bg-white dark:bg-slate-950 overflow-hidden">
      <style jsx global>{`
        ::-webkit-scrollbar {
          display: none;
        }
        html {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/40"></div>
      <main
        className={`w-full max-w-5xl mx-auto px-${isMobile ? '0' : '4'} relative page-transition`}
      >
        <div className="bg-white/80 dark:bg-slate-900/60  lg:rounded-xl border border-slate-200 dark:border-slate-800 px-4 pb-4 pt-4 md:pt-6 shadow-sm">
          <div className="flex gap-4">
            <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
              {userInfo ? (
                <Image
                  src={userInfo.avatar || '/default-avatar.png'}
                  alt={`${userInfo.nickname}的头像`}
                  fill
                  loading="eager"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                  <User className="w-6 h-6" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <textarea
                name="content"
                value={messageForm.content}
                onChange={handleInputChange}
                rows={isMobile ? 3 : 4}
                placeholder="写下你的想法吧..."
                className={`w-full p-3 rounded-lg border ${
                  formErrors.content ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                } bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none text-sm`}
              ></textarea>

              <div className="flex justify-between items-center mt-3">
                <p
                  className={`text-xs ${
                    messageForm.content.length > 500 ? 'text-red-400' : 'text-slate-500'
                  }`}
                >
                  {messageForm.content.length}/500
                </p>

                <button
                  onClick={publish}
                  disabled={loading || messageForm.content.length > 500}
                  className={`px-4 py-1.5 rounded text-sm transition ${
                    !loading && messageForm.content.length <= 500
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {loading ? '发布中...' : '发布留言'}
                </button>
              </div>

              {formErrors.content && (
                <p className="text-red-400 text-xs mt-1">{formErrors.content}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/60 dark:backdrop-blur-sm lg:rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div
            className={`px-4 py-3 lg:py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center`}
          >
            <h2 className="text-base font-semibold text-slate-800 dark:text-white">留言列表</h2>
            <span className="text-slate-500 dark:text-slate-400 text-sm">
              {rootMessageTree.length} 条
            </span>
          </div>

          {loading ? (
            <div className="px-4 py-2 space-y-5">
              {[1, 2, 3].map(item => (
                <div key={item} className="flex gap-4 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24 mb-2"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
                    </div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32 mt-3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : rootMessageTree.length > 0 ? (
            <div className="px-4 py-2">
              <ul className="space-y-2">
                {rootMessageTree.map(message => renderMessageItem(message))}
              </ul>
            </div>
          ) : (
            <div className="p-10 text-center">
              <div className="text-slate-400 dark:text-slate-500 mb-3">
                <MessageSquare className="h-10 w-10 mx-auto" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                还没有留言，快来抢沙发吧～
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
