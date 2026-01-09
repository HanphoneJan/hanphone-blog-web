'use client'

import { useEffect, useState, useRef, JSX, useId, useMemo, useReducer, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism'
import ClipboardJS from 'clipboard'
import rehypeRewrite from 'rehype-rewrite'
import rehypeRaw from 'rehype-raw'
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

import {
  Calendar,
  Eye,
  Edit,
  ThumbsUp,
  Share2,
  Reply as ReplyIcon,
  Trash2,
  Loader2,
  User,
  Copy,
  Menu,
  X,
  BookOpen,
  Clock,
  Send
} from 'lucide-react'
import { showAlert } from '@/lib/Alert'
import { ENDPOINTS } from '@/lib/api'
import apiClient from '@/lib/utils'
import { useUser } from '@/contexts/UserContext'
import React from 'react'

// 接口定义
interface ParentComment {
  id: number
  nickname: string
}

interface Blog {
  id: number
  title: string
  content: string
  firstPicture: string
  createTime: string
  views: number
  flag: string
  likes: number
  isLiked: boolean
  user: {
    id: number
    nickname: string
    avatar: string
  }
  tags: { id: number; name: string }[]
  comments: CommentItem[]
}

interface CommentItem {
  id: number
  content: string
  createTime: string
  userId: number
  nickname: string
  avatar: string
  parentComment?: ParentComment | null
  parentCommentId?: number | null
}

interface UserInfo {
  avatar?: string
  nickname?: string
  username?: string
  type?: string
  id?: number | null
  email?: string
  loginProvince?: string
  loginCity?: string
}

interface Heading {
  originalId: string
  text: string
  level: number
}

// 定义状态类型
interface BlogState {
  blog: Blog
  rpActiveId: number
  comments: CommentItem[]
  formLoading: boolean
  loading: boolean
  likeLoading: boolean
  headings: Heading[]
  activeHeading: string
  isMobile: boolean
  sidebarOpen: boolean
  headerHeight: number
  commentsLoaded: boolean
}

// 定义 action 类型
type BlogAction =
  | { type: 'SET_BLOG'; payload: Blog }
  | { type: 'SET_RP_ACTIVE_ID'; payload: number }
  | { type: 'SET_COMMENTS'; payload: CommentItem[] }
  | { type: 'SET_FORM_LOADING'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_LIKE_LOADING'; payload: boolean }
  | { type: 'SET_HEADINGS'; payload: Heading[] }
  | { type: 'SET_ACTIVE_HEADING'; payload: string }
  | { type: 'SET_IS_MOBILE'; payload: boolean }
  | { type: 'SET_SIDEBAR_OPEN'; payload: boolean }
  | { type: 'SET_HEADER_HEIGHT'; payload: number }
  | { type: 'TOGGLE_LIKE' }
  | { type: 'ADD_COMMENT'; payload: CommentItem }
  | { type: 'DELETE_COMMENT'; payload: number }
  | { type: 'SET_COMMENTS_LOADED'; payload: boolean }

// 初始状态
const initialState: BlogState = {
  blog: {
    id: 0,
    title: '',
    content: '',
    firstPicture: '',
    createTime: '',
    views: 0,
    flag: '',
    likes: 0,
    isLiked: false,
    user: { id: 0, nickname: '', avatar: '' },
    tags: [],
    comments: []
  },
  rpActiveId: -1,
  comments: [],
  formLoading: false,
  loading: false,
  likeLoading: false,
  headings: [],
  activeHeading: '',
  isMobile: false,
  sidebarOpen: false,
  headerHeight: 0,
  commentsLoaded: false
}

// Reducer 函数
const blogReducer = (state: BlogState, action: BlogAction): BlogState => {
  switch (action.type) {
    case 'SET_BLOG':
      return { ...state, blog: action.payload }
    case 'SET_RP_ACTIVE_ID':
      return { ...state, rpActiveId: action.payload }
    case 'SET_COMMENTS':
      return { ...state, comments: action.payload }
    case 'SET_FORM_LOADING':
      return { ...state, formLoading: action.payload }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_LIKE_LOADING':
      return { ...state, likeLoading: action.payload }
    case 'SET_HEADINGS':
      return { ...state, headings: action.payload }
    case 'SET_ACTIVE_HEADING':
      return { ...state, activeHeading: action.payload }
    case 'SET_IS_MOBILE':
      return { ...state, isMobile: action.payload }
    case 'SET_SIDEBAR_OPEN':
      return { ...state, sidebarOpen: action.payload }
    case 'SET_HEADER_HEIGHT':
      return { ...state, headerHeight: action.payload }
    case 'TOGGLE_LIKE':
      return {
        ...state,
        blog: {
          ...state.blog,
          isLiked: !state.blog.isLiked,
          likes: state.blog.isLiked ? state.blog.likes - 1 : state.blog.likes + 1
        }
      }
    case 'ADD_COMMENT':
      return {
        ...state,
        comments: [...state.comments, action.payload].sort(
          (a, b) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime()
        )
      }
    case 'DELETE_COMMENT':
      return {
        ...state,
        comments: state.comments.filter(c => c.id !== action.payload)
      }
    case 'SET_COMMENTS_LOADED':
      return { ...state, commentsLoaded: action.payload }
    default:
      return state
  }
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 自定义代码块组件
const CodeBlock = ({ node, className, children, ...props }: any) => {
  const codeId = useId()
  const copyId = `copy-${codeId}`
  const inline =
    node?.type === 'element' &&
    node?.tagName === 'code' &&
    !node?.properties?.className?.toString().includes('language-') &&
    node?.children?.length === 1 &&
    node?.children[0]?.type === 'text' &&
    node?.position?.start?.line === node?.position?.end?.line

  useEffect(() => {
    if (inline) return

    const clipboard = new ClipboardJS(`#${copyId}`, {
      text: () => (Array.isArray(children) ? children.join('') : String(children))
    })

    clipboard.on('success', () => {
      showAlert('代码已复制')
    })

    return () => clipboard.destroy()
  }, [inline, copyId, children])

  if (inline) {
    return (
      <code className="bg-slate-100 dark:bg-slate-800 rounded px-1 py-0.5 text-sm font-mono text-red-600 dark:text-red-400" {...props}>
        {children}
      </code>
    )
  }

  const match = /language-(\w+)/.exec(className || '')
  const language = match ? match[1] : 'text'

  return (
    <div className="relative group">
      <SyntaxHighlighter
        style={dracula}
        language={language}
        PreTag="div"
        className="rounded-lg !bg-[#282a36] !p-4"
        {...props}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
      <button
        id={copyId}
        className="absolute top-2 right-2 p-2 bg-slate-700 hover:bg-slate-600 rounded-md text-white opacity-0 group-hover:opacity-100 transition-opacity"
        title="复制代码"
      >
        <Copy className="h-4 w-4" />
      </button>
    </div>
  )
}

// 自定义标题组件 - 修正版
const CustomHeading = ({ level, children, node, ...props }: any) => {
  const uniqueId = useId() // 确保服务端和客户端ID一致性
  
  // 提取纯文本用于生成可读的ID（如果需要），这里主要使用 uniqueId 保证稳定
  // 但为了支持自定义哈希跳转，最好还是基于内容生成一个 slug，或者直接使用 uniqueId
  // 鉴于题目要求"修正无法跳转"，我们确保 id 被正确设置
  
  const id = `heading-${uniqueId}`

  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements

  return (
    <HeadingTag id={id} className="scroll-mt-24" {...props}>
      {children}
    </HeadingTag>
  )
}

const CustomImage = ({ src, alt, ...props }: any) => {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <div className="bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg h-64 w-full" />
  }

  if (!src.startsWith('http://') && !src.startsWith('https://')) {
    return <div className="text-red-500 text-sm p-4 border border-red-200 rounded">图片URL必须是绝对路径: {src}</div>
  }

  return (
    <div className="relative w-full my-4 overflow-hidden rounded-lg">
      <Image
        src={src}
        alt={alt || '图片'}
        width={800}
        height={450}
        className="object-cover w-full h-auto"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px"
        {...props}
      />
    </div>
  )
}

const CustomLink = ({ href, children, ...props }: any) => {
  const isExternal = href && (href.startsWith('http://') || href.startsWith('https://'))

  return (
    <a
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className="text-blue-600 dark:text-blue-400 hover:underline"
      {...props}
    >
      {children}
    </a>
  )
}

const calculateReadingStats = (content: string) => {
  const wordCount = content.length
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 800))
  return { wordCount, readingTimeMinutes }
}

