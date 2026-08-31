'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import { ExternalLink, Star, Terminal, Wrench } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeProvider'

interface Project {
  id: number
  title: string
  content: string
  techs: string
  pic_url: string
  url: string
  type: number
  recommend: boolean
}

interface ToolsClientProps {
  initialProjects: Project[]
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 }
  }
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }
  }
}

// 终端风格强调色 - 按主题适配（浅色主题加深金色以保证对比度）
function getAccent(theme: string) {
  switch (theme) {
    case 'light':   return { main: '#b8860b', dim: 'rgba(184,134,11,0.15)' }
    case 'macaron': return { main: '#d97706', dim: 'rgba(217,119,6,0.15)' }
    case 'cyber':   return { main: '#fbbf24', dim: 'rgba(251,191,36,0.15)' }
    default:        return { main: '#e8c547', dim: 'rgba(232,197,71,0.12)' }
  }
}

function ToolCard({ project, accent, accentDim }: { project: Project; accent: string; accentDim: string }) {
  const [imgError, setImgError] = useState(false)

  return (
    <motion.div
      variants={cardVariants}
      className="group relative h-full"
    >
      <div
        className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl h-full flex flex-col"
        style={{
          borderLeftWidth: '3px',
          borderLeftColor: accent
        }}
      >
        {/* 图片区域 */}
        <div className="relative h-36 overflow-hidden">
          {project.pic_url && !imgError ? (
            <Image
              src={project.pic_url}
              alt={project.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImgError(true)}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${accentDim}, transparent)` }}
            >
              <Wrench className="h-10 w-10" style={{ color: accent, opacity: 0.5 }} />
            </div>
          )}

          {/* 遮罩层 */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.45)' }}
          >
            <ExternalLink className="h-6 w-6 text-white/80" />
          </div>

          {/* 推荐标签 */}
          {project.recommend && (
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full z-10">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-[10px] text-yellow-400 font-bold">推荐</span>
            </div>
          )}
        </div>

        {/* 信息区 */}
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-xs font-mono opacity-60"
              style={{ color: accent }}
            >
              $
            </span>
            <h3 className="font-semibold text-sm line-clamp-1 text-[rgb(var(--card-foreground))] group-hover:text-[rgb(var(--primary))] transition-colors"
              style={{ fontFamily: "'Space Mono', 'Courier New', monospace" }}
            >
              {project.title}
            </h3>
          </div>

          <p
            className="text-xs text-[rgb(var(--muted-foreground))] mb-3 line-clamp-2 leading-relaxed"
            style={{ minHeight: '2.4em' }}
          >
            {project.content || ' '}
          </p>

          {/* 技术栈 */}
          <div className="flex flex-wrap gap-1 mb-3" style={{ minHeight: '1.75rem' }}>
            {project.techs && project.techs.split(',').slice(0, 3).map((tech, i) => (
              <span
                key={i}
                className="text-[10px] px-2 py-0.5 rounded font-mono border transition-colors"
                style={{
                  borderColor: 'rgb(var(--border))',
                  color: accent,
                  background: accentDim
                }}
              >
                {tech.trim()}
              </span>
            ))}
          </div>

          <Link
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider transition-all duration-300 hover:gap-2 mt-auto"
            style={{ color: accent }}
          >
            <Terminal className="h-3 w-3" />
            打开工具
            <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="animate-pulse bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl overflow-hidden">
          <div className="h-36 bg-[rgb(var(--muted))]" />
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-3 w-4 bg-[rgb(var(--muted))] rounded" />
              <div className="h-4 bg-[rgb(var(--muted))] rounded w-2/3" />
            </div>
            <div className="h-3 bg-[rgb(var(--muted))] rounded w-full" />
            <div className="h-3 bg-[rgb(var(--muted))] rounded w-3/4" />
            <div className="flex gap-1">
              <div className="h-4 bg-[rgb(var(--muted))] rounded w-12" />
              <div className="h-4 bg-[rgb(var(--muted))] rounded w-14" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-16"
    >
      <Wrench className="h-16 w-16 mx-auto mb-4 text-[rgb(var(--muted-foreground))]" style={{ opacity: 0.4 }} />
      <h3
        className="text-lg font-bold mb-2 text-[rgb(var(--foreground))]"
        style={{ fontFamily: "'Space Mono', 'Courier New', monospace" }}
      >
        暂无工具
      </h3>
      <p className="text-sm text-[rgb(var(--muted-foreground))]">暂无工具收录，请稍后再来~</p>
    </motion.div>
  )
}

export default function ToolsClient({ initialProjects }: ToolsClientProps) {
  const [showContent, setShowContent] = useState(false)
  const { theme } = useTheme()
  const accent = getAccent(theme)

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 400)
    return () => clearTimeout(timer)
  }, [])

  const projects = initialProjects || []

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Grid 背景 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(232,197,71,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(232,197,71,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* 环境光 */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[120px] pointer-events-none"
        style={{ background: 'rgba(232,197,71,0.04)' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* 标题区 - 终端风格 */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1
            className="text-center text-4xl sm:text-5xl font-bold mb-3 tracking-tight"
            style={{
              fontFamily: "'Space Mono', 'Courier New', monospace",
              color: 'rgb(var(--foreground))'
            }}
          >
            <span style={{ color: accent.main }}>&gt; </span>
            工具箱
            <span
              className="inline-block w-3 h-8 ml-1 align-middle animate-pulse"
              style={{ background: accent.main, width: '2px' }}
            />
          </h1>
        </motion.div>

        {/* 内容区 */}
        {!showContent ? (
          <LoadingSkeleton />
        ) : projects.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {projects.map((project) => (
              <ToolCard key={project.id} project={project} accent={accent.main} accentDim={accent.dim} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
