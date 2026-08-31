'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import { ExternalLink, Star } from 'lucide-react'
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

interface GamesClientProps {
  initialProjects: Project[]
}

// 街机霓虹色循环 - 按主题适配（浅色主题加深黄色以保证对比度）
function getNeonThemes(theme: string) {
  const yellow = (theme === 'light' || theme === 'macaron')
    ? { border: '#d97706', glow: 'rgba(217,119,6,0.45)', bg: 'rgba(217,119,6,0.1)' }
    : { border: '#ffff00', glow: 'rgba(255,255,0,0.5)', bg: 'rgba(255,255,0,0.08)' }
  return [
    { border: '#ff00ff', glow: 'rgba(255,0,255,0.5)', bg: 'rgba(255,0,255,0.08)' },
    { border: '#00ffff', glow: 'rgba(0,255,255,0.5)', bg: 'rgba(0,255,255,0.08)' },
    yellow,
    { border: '#00ff00', glow: 'rgba(0,255,0,0.5)', bg: 'rgba(0,255,0,0.08)' },
  ]
}

// 标题黄色 - 按主题适配
function getTitleYellow(theme: string) {
  return (theme === 'light' || theme === 'macaron') ? '#d97706' : '#ffff00'
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.3 }
  }
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }
  }
}

const titleVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
}

function ArcadeCard({ project, index, neonThemes }: { project: Project; index: number; neonThemes: ReturnType<typeof getNeonThemes> }) {
  const neon = neonThemes[index % 4]
  const [imgError, setImgError] = useState(false)

  return (
    <motion.div
      variants={cardVariants}
      className="group relative h-full flex flex-col"
    >
      {/* 街机框体顶部装饰 */}
      <div
        className="relative mx-auto h-3 rounded-t-lg shrink-0"
        style={{
          width: '80%',
          background: `linear-gradient(180deg, ${neon.border}44 0%, ${neon.border}22 100%)`,
          boxShadow: `0 -2px 8px ${neon.glow}`
        }}
      />

      {/* 屏幕区域 */}
      <div
        className="relative bg-[rgb(var(--card))] border-2 rounded-b-2xl overflow-hidden transition-all duration-300 flex flex-col flex-1"
        style={{
          borderColor: neon.border,
          boxShadow: `0 10px 30px rgba(0,0,0,0.4), inset 0 0 30px ${neon.bg}`
        }}
      >
        {/* 屏幕内发光 */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: `radial-gradient(ellipse at center, rgba(255,255,255,0.03) 0%, transparent 70%)`
          }}
        />

        {/* CRT 扫描线 */}
        <div
          className="absolute inset-0 pointer-events-none z-10 opacity-[0.06]"
          style={{
            background: `repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 1px, transparent 1px, transparent 3px)`
          }}
        />

        {/* 项目图片 */}
        <div className="relative h-40 overflow-hidden">
          {project.pic_url && !imgError ? (
            <Image
              src={project.pic_url}
              alt={project.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              onError={() => setImgError(true)}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-5xl"
              style={{ background: `linear-gradient(135deg, ${neon.bg}, transparent)` }}
            >
              🎮
            </div>
          )}

          {/* 图片遮罩 */}
          <div
            className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-40"
            style={{ background: neon.border, opacity: 0.15 }}
          />

          {/* HIGH SCORE 标签 */}
          <span
            className="absolute top-2 right-3 z-20 font-mono text-[10px] tracking-wider"
            style={{ color: neon.border, textShadow: `0 0 5px ${neon.border}` }}
          >
            最高分: 99999
          </span>

          {/* 推荐标签 */}
          {project.recommend && (
            <div className="absolute top-2 left-3 z-20 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-[10px] text-yellow-400 font-bold tracking-wider">推荐</span>
            </div>
          )}
        </div>

        {/* 信息区域 */}
        <div className="relative z-20 p-4 text-center flex flex-col flex-1">
          <h3
            className="font-bold text-sm mb-2 line-clamp-1 text-[rgb(var(--card-foreground))]"
            style={{ fontFamily: "'Press Start 2P', 'Courier New', monospace", fontSize: '0.7rem' }}
          >
            {project.title}
          </h3>
          <p
            className="text-[rgb(var(--muted-foreground))] text-xs mb-3 line-clamp-2 leading-relaxed"
            style={{ minHeight: '2.4em' }}
          >
            {project.content || ' '}
          </p>

          {/* 技术栈标签 */}
          <div className="flex flex-wrap justify-center gap-1 mb-3" style={{ minHeight: '1.75rem' }}>
            {project.techs && project.techs.split(',').slice(0, 3).map((tech, i) => (
              <span
                key={i}
                className="text-[10px] px-1.5 py-0.5 rounded border"
                style={{
                  borderColor: neon.border,
                  color: neon.border,
                  background: neon.bg,
                  fontFamily: "'Courier New', monospace"
                }}
              >
                {tech.trim()}
              </span>
            ))}
          </div>

          {/* PLAY 按钮 */}
          <Link
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 hover:scale-105 active:scale-95 mt-auto"
            style={{
              background: `linear-gradient(180deg, ${neon.border} 0%, ${neon.border}cc 100%)`,
              color: '#000',
              boxShadow: `0 0 15px ${neon.glow}, 0 4px 0 ${neon.border}88`,
              fontFamily: "'Press Start 2P', 'Courier New', monospace",
              fontSize: '0.6rem'
            }}
          >
            开始游戏
          </Link>
        </div>
      </div>

      {/* 底部装饰：摇杆 + 按钮 */}
      <div className="flex justify-between items-end px-3 -mt-1">
        {/* 摇杆 */}
        <div className="flex flex-col items-center">
          <div
            className="w-2 h-5 rounded-full"
            style={{ background: 'linear-gradient(90deg, #888 0%, #ccc 50%, #888 100%)' }}
          />
          <div
            className="w-5 h-5 rounded-full"
            style={{
              background: 'radial-gradient(circle, #ff0000 0%, #990000 100%)',
              boxShadow: '0 0 8px #ff0000, 0 3px 6px rgba(0,0,0,0.5)'
            }}
          />
        </div>

        {/* 彩色按钮 */}
        <div className="flex gap-1.5">
          <div className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-md" style={{ boxShadow: '0 0 5px #ff0000, 0 2px 4px rgba(0,0,0,0.4)' }} />
          <div className="w-3.5 h-3.5 rounded-full bg-green-500 shadow-md" style={{ boxShadow: '0 0 5px #00ff00, 0 2px 4px rgba(0,0,0,0.4)' }} />
          <div className="w-3.5 h-3.5 rounded-full bg-blue-500 shadow-md" style={{ boxShadow: '0 0 5px #0000ff, 0 2px 4px rgba(0,0,0,0.4)' }} />
        </div>
      </div>
    </motion.div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="mx-auto h-3 rounded-t-lg bg-[rgb(var(--muted))]" style={{ width: '80%' }} />
          <div className="bg-[rgb(var(--card))] border-2 border-[rgb(var(--border))] rounded-b-2xl overflow-hidden">
            <div className="h-40 bg-[rgb(var(--muted))]" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-[rgb(var(--muted))] rounded w-3/4 mx-auto" />
              <div className="h-3 bg-[rgb(var(--muted))] rounded w-full" />
              <div className="h-3 bg-[rgb(var(--muted))] rounded w-2/3 mx-auto" />
              <div className="h-8 bg-[rgb(var(--muted))] rounded-full w-2/3 mx-auto" />
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
      <span className="text-6xl block mb-4">🎮</span>
      <h3 className="text-xl font-bold mb-2 text-[rgb(var(--foreground))]">暂无游戏</h3>
      <p className="text-[rgb(var(--muted-foreground))]">暂未收录小游戏，请稍后再来投币~</p>
    </motion.div>
  )
}