const ReplyInput = React.memo(
  ({
    commentId,
    nickname,
    onSubmit,
    onCancel
  }: {
    commentId: number
    nickname: string
    onSubmit: (content: string) => void
    onCancel: () => void
  }) => {
    const [content, setContent] = useState('')
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    }, [])

    const handleSubmit = () => {
      if (!content.trim()) {
        showAlert('请输入回复内容')
        return
      }
      onSubmit(content)
    }

    const handleCancel = () => {
      setContent('')
      onCancel()
    }

    return (
      <div className="relative mt-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={`回复 @${nickname}：`}
          className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2 pr-16 text-xs text-slate-700 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none h-16"
          maxLength={1000}
        />
        <div className="absolute right-2 bottom-2 flex gap-1">
          <button
            onClick={handleCancel}
            className="bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded-md text-xs transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!content.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 rounded-md text-xs transition-colors disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            回复
          </button>
        </div>
      </div>
    )
  }
)

ReplyInput.displayName = 'ReplyInput'

export default function BlogDetailPage() {
  const { userInfo: contextUserInfo, administrator, onShowLogin } = useUser()
  const [state, dispatch] = useReducer(blogReducer, initialState)

  // 移除了页面加载时强制滚动到顶部的逻辑，避免干扰哈希跳转

  const [userInfo, setUserInfo] = useState<UserInfo>(() => {
    if (contextUserInfo) {
      return contextUserInfo
    }
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('userInfo')
      if (storedUser) {
        try {
          return JSON.parse(storedUser)
        } catch (e) {
          console.error('Failed to parse user info from localStorage', e)
          return null
        }
      }
    }
    return null
  })

  const headerRef = useRef<HTMLElement | null>(null)
  const blogContentRef = useRef<HTMLDivElement>(null)
  const scrollTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isHashHandledRef = useRef(false) // 用于防止重复处理哈希

  const params = useParams()
  const blogId = params.id as string

  const [content, setContent] = useState('')

  const { wordCount, readingTimeMinutes } = useMemo(
    () => calculateReadingStats(state.blog.content),
    [state.blog.content]
  )

  useEffect(() => {
    if (contextUserInfo) {
      setUserInfo(contextUserInfo)
      if (typeof window !== 'undefined') {
        localStorage.setItem('userInfo', JSON.stringify(contextUserInfo))
      }
    }
  }, [contextUserInfo])

  useEffect(() => {
    const checkIsMobile = () => {
      dispatch({ type: 'SET_IS_MOBILE', payload: window.innerWidth < 768 })
    }
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  const markdownComponents = useMemo(
    () => ({
      code: props => <CodeBlock {...props} />,
      h1: props => <CustomHeading level={1} {...props} />,
      h2: props => <CustomHeading level={2} {...props} />,
      h3: props => <CustomHeading level={3} {...props} />,
      h4: props => <CustomHeading level={4} {...props} />,
      h5: props => <CustomHeading level={5} {...props} />,
      h6: props => <CustomHeading level={6} {...props} />,
      img: CustomImage,
      a: CustomLink,
      p: props => <div className="my-4 text-black dark:text-white leading-7" {...props} />,
      ul: props => <ul className="list-disc pl-6 my-4 space-y-1" {...props} />,
      ol: props => <ol className="list-decimal pl-6 my-4 space-y-1" {...props} />,
      li: props => <li className="my-1" {...props} />,
      blockquote: props => (
        <blockquote
          className="border-l-4 border-blue-500 pl-4 italic my-4 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/30 py-2 pr-2"
          {...props}
        />
      ),
      table: props => <div className="overflow-x-auto my-4"><table className="min-w-full border-collapse" {...props} /></div>,
      th: props => (
        <th
          className="border border-slate-300 dark:border-slate-700 px-4 py-2 bg-slate-100 dark:bg-slate-800 font-semibold"
          {...props}
        />
      ),
      td: props => (
        <td className="border border-slate-300 dark:border-slate-700 px-4 py-2" {...props} />
      )
    }),
    []
  )

  useEffect(() => {
    const headerElement = document.querySelector('header')
    if (headerElement) {
      headerRef.current = headerElement
      dispatch({ type: 'SET_HEADER_HEIGHT', payload: headerElement.offsetHeight })
    }
    const handleResize = () => {
      if (headerRef.current) {
        dispatch({ type: 'SET_HEADER_HEIGHT', payload: headerRef.current.offsetHeight })
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 提取标题并生成导航
  useEffect(() => {
    if (!blogContentRef.current || !state.blog.content) return

    // 需要稍微延迟以确保DOM已经更新
    const timer = setTimeout(() => {
      const headingElements = blogContentRef.current?.querySelectorAll('h1, h2, h3, h4, h5, h6')
      const extractedHeadings: Heading[] = []

      headingElements?.forEach(heading => {
        const originalId = heading.id
        if (!originalId) return
        extractedHeadings.push({
          originalId,
          text: heading.textContent || '',
          level: parseInt(heading.tagName.substring(1))
        })
      })

      dispatch({ type: 'SET_HEADINGS', payload: extractedHeadings })
    }, 0)

    return () => clearTimeout(timer)
  }, [state.blog.content])

  // 处理哈希跳转的核心逻辑
  useEffect(() => {
    // 只有当标题列表已生成，且尚未处理过哈希时执行
    if (typeof window !== 'undefined' && state.headings.length > 0 && !isHashHandledRef.current) {
      const hash = window.location.hash
      if (hash) {
        const targetId = hash.slice(1) // 移除 #
        // 查找对应的标题ID
        const targetHeading = state.headings.find(h => h.originalId === targetId)

        // 注意：这里我们假设传入的哈希是 CustomHeading 生成的 ID。
        // 如果用户直接复制的是旧版哈希，这里可能找不到。
        // 但根据"修正初始化导致无法跳转"的要求，主要确保生成的ID是可跳转的。

        if (targetHeading) {
          const element = document.getElementById(targetHeading.originalId)
          if (element) {
            // 延迟执行以确保布局完成，特别是图片加载可能影响高度
            setTimeout(() => {
              const headerOffset = state.headerHeight + 24
              const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
              const offsetPosition = elementPosition - headerOffset

              window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
              })
              isHashHandledRef.current = true // 标记已处理
            }, 100)
          }
        } else {
            // 如果找不到匹配ID，可能是哈希格式变了，不做处理，或者可以尝试匹配第一个标题
            // 为了避免循环，也标记为已处理
            isHashHandledRef.current = true;
        }
      } else {
        // 没有哈希，滚动到页面顶部
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
        isHashHandledRef.current = true
      }
    }
  }, [state.headings, state.headerHeight])

  // 监听URL变化（如点击浏览器前进后退）处理哈希
  useEffect(() => {
    const handlePopState = () => {
      isHashHandledRef.current = false // 重置标记，允许上面的 effect 再次执行
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // IntersectionObserver 部分保持不变
  const [visibleHeadingId, setVisibleHeadingId] = useState<string | null>(null)
  const visibleHeadingObserverRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (visibleHeadingObserverRef.current) {
      visibleHeadingObserverRef.current.disconnect()
    }

    visibleHeadingObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const headingId = entry.target.id
            if (headingId) {
              setVisibleHeadingId(headingId)
            }
          }
        })
      },
      {
        rootMargin: '-100px 0px -70% 0px',
        threshold: 0.1
      }
    )

    if (typeof window !== 'undefined' && blogContentRef.current) {
      const headingElements = blogContentRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6')
      headingElements.forEach((element) => {
        if (element.id) {
          visibleHeadingObserverRef.current?.observe(element)
        }
      })
    }

    return () => {
      if (visibleHeadingObserverRef.current) {
        visibleHeadingObserverRef.current.disconnect()
      }
    }
  }, [state.headings, state.blog.content])

  useEffect(() => {
    if (visibleHeadingId) {
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', `#${visibleHeadingId}`)
      }
    }
  }, [visibleHeadingId])

  // Scroll Spy 逻辑保持不变
  useEffect(() => {
    const handleScroll = () => {
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current)
      }

      scrollTimerRef.current = setTimeout(() => {
        if (state.headings.length === 0) return

        const scrollPosition = window.scrollY + 300
        const visibleHeadings = []
        for (const heading of state.headings) {
          const element = document.getElementById(heading.originalId)
          if (!element) continue

          const rect = element.getBoundingClientRect()
          const elementTop = window.scrollY + rect.top

          if (elementTop <= scrollPosition) {
            visibleHeadings.push({
              id: heading.originalId,
              top: elementTop
            })
          }
        }

        if (visibleHeadings.length > 0) {
          visibleHeadings.sort((a, b) => a.top - b.top)
          const newActiveHeading = visibleHeadings[visibleHeadings.length - 1].id
          dispatch({ type: 'SET_ACTIVE_HEADING', payload: newActiveHeading })

          const navContainer = document.querySelector('.sidebar-container,.blog-nav-prose')
          const activeNavItem = document.querySelector(
            `button[data-heading-id="${newActiveHeading}"]`
          )

          if (navContainer && activeNavItem) {
            const containerRect = navContainer.getBoundingClientRect()
            const itemRect = activeNavItem.getBoundingClientRect()

            const containerUpperHeight = containerRect.height * 0.6
            const itemRelativeTop = itemRect.top - containerRect.top

            if (itemRelativeTop > containerUpperHeight) {
              const targetPosition = itemRelativeTop - containerUpperHeight / 2
              ;(navContainer as HTMLElement).scrollTop = targetPosition
            } else if (itemRelativeTop < 0) {
              ;(navContainer as HTMLElement).scrollTop += itemRelativeTop
            }
          }
        }
      }, 50)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current)
      }
    }
  }, [state.headings])

  const scrollToHeading = useCallback(
    (originalId: string) => {
      const element = document.getElementById(originalId)
      if (element) {
        const headerOffset = state.headerHeight + 24
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
        const offsetPosition = elementPosition - headerOffset

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        })

        if (window.innerWidth < 1024) {
          dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false })
        }
      }
    },
    [state.headerHeight]
  )

  useEffect(() => {
    const clipboard = new ClipboardJS('.copy-code-btn')
    clipboard.on('success', () => {
      showAlert('代码已复制')
    })
    return () => clipboard.destroy()
  }, [])

  const fetchBlogInfo = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const queryParams = userInfo?.id ? { userId: userInfo.id } : {}
      const res = await fetchData(`${ENDPOINTS.BLOG}/${blogId}`, 'GET', queryParams)

      if (res.code === 200) {
        const blogData = {
          ...res.data,
          likes: res.data.likes ?? 0,
          isLiked: res.data.liked !== undefined ? res.data.liked : false
        }
        dispatch({ type: 'SET_BLOG', payload: blogData })

        // 注意: metadata 现在由 layout.tsx 的 generateMetadata 在服务端处理
        // 这里的客户端更新作为备用方案
        // updatePageMetadata(blogData)

        if (!state.commentsLoaded) {
          const { comments } = blogData
          const sortedComments = comments.sort(
            (a: CommentItem, b: CommentItem) =>
              new Date(a.createTime).getTime() - new Date(b.createTime).getTime()
          )
          dispatch({ type: 'SET_COMMENTS', payload: sortedComments })
        }
      } else {
        showAlert('获取博客信息失败')
      }
    } catch (err) {
      showAlert('获取博客信息失败')
      console.error(err)
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [blogId, userInfo?.id, state.commentsLoaded])

  useEffect(() => {
    if (blogId) fetchBlogInfo()
  }, [blogId, fetchBlogInfo])

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

  const findComment = useCallback(
    (commentId: number): CommentItem | null => {
      return state.comments.find(c => c.id === commentId) || null
    },
    [state.comments]
  )

  const handleSubmitComment = useCallback(
    async (parentId: number = -1, replyContent?: string) => {
      const commentContent = replyContent || content
      if (!commentContent.trim()) {
        return showAlert('请输入评论内容')
      }
      if (commentContent.length > 1000) {
        return showAlert('评论内容不能超过1000字')
      }
      try {
        dispatch({ type: 'SET_FORM_LOADING', payload: true })

        if (!userInfo) {
          showAlert('请先登录后再评论', { type: 'warning', duration: 3000 })
          onShowLogin()
          dispatch({ type: 'SET_FORM_LOADING', payload: false })
          return
        }

        const res = await fetchData(ENDPOINTS.COMMENTS, 'POST', {
          content: commentContent,
          blogId: state.blog.id,
          userId: userInfo.id || 1,
          parentId: parentId
        })

        if (res.code !== 200) {
          showAlert(res.message || '评论失败，请稍后再试')
        } else {
          let parentCommentInfo: ParentComment | null = null
          if (parentId !== -1) {
            const parentComment = findComment(parentId)
            if (parentComment) {
              parentCommentInfo = {
                id: parentComment.id,
                nickname: parentComment.nickname
              }
            }
          }

          const newComment: CommentItem = {
            id: res.data.id,
            content: commentContent,
            createTime: new Date().toISOString(),
            userId: userInfo.id || 1,
            nickname: userInfo.nickname || '匿名用户',
            avatar: userInfo.avatar || '',
            parentCommentId: parentId === -1 ? null : parentId,
            parentComment: parentCommentInfo
          }

          dispatch({ type: 'ADD_COMMENT', payload: newComment })

          if (!replyContent) {
            setContent('')
          }
          dispatch({ type: 'SET_RP_ACTIVE_ID', payload: -1 })
          showAlert('评论成功')
        }

        dispatch({ type: 'SET_FORM_LOADING', payload: false })
      } catch (error) {
        dispatch({ type: 'SET_FORM_LOADING', payload: false })
        showAlert('评论失败')
        console.error('提交失败:', error)
      }
    },
    [content, state.blog.id, userInfo, onShowLogin, findComment]
  )

  const handleDeleteComment = useCallback(async (id: number) => {
    try {
      const res = await fetchData(`${ENDPOINTS.COMMENTS}/${id}/delete`, 'GET')

      if (res.code === 200) {
        showAlert('删除成功')
        dispatch({ type: 'DELETE_COMMENT', payload: id })
      } else {
        showAlert(res.message || '删除失败，请稍后再试')
      }
    } catch (err) {
      showAlert('删除失败')
      console.error(err)
    } finally {
    }
  }, [])

  const submitReply = useCallback(
    (replyContent: string, commentId: number) => {
      if (!replyContent?.trim()) {
        showAlert('请输入回复内容')
        return
      }
      handleSubmitComment(commentId, replyContent)
    },
    [handleSubmitComment]
  )

  const handleLike = useCallback(async () => {
    if (!userInfo) {
      showAlert('请先登录后再点赞', { type: 'warning', duration: 3000 })
      onShowLogin()
      return
    }
    try {
      dispatch({ type: 'SET_LIKE_LOADING', payload: true })
      dispatch({ type: 'TOGGLE_LIKE' })
      const res = await fetchData(`${ENDPOINTS.BLOG}/${state.blog.id}/like`, 'POST', {
        userId: userInfo.id,
        blogId: state.blog.id,
        isLike: !state.blog.isLiked
      })
      if (res.code !== 200) {
        dispatch({ type: 'TOGGLE_LIKE' })
        showAlert(res.message || '操作失败，请稍后再试')
      }
    } catch (error) {
      dispatch({ type: 'TOGGLE_LIKE' })
      showAlert('操作失败')
      console.error('点赞失败:', error)
    } finally {
      dispatch({ type: 'SET_LIKE_LOADING', payload: false })
    }
  }, [userInfo, onShowLogin, state.blog.id, state.blog.isLiked])

  if (state.loading) {
    return (
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // 修改分享链接逻辑，移除哈希
  const handleShare = () => {
    try {
      // 使用 origin + pathname + search 拼接，排除 hash
      const shareUrl = window.location.origin + window.location.pathname + window.location.search
      
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => {
          showAlert('链接已复制到剪贴板', { type: 'success', duration: 3000 })
          const shareBtn = document.querySelector('button:has(> Share2)')
          if (shareBtn) {
            shareBtn.classList.add('scale-90')
            setTimeout(() => shareBtn.classList.remove('scale-90'), 200)
          }
        })
        .catch(() => {
          showAlert('复制失败，请手动复制链接', { type: 'warning', duration: 3000 })
        })
    } catch (error) {
      console.error('分享功能出错:', error)
      showAlert('分享功能暂时不可用', { type: 'warning', duration: 3000 })
    }
  }

  const CommentItemComponent = React.memo(
    ({ comment, isLast = false }: { comment: CommentItem; isLast?: boolean }) => {
      const showReplyInput = state.rpActiveId === comment.id
      const [replyContent, setReplyContent] = useState('')

      useEffect(() => {
        if (showReplyInput) {
          const textarea = document.querySelector(
            `#reply-textarea-${comment.id}`
          ) as HTMLTextAreaElement
          if (textarea) {
            textarea.focus()
          }
        }
      }, [showReplyInput, comment.id])

      const handleSubmitReply = () => {
        if (!replyContent.trim()) {
          showAlert('请输入回复内容')
          return
        }
        submitReply(replyContent, comment.id)
        setReplyContent('')
        dispatch({ type: 'SET_RP_ACTIVE_ID', payload: -1 })
      }


      const toggleReply = () => {
        if (showReplyInput) {
          dispatch({ type: 'SET_RP_ACTIVE_ID', payload: -1 })
        } else {
          dispatch({ type: 'SET_RP_ACTIVE_ID', payload: comment.id })
        }
      }

      return (
        <div
          className={`${
            state.isMobile
              ? 'bg-slate-50 dark:bg-slate-800/30 p-2'
              : `p-3 ${!isLast ? 'border-b border-slate-200 dark:border-slate-700/50' : ''}`
          }`}
        >
          <div className="flex items-start">
            {comment.avatar ? (
              <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700">
                <Image
                  src={comment.avatar}
                  alt={`${comment.nickname}的头像`}
                  width={32}
                  height={32}
                  loading="lazy"
                  sizes="32px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700/50 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0 border border-slate-200 dark:border-slate-700">
                <User className="h-4 w-4" />
              </div>
            )}

            <div className="ml-1 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-slate-700 dark:text-blue-100">
                    {comment.nickname}
                  </span>
                  {comment.parentComment && (
                    <span className="text-xs text-slate-500 dark:text-slate-500">
                      回复{' '}
                      <span className="text-blue-600 dark:text-blue-300">
                        {comment.parentComment.nickname}
                      </span>
                    </span>
                  )}
                  <span className="text-xs text-slate-500 dark:text-slate-500">
                    {formatDate(comment.createTime)}
                  </span>
                  {comment?.userId === state.blog.user.id && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded">
                      作者
                    </span>
                  )}
                </div>
                {administrator && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>删除</span>
                  </button>
                )}
              </div>
              <p
                className={`text-sm text-slate-700 dark:text-slate-300 ${
                  state.isMobile
                    ? 'cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700/20 rounded transition-colors'
                    : ''
                }`}
                onClick={() => state.isMobile && toggleReply()}
              >
                {comment.content}
              </p>

              <div className="flex items-center gap-4 mt-1">
                {!state.isMobile && (
                  <button
                    onClick={toggleReply}
                    disabled={!userInfo}
                    className={`text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 ${
                      !userInfo ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <ReplyIcon className="h-3.5 w-3.5" />
                    <span>回复</span>
                  </button>
                )}
              </div>

              {showReplyInput && (
                <div className="mt-2 relative">
                  <textarea
                    id={`reply-textarea-${comment.id}`}
                    value={replyContent}
                    onChange={e => setReplyContent(e.target.value)}
                    placeholder={`回复 @${comment.nickname}：`}
                    className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2 pr-20 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none h-24"
                    maxLength={1000}
                    autoFocus
                  />
                  <div className="absolute right-2 bottom-2 flex gap-2">
                    <button
                      onClick={handleSubmitReply}
                      disabled={!replyContent.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-md text-sm transition-colors disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <Send className="h-3.5 w-3.5" />
                      回复
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    },
    (prevProps, nextProps) => {
      return (
        prevProps.comment.id === nextProps.comment.id &&
        prevProps.comment.content === nextProps.comment.content &&
        prevProps.isLast === nextProps.isLast &&
        (prevProps.comment.id !== state.rpActiveId || nextProps.comment.id !== state.rpActiveId)
      )
    }
  )
  CommentItemComponent.displayName = 'CommentItemComponent'

  const renderCommentList = () => {
    if (state.comments.length === 0) {
      return (
        <div className="text-center text-slate-500 dark:text-slate-500 text-sm py-3">
          暂无评论，快来发表第一条评论吧
        </div>
      )
    }

    return (
      <div className="space-y-0">
        {state.comments.map((comment, index) => {
          const isLast = index === state.comments.length - 1
          return <CommentItemComponent key={comment.id} comment={comment} isLast={isLast} />
        })}
      </div>
    )
  }

  return (
    <div className="min-h-screen z-1 flex flex-col">
      <style jsx global>{`
        ::-webkit-scrollbar {
          display: none;
        }
        html {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .blog-content-prose {
          font-family: Arial, 'SimSun', 'Songti SC', 'STSong', system-ui, -apple-system,
            BlinkMacSystemFont, 'Segoe UI', Roboto;
          line-height: 1.5;
          max-width: 100%;
          margin-bottom: 2rem;
          isolation: isolate;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
        }

        @media (max-width: 1024px) {
          .blog-content-prose {
            max-width: 90vw !important;
          }
        }

        @media (max-width: 640px) {
          .blog-content-prose {
            max-width: 95vw !important;
          }
        }

        .blog-main-prose {
          font-family: Arial, 'SimSun', 'Songti SC', 'STSong', system-ui, -apple-system,
            BlinkMacSystemFont, 'Segoe UI', Roboto;
        }

        /* 标题样式 - 增加 scroll-mt 配合 CSS */
        .blog-content-prose h1, .blog-content-prose h2, .blog-content-prose h3, 
        .blog-content-prose h4, .blog-content-prose h5, .blog-content-prose h6 {
          scroll-margin-top: 100px; /* CSS原生滚动偏移，辅助JS */
        }

        .blog-content-prose h1 {
          font-size: 1.5em;
          font-weight: bold;
          margin-top: 0.3em;
          margin-bottom: 0.8em;
        }

        .blog-content-prose h2 {
          font-size: 1.4em;
          font-weight: bold;
          margin-top: 0.3em;
          margin-bottom: 0.7em;
          opacity: 0.95;
        }

        .blog-content-prose h3 {
          font-size: 1.2em;
          font-weight: bold;
          margin-top: 0.3em;
          margin-bottom: 0.6em;
          opacity: 0.9;
        }

        .blog-content-prose h4 {
          font-size: 1.1em;
          font-weight: 600;
          margin-top: 0.3em;
          margin-bottom: 0.5em;
          opacity: 0.85;
        }

        .blog-content-prose h5 {
          font-size: 1em;
          font-weight: 600;
          margin-top: 0.3em;
          margin-bottom: 0.4em;
          opacity: 0.85;
        }

        .blog-content-prose h6 {
          font-size: 0.9em;
          font-weight: 600;
          margin-top: 0.3em;
          margin-bottom: 0.3em;
          opacity: 0.85;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .page-blog {
          opacity: 0;
          animation: fadeIn 0.7s ease-out forwards;
          will-change: opacity, transform;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      
      <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/40"></div>

      {/* 统一导航栏 */}
      {state.headings.length > 0 && (
        <>
          <div
            className={`fixed inset-0 bg-white/10 dark:bg-black z-40 lg:hidden transition-opacity duration-300 ${
              state.sidebarOpen ? 'opacity-80' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false })}
          />

          <div
            className={`
            fixed z-40 right-0 text-slate-700 dark:text-slate-100 h-[calc(100vh-${
              state.headerHeight + 24
            }px)] w-64 lg:w-74
            shadow-sm bg-white/90 dark:bg-slate-800/90
            transition-transform duration-300 ease-in-out round
            ${state.sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          `}
            style={{
              top: `${window.innerWidth >= 1024 ? state.headerHeight : 0}px`,
              height: `calc(100vh - ${window.innerWidth >= 1024 ? state.headerHeight : 0}px)`
            }}
          >
            <div className="p-4 border-b border-slate-300 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-100">目录</h3>
              <button
                onClick={() => dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false })}
                className="text-slate-700 dark:text-slate-100 hover:text-slate-900 dark:hover:text-white p-1 lg:hidden"
                aria-label="关闭目录"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="sidebar-container h-[calc(100%-3rem)] overflow-y-auto p-4">
              <nav className="space-y-2">
                {state.headings.map(heading => (
                  <button
                    key={heading.originalId}
                    data-heading-id={heading.originalId}
                    onClick={() => scrollToHeading(heading.originalId)}
                    className={`block w-full text-left py-1 px-2 rounded transition-colors ${
                      state.activeHeading === heading.originalId
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800/50'
                        : 'text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50'
                    }`}
                    style={{ paddingLeft: `${(heading.level - 1) * 12 + 8}px` }}
                  >
                    {heading.text}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <button
            onClick={() => dispatch({ type: 'SET_SIDEBAR_OPEN', payload: true })}
            className="fixed bottom-6 left-6 z-99 lg:hidden bg-slate-200 dark:bg-slate-800 hover:bg-blue-500 text-slate-700 dark:text-white p-3 rounded-full shadow-md transition-all"
            aria-label="打开目录"
          >
            <Menu className="h-6 w-6" />
          </button>
        </>
      )}

      <main className="blog-main-prose w-full max-w-7xl mx-auto px-0 py-0  relative z-30 page-blog">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
          <div className="lg:max-w-3xl xl:max-w-5xl mx-auto w-full">
            <div className="bg-white/90 dark:bg-slate-800/40 lg:rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/50 overflow-hidden">
              <div className="blog-head-prose p-6 border-b border-slate-200 dark:border-slate-700/50">
                <div className="flex flex-wrap items-center text-slate-500 dark:text-slate-400 text-sm gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden">
                      <Image
                        src={state.blog.user.avatar || '/default-avatar.png'}
                        alt={state.blog.user.nickname}
                        width={32}
                        height={32}
                        loading="lazy"
                        sizes="32px"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <a
                      href="#"
                      className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                    >
                      {state.blog.user.nickname}
                    </a>
                  </div>

                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <span>{formatDate(state.blog.createTime)}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <span>{wordCount} 字</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <span>预计阅读时间：{readingTimeMinutes} 分钟</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <span>{state.blog.views}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <ThumbsUp
                      className={`h-4 w-4 ${
                        state.blog.isLiked
                          ? 'text-[#23ade5] fill-[#23ade5]'
                          : 'text-slate-300 dark:text-slate-500'
                      }`}
                    />
                    <span>{state.blog.likes}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {state.blog.flag && (
                      <span className="text-sm bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded">
                        {state.blog.flag}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-0">
                  <h1 className="blog-title-prose text-3xl font-bold text-slate-800 dark:text-slate-100 text-center flex flex-wrap items-center justify-center">
                    {state.blog.title}
                  </h1>
                </div>
              </div>

              <div className="px-6 lg:px-8">
                <div
                  ref={blogContentRef}
                  className="blog-content-prose max-w-3xl mx-auto mb-8 text-slate-700 dark:text-slate-200 leading-relaxed"
                >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[
                    [
                      rehypeKatex,
                      {
                        strict: false,
                        trust: true,
                        macros: {
                          "\begin{align*}": "\begin{aligned}",
                          "\end{align*}": "\end{aligned}"
                        }
                      }
                    ],
                    [
                      rehypeRewrite,
                      {
                        rewrite: (node: any) => {
                          if (node.tagName === 'img') {
                          }
                        }
                      }
                    ],
                    [rehypeRaw]
                  ]}
                  components={markdownComponents}
                >
                  {state.blog.content}
                </ReactMarkdown>
                </div>
                <div className="flex flex-wrap items-center mb-8 ml-2">
                  {state.blog.tags.map(tag => (
                    <div key={tag.id} className="flex items-center mr-4 mb-2">
                      <div className="w-0 h-0 border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent border-r-[7px] border-r-blue-500 relative mr-1">
                        <div className="absolute -top-[7px] -left-[1px] w-0 h-0 border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent border-r-[7px] border-r-blue-200 dark:border-r-blue-900/30"></div>
                      </div>
                      <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm px-3 py-1 rounded-full border border-blue-300 dark:border-blue-800/50 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                        {tag.name}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-8 ml-4 mt-6">
                  <button
                    onClick={handleLike}
                    disabled={state.likeLoading || !userInfo}
                    className={`flex items-center gap-2 transition-all duration-200 ${
                      state.likeLoading
                        ? 'opacity-70 cursor-wait'
                        : state.blog.isLiked
                        ? 'text-[#23ade5]'
                        : 'text-slate-300 hover:text-[#23ade5]'
                    } ${!userInfo ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {state.likeLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-[#23ade5]" />
                    ) : (
                      <ThumbsUp
                        className={`h-5 w-5 ${state.blog.isLiked ? 'fill-[#23ade5]' : ''} 
                  transition-transform duration-300 hover:scale-110`}
                      />
                    )}
                    <span className="text-sm font-medium">{state.blog.likes}</span>
                  </button>

                  <button
                    onClick={() => handleShare()}
                    className="flex items-center gap-2 text-slate-300  hover:text-[#23ade5] transition-colors duration-200"
                  >
                    <Share2 className="h-5 w-5 transition-transform duration-300 hover:scale-110" />
                    <span className="text-sm font-medium">分享</span>
                  </button>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700/50 mt-2 my-3"></div>
                <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-t-lg p-4 hover:border-slate-300 dark:hover:border-slate-600/70 transition-colors">
                  <div className="flex items-center mb-4">
                    {userInfo ? (
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700">
                        <Image
                          src={userInfo.avatar || '/default-avatar.png'}
                          alt={`${userInfo.nickname}的头像`}
                          width={40}
                          height={40}
                          loading="lazy"
                          sizes="40px"
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700/50 flex items-center justify-center text-blue-600 dark:text-blue-200 border border-slate-300 dark:border-slate-700">
                        <User className="h-5 w-5" />
                      </div>
                    )}
                    <div className="ml-3">
                      <div className="font-medium text-blue-700 dark:text-blue-100">
                        {userInfo ? userInfo.nickname : '请登录后发表评论'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <textarea
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      rows={4}
                      placeholder="写下你的评论..."
                      disabled={!userInfo}
                      className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none
                      ${
                        !userInfo
                          ? 'border-slate-300 dark:border-slate-700/50 opacity-70 cursor-not-allowed'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                      maxLength={1000}
                    />
                    <div className="flex justify-between items-center">
                      <p className="text-slate-500 dark:text-slate-500 text-xs">
                        {content.length}/1000 字
                      </p>
                      <button
                        onClick={() => handleSubmitComment()}
                        disabled={state.formLoading || !content.trim() || !userInfo}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-2 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed"
                      >
                        {state.formLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        <Edit className="h-4 w-4" />
                        提交评论
                      </button>
                    </div>
                  </div>
                </div>
                <div
                  className={`space-y-3 pt-2 border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/30 rounded-b-lg  ${
                    state.isMobile ? 'mb-4' : 'mb-10'
                  }`}
                >
                  {renderCommentList()}
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:block w-64"></div>
        </div>
      </main>

      {state.loading && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  )
}