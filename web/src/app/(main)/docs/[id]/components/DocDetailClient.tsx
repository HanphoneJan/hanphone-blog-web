'use client'

import '../doc-detail.css'
import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, List, X, FileText, FileCode, FileJson, File, BookOpen, Folder, FolderOpen } from 'lucide-react'
import DOMPurify from 'dompurify'
import type { DocMeta, DocData } from '../../lib/docLoader'
import { buildDocFileUrl } from '../../lib/docLoader'
import ModalOverlay from '@/components/shared/ModalOverlay'
import BgOverlay from '@/app/(main)/components/BgOverlay'

import { Z_INDEX } from '@/lib/constants'
// 动画变体定义
const pageVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 }
  }
}

const mobileSidebarVariants: Variants = {
  hidden: { x: '-100%', opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 200
    }
  },
  exit: {
    x: '-100%',
    opacity: 0,
    transition: { duration: 0.2 }
  }
}

const desktopSidebarVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
}

const contentVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
}

const headerVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      delay: 0.1
    }
  }
}

const fabVariants: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 15
    }
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: { duration: 0.2 }
  }
}

const treeItemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2 }
  }
}

// ============ 类型定义 ============

const typeIcons: Record<string, React.ElementType> = {
  '.docx': FileText,
  '.pdf': File,
  '.md': FileCode,
  '.html': FileJson,
  docx: FileText,
  pdf: File,
  md: FileCode,
  html: FileJson,
}

// ============ 树节点类型 ============

interface TreeNode {
  name: string
  path: string
  isFolder: boolean
  doc?: DocMeta
  children: TreeNode[]
}

// ============ 构建树（与 DocsClient 一致） ============

function buildTree(docs: DocMeta[]): TreeNode {
  const root: TreeNode = { name: '文库', path: '', isFolder: true, children: [] }

  for (const doc of docs) {
    const parts = doc.filename.split('/')
    let current = root
    for (let i = 0; i < parts.length - 1; i++) {
      const folderName = parts[i]
      const folderPath = parts.slice(0, i + 1).join('/')
      let child = current.children.find(c => c.isFolder && c.name === folderName)
      if (!child) {
        child = { name: folderName, path: folderPath, isFolder: true, children: [] }
        current.children.push(child)
      }
      current = child
    }
    const fileName = parts[parts.length - 1]
    current.children.push({
      name: fileName,
      path: doc.filename,
      isFolder: false,
      doc,
      children: [],
    })
  }

  return root
}

function sortChildren(children: TreeNode[]): TreeNode[] {
  return [...children].sort((a, b) => {
    if (a.isFolder && !b.isFolder) return -1
    if (!a.isFolder && b.isFolder) return 1
    return a.name.localeCompare(b.name)
  })
}

// 获取文件所在文件夹路径
function getDocFolderPaths(filename: string): string[] {
  const parts = filename.split('/')
  if (parts.length <= 1) return []
  return parts.slice(0, -1)
}

// ============ 侧边栏树组件 ============