export default function GamesClient({ initialProjects }: GamesClientProps) {
  // 模拟加载延迟营造街机开机感
  const [showContent, setShowContent] = useState(false)
  const { theme } = useTheme()
  const neonThemes = getNeonThemes(theme)
  const titleYellow = getTitleYellow(theme)

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 600)
    return () => clearTimeout(timer)
  }, [])

  const projects = initialProjects || []

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 背景：保持暗色调街机感，半透明叠加主题背景 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(rgba(0,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      {/* 背景氛围光 */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-[150px] pointer-events-none"
        style={{ background: 'rgba(255,0,255,0.04)' }} />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-[150px] pointer-events-none"
        style={{ background: 'rgba(0,255,255,0.04)' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* 标题区 */}
        <motion.div
          className="text-center mb-12"
          variants={titleVariants}
          initial="hidden"
          animate="visible"
        >
          <h1
            className="text-3xl sm:text-5xl font-bold mb-4 tracking-wider"
            style={{
              fontFamily: "'Press Start 2P', 'Courier New', monospace",
              color: titleYellow,
              textShadow: `0 0 10px ${titleYellow}, 0 0 20px ${titleYellow}, 0 0 40px ${titleYellow}, 4px 4px 0px #ff00ff`,
              lineHeight: 1.5
            }}
          >
            街机游戏厅
          </h1>
        </motion.div>

        {/* 内容区 */}
        {!showContent ? (
          <LoadingSkeleton />
        ) : projects.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {projects.map((project, index) => (
              <ArcadeCard key={project.id} project={project} index={index} neonThemes={neonThemes} />
            ))}
          </motion.div>
        )}
      </div>

      {/* 注入 keyframes 动画 */}
      <style jsx global>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes coinPulse {
          0%, 100% { box-shadow: 0 0 10px #00ff00, inset 0 0 10px rgba(0,255,0,0.2); }
          50% { box-shadow: 0 0 20px #00ff00, inset 0 0 20px rgba(0,255,0,0.4); }
        }
      `}</style>
    </div>
  )
}
