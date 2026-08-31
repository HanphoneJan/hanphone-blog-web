'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import {
  ChevronRight,
  Folder,
  FolderOpen,
  FileText,
  FileCode,
  FileJson,
  File,
  Download,
  ExternalLink,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  Search,
  Star,
} from 'lucide-react'
import type { DocMeta } from '../lib/docLoader'
import { buildDocFileUrl } from '../lib/docLoader'
import DocsFilter from './DocsFilter'
import ModalOverlay from '@/components/shared/ModalOverlay'

// 动画变体定义
const sidebarVariants: Variants = {
  expanded: { width: 224, opacity: 1 },
  collapsed: { width: 0, opacity: 0 }
}

const mobileDrawerVariants: Variants = {
  hidden: { x: '-100%', opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1]
    }
  },
  exit: {
    x: '-100%',
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
}

const treeItemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 }
}

const fileListContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05
    }
  }
}

const fileRowVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  }
}

const folderContentVariants: Variants = {
  hidden: { opacity: 0, height: 0 },
  visible: {
    opacity: 1,
    height: 'auto',
    transition: {
      duration: 0.25,
      ease: 'easeOut'
    }
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: {
      duration: 0.2
    }
  }
}

const breadcrumbVariants: Variants = {
  hidden: { opacity: 0, y: -5 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  }
}

const emptyStateVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
}

const counterVariants: Variants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 15
    }
  }
}

// ============ 类型 ============

interface TreeNode {
  name: string
  path: string
  isFolder: boolean
  doc?: DocMeta
  children: TreeNode[]
  fileCount: number
}

// ============ 配置 ============

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

const typeColors: Record<string, string> = {
  '.docx': 'text-blue-500',
  '.pdf': 'text-rose-500',
  '.md': 'text-emerald-500',
  '.html': 'text-amber-500',
  docx: 'text-blue-500',
  pdf: 'text-rose-500',
  md: 'text-emerald-500',
  html: 'text-amber-500',
}

// ============ 构建树 ============