function SidebarTree({
  node,
  currentMeta,
  expandedFolders,
  onToggleFolder,
  closeSidebar,
  depth,
}: {
  node: TreeNode
  currentMeta?: DocMeta
  expandedFolders: Set<string>
  onToggleFolder: (path: string) => void
  closeSidebar: () => void
  depth: number
}) {
  const sorted = sortChildren(node.children)

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.03
          }
        }
      }}
    >
      {sorted.map((child) => {
        if (child.isFolder) {
          const expanded = expandedFolders.has(child.path)
          return (
            <motion.div key={child.path} variants={treeItemVariants}>
              <motion.button
                onClick={() => onToggleFolder(child.path)}
                className="doc-sidebar-item w-full text-left"
                style={{ paddingLeft: `${depth * 12 + 12}px` }}
                whileHover={{ x: 3 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  animate={{ rotate: expanded ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="w-3 h-3 text-[rgb(var(--text-muted))] shrink-0" />
                </motion.div>
                <AnimatePresence mode="wait">
                  {expanded ? (
                    <motion.div
                      key="open"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-[rgb(var(--primary))] shrink-0" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="closed"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Folder className="w-3.5 h-3.5 text-[rgb(var(--text-muted))] shrink-0" />
                    </motion.div>
                  )}
                </AnimatePresence>
                <span className="truncate">{child.name}</span>
              </motion.button>
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  >
                    <SidebarTree
                      node={child}
                      currentMeta={currentMeta}
                      expandedFolders={expandedFolders}
                      onToggleFolder={onToggleFolder}
                      closeSidebar={closeSidebar}
                      depth={depth + 1}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        }

        // 文件节点
        const doc = child.doc!
        const isActive = doc.id === currentMeta?.id || doc.docId === currentMeta?.docId
        const DIcon = typeIcons[doc.type] || FileText
        const nameWithoutExt = doc.filename.split('/').pop()?.replace(/\.[^.]+$/, '') || doc.title
        const isHtml = doc.type === 'html' || doc.type === '.html'
        const fileUrl = buildDocFileUrl(doc.docNamespace, doc.filename)

        const fileLinkProps = isHtml
          ? {
              href: fileUrl,
              target: '_blank' as const,
              rel: 'noopener noreferrer',
            }
          : {
              href: `/docs/${encodeURIComponent(doc.filename.replace(/\.[^.]+$/, ''))}`,
            }

        return (
          <motion.div key={doc.id} variants={treeItemVariants}>
            <a
              {...fileLinkProps}
              className={`doc-sidebar-item ${isActive && !isHtml ? 'active' : ''}`}
              style={{ paddingLeft: `${depth * 12 + 12}px` }}
              onClick={closeSidebar}
            >
              <span className="w-3 shrink-0" />
              <DIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? '' : 'doc-sidebar-icon'}`} />
              <span className="truncate">{nameWithoutExt}</span>
            </a>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

// ============ 组件 ============

interface DocDetailClientProps {
  docId: string
  docList: DocMeta[]
  initialDoc?: DocData | null
}

export default function DocDetailClient({ docId, docList, initialDoc }: DocDetailClientProps) {
  const [doc, setDoc] = useState<DocData | null>(initialDoc || null)
  const [loading, setLoading] = useState(!initialDoc)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const contentRef = useRef<HTMLDivElement>(null)
  const scrollDirRef = useRef<'up' | 'down'>('up')
  const [fabVisible, setFabVisible] = useState(true)

  // 切换文档时重置阅读区滚动
  // Next.js 路由只重置 window 滚动，不会重置内部 overflow-y-auto 容器
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, left: 0 })
  }, [docId])

  const tree = useMemo(() => buildTree(docList), [docList])

  // 获取当前文件的 meta
  const currentMeta = useMemo(() => docList.find(d => {
    if (d.id === docId) return true
    if (d.docId === docId) return true
    const nameWithoutExt = d.filename.replace(/\.[^.]+$/, '')
    const decodedId = decodeURIComponent(docId)
    return nameWithoutExt === docId || nameWithoutExt === decodedId
  }), [docList, docId])

  // 客户端清洗 HTML 内容（服务端 SSR 跳过了 jsdom 清洗，由这里补齐）
  const sanitizedHtml = useMemo(() => {
    if (!doc?.html) return ''
    return DOMPurify.sanitize(doc.html, { USE_PROFILES: { html: true } })
  }, [doc?.html])

  // 初始化：展开当前文件所在的所有父文件夹
  useEffect(() => {
    if (currentMeta) {
      const folderPaths = getDocFolderPaths(currentMeta.filename)
      const pathSet = new Set<string>()
      let accum = ''
      for (const segment of folderPaths) {
        accum = accum ? `${accum}/${segment}` : segment
        pathSet.add(accum)
      }
      setExpandedFolders(pathSet)
    }
  }, [currentMeta])

  // 通过 API 获取文件内容（仅当 SSR 未提供时作为回退）
  useEffect(() => {
    if (initialDoc) return
    fetch(`/api/docs/${encodeURIComponent(docId)}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found')
        return res.json()
      })
      .then(data => {
        setDoc(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [docId, initialDoc])

  const closeSidebar = () => setSidebarOpen(false)
  const handleContentClick = () => {
    if (sidebarOpen) closeSidebar()
  }

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(folderPath)) next.delete(folderPath)
      else next.add(folderPath)
      return next
    })
  }

  // 基于滚动方向自动显示/隐藏移动端 FAB
  useEffect(() => {
    let lastY = 0
    let ticking = false
    const el = contentRef.current
    if (!el) return

    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = el.scrollTop
        const dir = y > lastY + 5 ? 'down' : y < lastY - 5 ? 'up' : scrollDirRef.current
        scrollDirRef.current = dir
        setFabVisible(dir === 'up')
        lastY = y
        ticking = false
      })
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(var(--primary))]" />
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="flex-1 flex items-center justify-center text-[rgb(var(--text-muted))]">
        <p>文件未找到</p>
      </div>
    )
  }

  const sidebarContent = (
    <nav className="p-3 space-y-0.5">
      <SidebarTree
        node={tree}
        currentMeta={currentMeta}
        expandedFolders={expandedFolders}
        onToggleFolder={toggleFolder}
        closeSidebar={closeSidebar}
        depth={0}
      />
    </nav>
  )

  return (
    <motion.div
      className="flex flex-col"
      style={{ height: 'calc(100dvh - 56px)' }}
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <BgOverlay opacity={0.5} />
      {/* 移动端遮罩 */}
      <AnimatePresence>
        {sidebarOpen && (
          <ModalOverlay className="lg:hidden" onClick={closeSidebar} zIndex={40} />
        )}
      </AnimatePresence>

      {/* 移动端侧边栏 */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            className="
              fixed top-0 left-0 z-50 w-72 h-full overflow-y-auto
              bg-[rgb(var(--bg))] border-r border-[rgb(var(--border))]
              lg:hidden
            "
            variants={mobileSidebarVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="sticky top-0 z-10 bg-[rgb(var(--bg))] border-b border-[rgb(var(--border))] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-[rgb(var(--text))]">
                <BookOpen className="w-4 h-4 text-[rgb(var(--primary))]" />
                文库
              </div>
              <motion.button
                onClick={closeSidebar}
                className="p-1.5 rounded-lg hover:bg-[rgb(var(--hover))] text-[rgb(var(--text-muted))]"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* 移动端打开侧边栏按钮 - 滚动时自动隐藏 */}
      <AnimatePresence>
        {fabVisible && (
          <motion.button
            onClick={() => setSidebarOpen(true)}
            className="fixed bottom-6 left-6 lg:hidden rounded-full flex items-center justify-center shadow-lg"
            variants={fabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              zIndex: Z_INDEX.LIVE2D,
              background: 'rgb(var(--card))',
              width: '48px',
              height: '48px',
              padding: 0,
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="打开文件目录"
          >
            <List className="w-5 h-5 text-[rgb(var(--text))]" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 主体内容区 */}
      <main className="flex-1 w-full relative z-30 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-0 h-full">
          {/* 左侧：文件树（桌面端固定侧边栏） */}
          <motion.aside
            className="hidden lg:flex flex-col h-full overflow-y-auto scrollbar-thin border-r border-[rgb(var(--border))] py-6"
            variants={desktopSidebarVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="px-4">
              <motion.div
                whileHover={{ x: 3 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  href="/docs"
                  className="inline-flex items-center gap-1.5 text-sm text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--primary))] transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  返回文库
                </Link>
              </motion.div>
            </div>
            {sidebarContent}
          </motion.aside>

          {/* 右侧：文件阅读区 */}
          <motion.div
            ref={contentRef}
            className="h-full overflow-y-auto scrollbar-thin py-6 px-4 sm:px-8 lg:px-10 xl:px-14"
            onClick={handleContentClick}
            variants={contentVariants}
            initial="hidden"
            animate="visible"
          >
            <article className="max-w-3xl mx-auto">
              <motion.header
                className="mb-1 pb-2 border-b border-[rgb(var(--border))]"
                variants={headerVariants}
              >
                <h1 className="text-3xl sm:text-4xl font-bold text-[rgb(var(--text))] mb-3 leading-tight">
                  {doc.meta.filename.replace(/\.[^.]+$/, '')}
                </h1>
              </motion.header>

              {(() => {
                const docType = doc.meta.type.startsWith('.') ? doc.meta.type.slice(1) : doc.meta.type
                if (docType === 'pdf') {
                  return (
                    <motion.iframe
                      src={buildDocFileUrl(doc.meta.docNamespace, doc.meta.filename)}
                      className="w-full border border-[rgb(var(--border))] rounded-lg"
                      style={{ height: 'calc(100dvh - 220px)' }}
                      title={doc.meta.title}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    />
                  )
                }
                if (sanitizedHtml) {
                  return (
                    <motion.div
                      className="doc-read-prose"
                      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                    />
                  )
                }
                return (
                  <div className="text-center py-12 text-[rgb(var(--text-muted))]">
                    <p>暂无内容</p>
                  </div>
                )
              })()}
            </article>
          </motion.div>
        </div>
      </main>
    </motion.div>
  )
}
