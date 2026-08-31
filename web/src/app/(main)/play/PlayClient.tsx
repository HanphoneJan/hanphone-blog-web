'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import { ExternalLink, Star, Sparkles } from 'lucide-react'

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

interface PlayClientProps {
  initialProjects: Project[]
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 25, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }
  }
}

// 卡片底色柔和新变色（供不支持背景渐变卡片时作为左边缘强调色）
const CARD_ACCENTS = [
  'rgba(192,132,252,0.6)',  // purple
  'rgba(244,114,182,0.6)',  // pink
  'rgba(251,146,60,0.6)',   // orange
  'rgba(96,165,250,0.6)',   // blue
  'rgba(74,222,128,0.6)',   // green
  'rgba(252,211,77,0.6)',   // yellow
]

function PlayCard({ project, index }: { project: Project; index: number }) {
  const [imgError, setImgError] = useState(false)
  const accent = CARD_ACCENTS[index % CARD_ACCENTS.length]

  return (
    <motion.div
      variants={cardVariants}
      className="group h-full"
    >
      <div
        className="relative bg-[rgb(var(--card))] rounded-2xl overflow-hidden border border-[rgb(var(--border))] transition-all duration-500 hover:-translate-y-1.5 h-full flex flex-col"
        style={{
          boxShadow: `0 4px 20px -8px ${accent.replace('0.6', '0.15')}`
        }}
      >
        {/* 顶部彩条 */}
        <div
          className="h-1 w-full"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
        />

        {/* 图片区 */}
        <div className="relative h-44 overflow-hidden">
          {project.pic_url && !imgError ? (
            <Image
              src={project.pic_url}
              alt={project.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              onError={() => setImgError(true)}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${accent.replace('0.6', '0.1')}, transparent 60%)` }}
            >
              <Sparkles className="h-10 w-10" style={{ color: accent, opacity: 0.6 }} />
            </div>
          )}

          {/* 渐变遮罩 */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center"
            style={{ background: `linear-gradient(180deg, transparent 40%, ${accent.replace('0.6', '0.5')})` }}
          >
            <ExternalLink className="h-7 w-7 text-white/90 drop-shadow-lg" />
          </div>

          {/* 推荐标签 */}
          {project.recommend && (
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-[11px] text-white font-medium">推荐</span>
            </div>
          )}
        </div>

        {/* 信息区 */}
        <div className="p-5 flex flex-col flex-1">
          <h3
            className="text-base font-bold mb-2 line-clamp-1 text-[rgb(var(--card-foreground))] group-hover:text-[rgb(var(--primary))] transition-colors"
          >
            {project.title}
          </h3>
          <p
            className="text-sm text-[rgb(var(--muted-foreground))] mb-4 line-clamp-2 leading-relaxed"
            style={{ minHeight: '2.6em' }}
          >
            {project.content || ' '}
          </p>

          {/* 技术栈标签 */}
          <div className="flex flex-wrap gap-1.5 mb-4" style={{ minHeight: '1.75rem' }}>
            {project.techs && project.techs.split(',').slice(0, 3).map((tech, i) => (
              <span
                key={i}
                className="text-[11px] px-2 py-0.5 rounded-full border font-medium transition-colors"
                style={{
                  borderColor: CARD_ACCENTS[i % CARD_ACCENTS.length].replace('0.6', '0.3'),
                  color: CARD_ACCENTS[i % CARD_ACCENTS.length].replace('0.6', '0.9'),
                  background: CARD_ACCENTS[i % CARD_ACCENTS.length].replace('0.6', '0.08')
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
            className="inline-flex items-center gap-1.5 text-sm font-medium transition-all duration-300 group-hover:gap-2 mt-auto"
            style={{ color: accent.replace('0.6', '1') }}
          >
            探索项目
            <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl overflow-hidden">
          <div className="h-1 bg-[rgb(var(--muted))]" />
          <div className="h-44 bg-[rgb(var(--muted))]" />
          <div className="p-5 space-y-3">
            <div className="h-5 bg-[rgb(var(--muted))] rounded w-3/4" />
            <div className="h-3 bg-[rgb(var(--muted))] rounded w-full" />
            <div className="h-3 bg-[rgb(var(--muted))] rounded w-2/3" />
            <div className="flex gap-1.5">
              <div className="h-5 bg-[rgb(var(--muted))] rounded-full w-14" />
              <div className="h-5 bg-[rgb(var(--muted))] rounded-full w-16" />
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
      <Sparkles className="h-16 w-16 mx-auto mb-4 text-[rgb(var(--muted-foreground))]" style={{ opacity: 0.3 }} />
      <h3 className="text-xl font-bold mb-2 text-[rgb(var(--foreground))]">暂无创意项目</h3>
      <p className="text-sm text-[rgb(var(--muted-foreground))]">一些小练习正在创作中，敬请期待~</p>
    </motion.div>
  )
}

export default function PlayClient({ initialProjects }: PlayClientProps) {
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 400)
    return () => clearTimeout(timer)
  }, [])

  const projects = initialProjects || []

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 氛围光球 */}
      <div
        className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full blur-[130px] pointer-events-none"
        style={{ background: 'rgba(192,132,252,0.05)', transform: 'translate(-30%, -20%)' }}
      />
      <div
        className="absolute bottom-0 right-0 w-[450px] h-[450px] rounded-full blur-[120px] pointer-events-none"
        style={{ background: 'rgba(244,114,182,0.05)', transform: 'translate(20%, 20%)' }}
      />
      <div
        className="absolute top-1/2 left-1/2 w-[350px] h-[350px] rounded-full blur-[100px] pointer-events-none"
        style={{ background: 'rgba(251,146,60,0.04)', transform: 'translate(-50%, -50%)' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* 标题区 */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1
            className="text-4xl sm:text-6xl font-light mb-4 tracking-tight"
            style={{
              fontFamily: "'Poiret One', 'Noto Serif SC', serif",
              background: 'linear-gradient(135deg, #c084fc 0%, #f472b6 50%, #fb923c 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.2
            }}
          >
            创意实验室
          </h1>
          <p className="text-sm text-[rgb(var(--muted-foreground))] max-w-md mx-auto leading-relaxed">
            一些有趣的网页小练习，探索创意与交互的可能性
          </p>
        </motion.div>

        {/* 内容区 */}
        {!showContent ? (
          <LoadingSkeleton />
        ) : projects.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {projects.map((project, index) => (
              <PlayCard key={project.id} project={project} index={index} />
            ))}
          </motion.div>
        )}

        {/* 底部 */}
        <motion.div
          className="text-center mt-16 pb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-xs text-[rgb(var(--muted-foreground))]" style={{ opacity: 0.5 }}>
            ✦ 用好奇心打造 ✦
          </p>
        </motion.div>
      </div>
    </div>
  )
}