function buildTree(docs: DocMeta[]): TreeNode {
  const root: TreeNode = {
    name: '全部文档',
    path: '',
    isFolder: true,
    children: [],
    fileCount: 0,
  }

  for (const doc of docs) {
    const parts = doc.filename.split('/')
    let current = root

    for (let i = 0; i < parts.length - 1; i++) {
      const fn = parts[i]
      const fp = parts.slice(0, i + 1).join('/')
      let child = current.children.find((c) => c.isFolder && c.name === fn)
      if (!child) {
        child = {
          name: fn,
          path: fp,
          isFolder: true,
          children: [],
          fileCount: 0,
        }
        current.children.push(child)
      }
      current = child
    }

    current.children.push({
      name: parts[parts.length - 1],
      path: doc.filename,
      isFolder: false,
      doc,
      children: [],
      fileCount: 0,
    })
  }

  function compute(n: TreeNode) {
    let f = 0
    for (const c of n.children) {
      if (c.isFolder) {
        compute(c)
        f += c.fileCount
      } else {
        f++
      }
    }
    n.fileCount = f
  }
  compute(root)

  function sort(n: TreeNode) {
    n.children.sort((a, b) => {
      if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    n.children.filter((c) => c.isFolder).forEach(sort)
  }
  sort(root)

  return root
}

// ============ 主组件 ============

export default function DocsClient({ initialDocs }: { initialDocs: DocMeta[] }) {
  const [docs] = useState(initialDocs)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [currentPath, setCurrentPath] = useState<string[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileDrawer, setMobileDrawer] = useState(false)

  const tree = useMemo(() => buildTree(docs), [docs])

  // 当前文件夹节点
  const currentFolder = useMemo(() => {
    let node = tree
    for (const seg of currentPath) {
      const found = node.children.find((c) => c.isFolder && c.name === seg)
      if (!found) break
      node = found
    }
    return node
  }, [tree, currentPath])

  // 所有文件（搜索用）
  const allFiles = useMemo(() => {
    const result: TreeNode[] = []
    function walk(n: TreeNode) {
      for (const c of n.children) {
        if (c.isFolder) walk(c)
        else if (c.doc) result.push(c)
      }
    }
    walk(tree)
    return result
  }, [tree])

  const isSearching = searchQuery !== '' || selectedType !== 'all'

  // 搜索过滤
  const filteredFiles = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return allFiles.filter((n) => {
      const d = n.doc!
      const fn = d.filename.split('/').pop()?.replace(/\.[^.]+$/, '') || ''
      return (
        (!q ||
          fn.toLowerCase().includes(q) ||
          d.filename.toLowerCase().includes(q)) &&
        (selectedType === 'all' || d.type === selectedType)
      )
    })
  }, [allFiles, searchQuery, selectedType])

  // 类型统计
  const typeStats = useMemo(() => {
    const s: Record<string, number> = {}
    docs.forEach((d) => {
      s[d.type] = (s[d.type] || 0) + 1
    })
    return s
  }, [docs])

  // 自动展开当前路径
  useEffect(() => {
    const pathSet = new Set<string>()
    let accum = ''
    for (const seg of currentPath) {
      accum = accum ? `${accum}/${seg}` : seg
      pathSet.add(accum)
    }
    setExpanded(pathSet)
  }, [currentPath])

  const navigateTo = (path: string) => {
    setCurrentPath(path ? path.split('/') : [])
    setSearchQuery('')
    setSelectedType('all')
    setMobileDrawer(false)
  }

  const toggleExpand = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(path) ? next.delete(path) : next.add(path)
      return next
    })
  }

  const breadcrumbs = currentPath.map((name, i) => ({
    name,
    path: currentPath.slice(0, i + 1).join('/'),
    isLast: i === currentPath.length - 1,
  }))

  const folders = currentFolder.children.filter((c) => c.isFolder)
  const files = currentFolder.children.filter((c) => !c.isFolder)
  const hasItems = isSearching
    ? filteredFiles.length > 0
    : folders.length > 0 || files.length > 0

  // 侧边栏仅包含文件夹
  const sidebarFolders = tree.children.filter((c) => c.isFolder)

  return (
    <div className="flex h-full docs-page">

      {/* ===== 桌面端侧边栏 ===== */}
      <motion.aside
        initial={false}
        animate={sidebarCollapsed ? 'collapsed' : 'expanded'}
        variants={sidebarVariants}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className={`hidden lg:flex flex-col shrink-0 border-r border-[rgb(var(--border))] bg-[rgb(var(--card)/0.3)] overflow-hidden ${
          sidebarCollapsed ? 'border-r-0' : 'w-56'
        }`}
      >
        {/* 侧边栏头部 */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-[rgb(var(--border))] shrink-0">
          <motion.button
            onClick={() => navigateTo('')}
            className="flex items-center gap-2 text-sm font-medium text-[rgb(var(--text))] hover:text-[rgb(var(--primary))] transition-colors"
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
          >
            <FolderOpen className="w-4 h-4 text-[rgb(var(--primary))]" />
            <span className="whitespace-nowrap">文库</span>
          </motion.button>
          <motion.button
            onClick={() => setSidebarCollapsed(true)}
            className="p-1 rounded text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--hover))] transition-all"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </motion.button>
        </div>

        {/* 文件夹树 */}
        <nav
          className={`flex-1 overflow-y-auto py-1 scrollbar-thin transition-opacity duration-150 ${
            isSearching ? 'opacity-30 pointer-events-none' : ''
          }`}
        >
          {/* 根节点 */}
          <motion.button
            onClick={() => navigateTo('')}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
              currentPath.length === 0
                ? 'text-[rgb(var(--primary))] bg-[rgb(var(--primary)/0.06)] font-medium'
                : 'text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--hover))] hover:text-[rgb(var(--text))]'
            }`}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="w-3 shrink-0" />
            <AnimatePresence>
              {currentPath.length === 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="w-1 h-1 rounded-full bg-[rgb(var(--primary))] shrink-0"
                />
              )}
            </AnimatePresence>
            <span className="flex-1 text-left truncate whitespace-nowrap">全部文档</span>
            <motion.span
              key={tree.fileCount}
              variants={counterVariants}
              initial="hidden"
              animate="visible"
              className="text-xs text-[rgb(var(--text-muted))/0.5] tabular-nums shrink-0"
            >
              {tree.fileCount}
            </motion.span>
          </motion.button>

          {sidebarFolders.map((folder, index) => (
            <motion.div
              key={folder.path}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <FolderTree
                node={folder}
                currentPath={currentPath}
                expanded={expanded}
                onToggle={toggleExpand}
                onNavigate={navigateTo}
              />
            </motion.div>
          ))}
        </nav>

        {/* 侧边栏底部 */}
        <div className="px-3 py-2 border-t border-[rgb(var(--border))] shrink-0">
          <motion.span
            key={docs.length}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-[rgb(var(--text-muted))/0.5] whitespace-nowrap"
          >
            {docs.length} 篇文件
          </motion.span>
        </div>
      </motion.aside>

      {/* ===== 移动端抽屉 ===== */}
      <AnimatePresence>
        {mobileDrawer && (
          <>
            <ModalOverlay className="lg:hidden" onClick={() => setMobileDrawer(false)} zIndex={40} />
            <motion.aside
              variants={mobileDrawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed top-0 left-0 bottom-0 w-64 bg-[rgb(var(--card))] border-r border-[rgb(var(--border))] flex flex-col z-50 lg:hidden shadow-xl"
            >
              <div className="flex items-center justify-between px-3 py-3 border-b border-[rgb(var(--border))]">
                <span className="text-sm font-medium text-[rgb(var(--text))]">
                  文库
                </span>
                <motion.button
                  onClick={() => setMobileDrawer(false)}
                  className="p-1 rounded text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
              <nav className="flex-1 overflow-y-auto py-1">
                <motion.button
                  onClick={() => navigateTo('')}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
                    currentPath.length === 0
                      ? 'text-[rgb(var(--primary))] bg-[rgb(var(--primary)/0.06)] font-medium'
                      : 'text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--hover))]'
                  }`}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FolderOpen className="w-4 h-4 text-[rgb(var(--primary))]" />
                  <span className="flex-1 text-left">全部文档</span>
                  <span className="text-xs text-[rgb(var(--text-muted))/0.5] tabular-nums">
                    {tree.fileCount}
                  </span>
                </motion.button>
                {sidebarFolders.map((folder, index) => (
                  <motion.div
                    key={folder.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                  >
                    <FolderTree
                      node={folder}
                      currentPath={currentPath}
                      expanded={expanded}
                      onToggle={toggleExpand}
                      onNavigate={navigateTo}
                    />
                  </motion.div>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ===== 主内容区 ===== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 工具栏 */}
        <motion.div
          className="flex items-center gap-2 px-3 py-2 border-b border-[rgb(var(--border))] shrink-0"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* 侧边栏展开按钮 */}
          <AnimatePresence>
            {sidebarCollapsed && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setSidebarCollapsed(false)}
                className="hidden lg:flex p-1.5 rounded text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--hover))] transition-all shrink-0"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <PanelLeftOpen className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
          <motion.button
            onClick={() => setMobileDrawer(true)}
            className="lg:hidden p-1.5 rounded text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--hover))] transition-all shrink-0"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Menu className="w-4 h-4" />
          </motion.button>

          {/* 搜索 + 筛选 */}
          <DocsFilter
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            typeStats={typeStats}
            totalCount={docs.length}
          />
        </motion.div>

        {/* 面包屑 */}
        <AnimatePresence mode="wait">
          {breadcrumbs.length > 0 && !isSearching && (
            <motion.div
              variants={breadcrumbVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center gap-1 px-4 py-1.5 border-b border-[rgb(var(--border))] text-xs shrink-0"
            >
              <motion.button
                onClick={() => navigateTo('')}
                className="text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))] transition-colors"
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                全部文档
              </motion.button>
              {breadcrumbs.map((bc, index) => (
                <motion.span
                  key={bc.path}
                  className="flex items-center gap-1"
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ChevronRight className="w-3 h-3 text-[rgb(var(--text-muted))/0.3]" />
                  <motion.button
                    onClick={() => navigateTo(bc.path)}
                    className={
                      bc.isLast
                        ? 'text-[rgb(var(--text))] font-medium'
                        : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]'
                    }
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {bc.name}
                  </motion.button>
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 文件列表 */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {/* 列头 */}
          <AnimatePresence>
            {hasItems && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="sticky top-0 z-10 flex items-center px-4 py-1.5 text-xs font-medium text-[rgb(var(--text-muted))/0.5] uppercase tracking-wider border-b border-[rgb(var(--border))]"
              >
                <span className="flex-1">名称</span>
                <span className="hidden sm:block w-14 text-center">类型</span>
                <span className="hidden md:block w-24 text-right">日期</span>
                <span className="w-8" />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {isSearching ? (
              filteredFiles.length > 0 ? (
                <motion.div
                  key="search-results"
                  variants={fileListContainerVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0 }}
                >
                  {filteredFiles.map((n) => (
                    <motion.div key={n.path} variants={fileRowVariants}>
                      <FileRow node={n} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="search-empty"
                  variants={emptyStateVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0 }}
                >
                  <EmptyState
                    message="未找到匹配的文件"
                    onClear={() => {
                      setSearchQuery('')
                      setSelectedType('all')
                    }}
                  />
                </motion.div>
              )
            ) : (
              <motion.div
                key="folder-content"
                variants={fileListContainerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
              >
                {folders.length === 0 && files.length === 0 && (
                  <EmptyState message="暂无文件" />
                )}
                {folders.map((f) => (
                  <motion.div key={f.path} variants={fileRowVariants}>
                    <FolderRow node={f} onNavigate={navigateTo} />
                  </motion.div>
                ))}
                {files.map((f) => (
                  <motion.div key={f.path} variants={fileRowVariants}>
                    <FileRow node={f} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// ============ 侧边栏文件夹树 ============

function FolderTree({
  node,
  currentPath,
  expanded,
  onToggle,
  onNavigate,
  depth = 0
}: {
  node: TreeNode
  currentPath: string[]
  expanded: Set<string>
  onToggle: (path: string) => void
  onNavigate: (path: string) => void
  depth?: number
}) {
  const isCurrent = currentPath.join('/') === node.path
  const isOpen = expanded.has(node.path)
  const subFolders = node.children.filter((c) => c.isFolder)

  return (
    <div>
      <motion.div
        className={`flex items-center ${isCurrent ? 'bg-[rgb(var(--primary)/0.06)]' : ''}`}
        variants={treeItemVariants}
        whileHover={{ x: 2 }}
        transition={{ duration: 0.15 }}
      >
        {/* 展开箭头 */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation()
            onToggle(node.path)
          }}
          className="flex items-center justify-center w-5 h-5 shrink-0 rounded-sm hover:bg-[rgb(var(--hover))] transition-colors"
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight
            className="w-3 h-3 text-[rgb(var(--text-muted))/0.4]"
          />
        </motion.button>

        {/* 文件夹名称 */}
        <motion.button
          onClick={() => {
            onNavigate(node.path)
            if (!isOpen) onToggle(node.path)
          }}
          className={`flex items-center gap-2 flex-1 min-w-0 px-1.5 py-1.5 rounded-r-sm text-sm transition-colors ${
            isCurrent
              ? 'text-[rgb(var(--primary))] font-medium'
              : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--hover))/0.5]'
          }`}
          whileTap={{ scale: 0.98 }}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="open"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <FolderOpen
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isCurrent
                      ? 'text-[rgb(var(--primary))]'
                      : 'text-[rgb(var(--text-muted))]'
                  }`}
                />
              </motion.div>
            ) : (
              <motion.div
                key="closed"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Folder
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isCurrent
                      ? 'text-[rgb(var(--primary))]'
                      : 'text-[rgb(var(--text-muted))]'
                  }`}
                />
              </motion.div>
            )}
          </AnimatePresence>
          <span className="truncate">{node.name}</span>
          <motion.span
            key={node.fileCount}
            variants={counterVariants}
            initial="hidden"
            animate="visible"
            className="ml-auto text-xs text-[rgb(var(--text-muted))/0.5] tabular-nums shrink-0"
          >
            {node.fileCount}
          </motion.span>
        </motion.button>
      </motion.div>

      {/* 子文件夹 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={folderContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ overflow: 'hidden' }}
          >
            {subFolders.map((child, index) => (
              <motion.div
                key={child.path}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                style={{ paddingLeft: `${(depth + 1) * 12}px` }}
              >
                <FolderTree
                  node={child}
                  currentPath={currentPath}
                  expanded={expanded}
                  onToggle={onToggle}
                  onNavigate={onNavigate}
                  depth={depth + 1}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============ 文件行 ============

function FileRow({ node }: { node: TreeNode }) {
  const doc = node.doc!
  const Icon = typeIcons[doc.type] || FileText
  const name = doc.filename.split('/').pop()!.replace(/\.[^.]+$/, '')
  const ext = doc.type.startsWith('.') ? doc.type : '.' + doc.type
  const color = typeColors[doc.type] || 'text-gray-400'

  return (
    <motion.a
      href={`/docs/${encodeURIComponent(doc.filename.replace(/\.[^.]+$/, ''))}`}
      className="group flex items-center gap-3 px-4 h-10 border-b border-[rgb(var(--border))] transition-colors"
      whileHover={{ x: 2 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        initial={{ scale: 1 }}
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ duration: 0.2 }}
      >
        <Icon
          className={`w-4 h-4 ${color} shrink-0 opacity-60 group-hover:opacity-100 transition-opacity`}
        />
      </motion.div>
      <span className="flex-1 min-w-0 text-sm text-[rgb(var(--text))] truncate group-hover:text-[rgb(var(--primary))] transition-colors flex items-center gap-1.5">
        {name}
        {doc.recommend && (
          <span title="推荐文件" className="flex shrink-0">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 shrink-0" />
          </span>
        )}
      </span>
      <span
        className={`hidden sm:inline text-xs font-mono ${color} opacity-40 w-14 text-center shrink-0`}
      >
        {ext}
      </span>
      <span className="hidden md:inline text-xs text-[rgb(var(--text-muted))/0.4] tabular-nums w-24 text-right shrink-0">
        {doc.createTime}
      </span>
      <div className="shrink-0">
        <DocAction doc={doc} />
      </div>
    </motion.a>
  )
}

// ============ 文件夹行（内容区） ============

function FolderRow({
  node,
  onNavigate,
}: {
  node: TreeNode
  onNavigate: (path: string) => void
}) {
  return (
    <motion.button
      onClick={() => onNavigate(node.path)}
      className="group w-full flex items-center gap-3 px-4 h-10 border-b border-[rgb(var(--border))] hover:bg-[rgb(var(--hover))] transition-colors"
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        initial={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.2 }}
      >
        <Folder className="w-4 h-4 text-[rgb(var(--text-muted))] shrink-0 group-hover:text-[rgb(var(--primary))] transition-colors" />
      </motion.div>
      <span className="flex-1 min-w-0 text-left text-sm text-[rgb(var(--text))] truncate group-hover:text-[rgb(var(--primary))] transition-colors">
        {node.name}
      </span>
      <motion.span
        key={node.fileCount}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-xs text-[rgb(var(--text-muted))/0.4] tabular-nums shrink-0"
      >
        {node.fileCount} 篇
      </motion.span>
      <motion.div
        initial={{ x: 0 }}
        whileHover={{ x: 3 }}
        transition={{ duration: 0.2 }}
      >
        <ChevronRight className="w-3.5 h-3.5 text-[rgb(var(--text-muted))/0.3] shrink-0 group-hover:text-[rgb(var(--text-muted))] transition-colors" />
      </motion.div>
    </motion.button>
  )
}

// ============ 操作按钮 ============

function DocAction({ doc }: { doc: DocMeta }) {
  const fileUrl = buildDocFileUrl(doc.docNamespace, doc.filename)
  const isHtml = doc.type === 'html' || doc.type === '.html'

  return (
    <motion.button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (isHtml) {
          window.open(fileUrl, '_blank')
        } else {
          const a = document.createElement('a')
          a.href = fileUrl
          a.download = doc.filename.split('/').pop() || ''
          a.click()
        }
      }}
      className="p-1 rounded text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--border)/0.4)] transition-all"
      title={isHtml ? '在新窗口打开' : '下载文件'}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        initial={{ rotate: 0 }}
        whileHover={{ rotate: isHtml ? 45 : 0 }}
        transition={{ duration: 0.2 }}
      >
        {isHtml ? (
          <ExternalLink className="w-3.5 h-3.5" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
      </motion.div>
    </motion.button>
  )
}

// ============ 空状态 ============

function EmptyState({
  message,
  onClear,
}: {
  message: string
  onClear?: () => void
}) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-20 text-[rgb(var(--text-muted))]"
      variants={emptyStateVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Search className="w-16 h-16 mb-4 opacity-30" />
      </motion.div>
      <motion.p
        className="text-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {message}
      </motion.p>
      {onClear && (
        <motion.button
          onClick={onClear}
          className="mt-3 px-4 py-1.5 text-sm text-[rgb(var(--primary))] bg-[rgb(var(--primary)/0.7)] rounded-lg hover:bg-[rgb(var(--primary)/0.15)] transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          清除筛选条件
        </motion.button>
      )}
    </motion.div>
  )
}
