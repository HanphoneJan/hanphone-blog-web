'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Image from 'next/image'
import {
  Loader2,
  AlertCircle,
  Plus
} from 'lucide-react'
import { ENDPOINTS } from '@/lib/api'
import {  ASSETS , API_CODE } from '@/lib/constants'
import { SITE_URL } from '@/lib/seo-config'
import BgOverlay from '@/app/(main)/components/BgOverlay'
import ApplyModal from './components/ApplyModal'

// 野兽派几何形状
const GEOMETRIC_SHAPES = ['□', '△', '○', '◇', '✦', '◆', '▲', '▼']

export interface FriendLink {
  id: number
  type: 'friend' | 'tool' | 'blog' | 'resource'
  name: string
  description: string
  link_url: string
  url: string
  avatar: string
  color: string
  recommend: boolean
  createTime: string
}

interface LinkClientProps {
  initialLinks: FriendLink[]
}

// 获取网站元数据的函数
async function fetchWebsiteMetadata(url: string) {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    const validDomain = urlObj.hostname.replace(/^www\./, '').toLowerCase();

    const response = await fetch(
      `/next-api/metadata?url=${encodeURIComponent(url)}&validDomain=${encodeURIComponent(validDomain)}`,
      { cache: 'no-store' }
    );

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Invalid response format')
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error)
    }

    return {
      description: data.description || '',
      avatar: data.avatar || '',
      title: data.title || new URL(url).hostname
    }
  } catch (error) {
    console.error('Error fetching metadata:', error)
    const hostname = new URL(url).hostname
    return {
      description: '',
      avatar: `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`,
      title: hostname
    }
  }
}

// 获取友链数据的函数
// 解码 HTML 实体（&amp; → & 等）
function decodeHtmlEntities(raw?: string): string | undefined {
  if (!raw) return raw
  const txt = document.createElement('textarea')
  txt.innerHTML = raw
  return txt.value
}

function decodeFriendLink(link: FriendLink): FriendLink {
  return {
    ...link,
    avatar: decodeHtmlEntities(link.avatar) || link.avatar,
    url: decodeHtmlEntities(link.url) || link.url,
  }
}

async function fetchFriendLinks(): Promise<FriendLink[]> {
  try {
    const response = await fetch(ENDPOINTS.FRIENDLINKS, {})

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.code !== API_CODE.SUCCESS) {
      throw new Error(data.message || 'Failed to fetch friend links')
    }

    return (data.data || []).map(decodeFriendLink)
  } catch (error) {
    console.error('Error fetching friend links:', error)
    return []
  }
}

// 野兽派风格友链卡片
const BrutalistFriendCard = ({
  link,
  fetchingUrls,
  index
}: {
  link: FriendLink;
  fetchingUrls: Set<number>;
  index: number;
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const randomShape = GEOMETRIC_SHAPES[index % GEOMETRIC_SHAPES.length]
  const rotation = (index % 4) * 3 - 4.5 // -4.5, -1.5, 1.5, 4.5
  
  return (
    <div
      className="links-card relative group"
      style={{ transform: `rotate(${rotation}deg)` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative"
      >
        {/* 野兽派背景层 - 粗边框大阴影 */}
        <div 
          className="absolute inset-0 bg-[rgb(var(--primary))] transition-transform duration-200"
          style={{ 
            transform: isHovered ? 'translate(4px, 4px)' : 'translate(6px, 6px)',
          }}
        />
        
        {/* 主卡片 */}
        <div 
          className="relative bg-[rgb(var(--card))] border-2 border-[rgb(var(--border))] p-4 transition-transform duration-200"
          style={{ 
            transform: isHovered ? 'translate(-2px, -2px)' : 'translate(0, 0)',
            borderColor: link.color || 'rgb(var(--primary))'
          }}
        >
          {/* 几何装饰 */}
          <div 
            className="absolute -top-2 -right-2 text-lg font-bold select-none"
            style={{ color: link.color || 'rgb(var(--primary))' }}
          >
            {randomShape}
          </div>
          
          {/* 头像区域 */}
          <div className="relative w-16 h-16 mb-3 mx-auto">
            <div 
              className="absolute inset-0 border-2 border-[rgb(var(--text))]"
              style={{ transform: 'translate(3px, 3px)' }}
            />
            <div className="relative w-full h-full border-2 border-[rgb(var(--border))] overflow-hidden bg-[rgb(var(--muted))]">
              {fetchingUrls.has(link.id) ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin" style={{ color: link.color || 'rgb(var(--primary))' }} />
                </div>
              ) : (
                <Image
                  src={link.avatar || ASSETS.DEFAULT_AVATAR}
                  alt={link.name}
                  fill
                  className="object-cover"
                />
              )}
            </div>
            
            {/* 推荐标识 */}
            {link.recommend && (
              <div 
                className="absolute -top-1 -left-1 w-5 h-5 flex items-center justify-center border border-[rgb(var(--text))] text-[10px] font-bold"
                style={{ 
                  background: '#FFD700',
                  color: '#000',
                  transform: 'rotate(-15deg)'
                }}
              >
                ★
              </div>
            )}
          </div>

          {/* 名称 */}
          <h3
            className="text-center font-bold text-sm truncate tracking-tight"
            style={{
              color: link.color || 'rgb(var(--text))',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
          >
            {link.name}
          </h3>
        </div>
      </a>
    </div>
  )
}

// 野兽派无限滚动画廊
const BrutalistGallery = ({ links, fetchingUrls }: { links: FriendLink[]; fetchingUrls: Set<number> }) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)

  // 复制链接以实现无缝循环
  const displayLinks = useMemo(() => {
    return [...links, ...links, ...links]
  }, [links])

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    let animationId: number
    let scrollPos = 0
    const speed = 0.8

    const animate = () => {
      if (!isPaused && container) {
        scrollPos += speed
        const firstSetWidth = container.scrollWidth / 3

        if (scrollPos >= firstSetWidth) {
          scrollPos = 0
        }

        container.scrollLeft = scrollPos
      }
      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationId)
  }, [isPaused])

  return (
    <div 
      className="relative py-8 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 野兽派边框装饰 */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[rgb(var(--primary))]" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-[rgb(var(--primary))]" />
      
      {/* 标题区域 */}
      <div className="flex items-center justify-between px-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-[rgb(var(--primary))] rotate-45" />
          <h2
            className="text-2xl font-black tracking-wider"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            友链
          </h2>
          <span className="text-sm font-bold opacity-60">({links.length})</span>
        </div>
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 bg-[rgb(var(--primary))]"
              style={{ opacity: 1 - i * 0.15 }}
            />
          ))}
        </div>
      </div>

      {/* 滚动容器 */}
      <div
        ref={scrollRef}
        className="scrollbar-hide overflow-x-hidden px-4"
        style={{ scrollBehavior: 'auto' }}
      >
        <div className="flex gap-6" style={{ width: 'max-content' }}>
          {displayLinks.map((link, index) => (
            <div key={`${link.id}-${index}`} className="flex-shrink-0">
              <BrutalistFriendCard 
                link={link} 
                fetchingUrls={fetchingUrls}
                index={index}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// 野兽派标题组件
const BrutalistTitle = ({ onApply }: { onApply: () => void }) => {
  return (
    <div className="relative py-8 px-4 mb-4">
      {/* 背景装饰块 */}
      <div 
        className="absolute top-4 left-4 w-24 h-24 bg-[rgb(var(--primary))] opacity-20"
        style={{ transform: 'rotate(12deg)' }}
      />
      <div 
        className="absolute bottom-4 right-8 w-16 h-16 border-4 border-[rgb(var(--primary))]"
        style={{ transform: 'rotate(-8deg)' }}
      />
      
      {/* 主标题 */}
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1
              className="text-5xl md:text-7xl font-black tracking-tighter mb-2"
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                lineHeight: 1,
                color: 'rgb(var(--text))'
              }}
            >
              LINKS
            </h1>
            <div className="flex items-center gap-4">
              <div className="h-1 w-16 bg-[rgb(var(--primary))]" />
              <span
                className="text-sm font-bold tracking-widest opacity-70"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                FRIEND CIRCLE
              </span>
            </div>
          </div>
          
          {/* 申请友链按钮 - 桌面端 */}
          <button
            onClick={onApply}
            className="links-apply-btn relative group hidden sm:block"
          >
            <div 
              className="absolute inset-0 bg-[rgb(var(--primary))]"
              style={{ transform: 'translate(4px, 4px)' }}
            />
            <div className="relative flex items-center gap-2 px-4 py-3 border-2 border-[rgb(var(--text))] bg-[rgb(var(--bg))] font-bold hover:bg-[rgb(var(--primary))] transition-colors">
              <Plus className="w-5 h-5" />
              <span>申请友链</span>
            </div>
          </button>
          
          {/* 申请友链按钮 - 移动端（与标题同一行） */}
          <button
            onClick={onApply}
            className="links-apply-btn relative group sm:hidden flex-shrink-0"
          >
            <div 
              className="absolute inset-0 bg-[rgb(var(--primary))]"
              style={{ transform: 'translate(3px, 3px)' }}
            />
            <div className="relative flex items-center justify-center gap-1 px-3 py-2 border-2 border-[rgb(var(--text))] bg-[rgb(var(--bg))] font-bold hover:bg-[rgb(var(--primary))] transition-colors">
              <Plus className="w-4 h-4" />
              <span className="text-sm">申请</span>
            </div>
          </button>
        </div>
      </div>
      
      {/* 装饰线条 */}
      <div className="absolute bottom-0 left-0 right-0 flex gap-1 h-2">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i}
            className="flex-1 bg-[rgb(var(--primary))]"
            style={{ opacity: i % 2 === 0 ? 1 : 0.3 }}
          />
        ))}
      </div>
    </div>
  )
}

// 野兽派工具卡片
const BrutalistToolCard = ({
  link,
  fetchingUrls,
  index
}: {
  link: FriendLink;
  fetchingUrls: Set<number>;
  index: number;
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const icons = ['◈', '⚡', '◉', '▣', '◆', '▲']
  const icon = icons[index % icons.length]

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative"
      >
        {/* 阴影层 */}
        <div
          className="absolute inset-0 bg-[rgb(var(--primary))] transition-transform duration-200"
          style={{
            transform: isHovered ? 'translate(3px, 3px)' : 'translate(4px, 4px)',
          }}
        />

        {/* 主卡片 */}
        <div
          className="relative bg-[rgb(var(--card))] border-2 border-[rgb(var(--border))] p-4 h-full transition-transform duration-200"
          style={{
            transform: isHovered ? 'translate(-2px, -2px)' : 'translate(0, 0)',
            borderColor: link.color || 'rgb(var(--primary))'
          }}
        >
          {/* 顶部装饰条 */}
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{ backgroundColor: link.color || 'rgb(var(--primary))' }}
          />

          <div className="flex items-start gap-3 pt-2">
            {/* 图标 */}
            <div
              className="w-12 h-12 border-2 border-[rgb(var(--text))] flex items-center justify-center text-xl font-bold flex-shrink-0"
              style={{ backgroundColor: link.color ? `${link.color}20` : 'rgb(var(--muted))' }}
            >
              {fetchingUrls.has(link.id) ? (
                <Loader2 className="h-5 w-5 animate-spin" style={{ color: link.color || 'rgb(var(--primary))' }} />
              ) : (
                <span style={{ color: link.color || 'rgb(var(--primary))' }}>{icon}</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3
                className="font-black text-sm uppercase truncate mb-1"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                {link.name}
              </h3>
              <p className="text-xs opacity-70 line-clamp-2">
                {link.description || '暂无描述'}
              </p>
            </div>
          </div>

          {/* 推荐标识 */}
          {link.recommend && (
            <div className="absolute top-2 right-2 text-xs font-bold text-yellow-500">
              ★
            </div>
          )}
        </div>
      </a>
    </div>
  )
}

// 野兽派博客列表项
const BrutalistBlogItem = ({
  link,
  fetchingUrls,
  index
}: {
  link: FriendLink;
  fetchingUrls: Set<number>;
  index: number;
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const markers = ['→', '›', '▸', '▹', '◃', '◂']
  const marker = markers[index % markers.length]

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 py-3 px-3 border-b-2 border-[rgb(var(--border))] last:border-b-0 transition-colors hover:bg-[rgb(var(--muted))]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 标记 */}
      <span
        className="text-lg font-bold transition-transform duration-200"
        style={{
          color: link.color || 'rgb(var(--primary))',
          transform: isHovered ? 'translateX(4px)' : 'translateX(0)'
        }}
      >
        {marker}
      </span>

      {/* 头像 */}
      <div className="relative w-8 h-8 border border-[rgb(var(--text))] overflow-hidden flex-shrink-0">
        {fetchingUrls.has(link.id) ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[rgb(var(--muted))]">
            <Loader2 className="h-4 w-4 animate-spin" style={{ color: link.color || 'rgb(var(--primary))' }} />
          </div>
        ) : (
          <Image
            src={link.avatar || ASSETS.DEFAULT_AVATAR}
            alt={link.name}
            fill
            className="object-cover"
          />
        )}
      </div>

      {/* 内容 */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-sm truncate uppercase">
          {link.name}
        </h3>
              <p className="text-xs opacity-60 line-clamp-1">
          {link.description || '暂无描述'}
        </p>
      </div>

      {/* 推荐 */}
      {link.recommend && (
        <span className="text-yellow-500 text-xs">★</span>
      )}
    </a>
  )
}

// 野兽派资源卡片
const BrutalistResourceCard = ({
  link,
  fetchingUrls,
  index
}: {
  link: FriendLink;
  fetchingUrls: Set<number>;
  index: number;
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const shapes = ['□', '△', '○', '◇']
  const shape = shapes[index % shapes.length]

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative"
      >
        {/* 阴影层 */}
        <div
          className="absolute inset-0 bg-[rgb(var(--primary))] transition-transform duration-200"
          style={{
            transform: isHovered ? 'translate(3px, 3px)' : 'translate(4px, 4px)',
          }}
        />

        {/* 主卡片 */}
        <div
          className="relative bg-[rgb(var(--card))] border-2 border-[rgb(var(--border))] p-4 transition-transform duration-200"
          style={{
            transform: isHovered ? 'translate(-2px, -2px)' : 'translate(0, 0)',
            borderColor: link.color || 'rgb(var(--primary))'
          }}
        >
          {/* 几何装饰 */}
          <div
            className="absolute -top-1 -right-1 w-6 h-6 flex items-center justify-center text-sm font-bold border border-[rgb(var(--text))]"
            style={{ backgroundColor: link.color || 'rgb(var(--primary))', color: 'rgb(var(--bg))' }}
          >
            {shape}
          </div>

          {/* 头部 */}
          <div className="flex items-center gap-3 mb-3 pr-4">
            <div
              className="relative w-10 h-10 border-2 border-[rgb(var(--text))] overflow-hidden"
              style={{ boxShadow: link.color ? `3px 3px 0 ${link.color}` : '3px 3px 0 rgb(var(--primary))' }}
            >
              {fetchingUrls.has(link.id) ? (
                <div className="absolute inset-0 flex items-center justify-center bg-[rgb(var(--muted))]">
                  <Loader2 className="h-4 w-4 animate-spin" style={{ color: link.color || 'rgb(var(--primary))' }} />
                </div>
              ) : (
                <Image
                  src={link.avatar || ASSETS.DEFAULT_AVATAR}
                  alt={link.name}
                  fill
                  className="object-cover"
                />
              )}
            </div>
            <h3 className="font-black text-sm uppercase truncate">
              {link.name}
            </h3>
          </div>

          {/* 描述 */}
          <p className="text-xs opacity-70 line-clamp-3 mb-3">
            {link.description || '暂无描述'}
          </p>

          {/* 底部 */}
          <div className="flex items-center justify-between">
            <div
              className="h-px flex-1 mr-3"
              style={{ backgroundColor: link.color || 'rgb(var(--primary))', opacity: 0.3 }}
            />
            {link.recommend && (
              <span className="text-xs font-bold text-yellow-500">★ 推荐</span>
            )}
          </div>
        </div>
      </a>
    </div>
  )
}

// 区域标题组件
const SectionTitle = ({ title, count, icon }: { title: string; count: number; icon: string }) => (
  <div className="flex items-center gap-3 mb-4">
    <span className="text-2xl">{icon}</span>
    <h2
      className="text-xl font-black tracking-wider"
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      {title}
    </h2>
    <span className="text-sm font-bold opacity-60">({count})</span>
    <div className="flex-1 h-1 bg-[rgb(var(--border))]" />
  </div>
)

export default function LinkClient({ initialLinks }: LinkClientProps) {
  const [friendLinks, setFriendLinks] = useState<FriendLink[]>([])
  const [toolLinks, setToolLinks] = useState<FriendLink[]>([])
  const [blogLinks, setBlogLinks] = useState<FriendLink[]>([])
  const [resourceLinks, setResourceLinks] = useState<FriendLink[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchingUrls, setFetchingUrls] = useState<Set<number>>(new Set())
  const [apiError, setApiError] = useState<string | null>(null)
  const [applyModalOpen, setApplyModalOpen] = useState(false)
  const [modalDefaultTab, setModalDefaultTab] = useState<'form' | 'text' | 'copy'>('form')

  // 初始化时使用服务端传入的数据
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true)
      setApiError(null)

      try {
        // 优先使用服务端传入的初始数据，如果为空则客户端重新请求
        let links = (initialLinks || []).map(decodeFriendLink)

        if (links.length === 0) {
          console.log('[Client] initialLinks is empty, fetching from client...')
          links = await fetchFriendLinks()
        }

        console.log('[Client] links to display:', links.length)

        if (links.length === 0) {
          setLoading(false)
          return
        }

        // 分类存储所有类型的链接
        const friendLinksFiltered = links.filter((link: FriendLink) => link.type === 'friend')
        const toolLinksFiltered = links.filter((link: FriendLink) => link.type === 'tool')
        const blogLinksFiltered = links.filter((link: FriendLink) => link.type === 'blog')
        const resourceLinksFiltered = links.filter((link: FriendLink) => link.type === 'resource')
        
        console.log('[Client] Filtered counts - friend:', friendLinksFiltered.length, 'tool:', toolLinksFiltered.length, 'blog:', blogLinksFiltered.length, 'resource:', resourceLinksFiltered.length)
        
        setFriendLinks(friendLinksFiltered)
        setToolLinks(toolLinksFiltered)
        setBlogLinks(blogLinksFiltered)
        setResourceLinks(resourceLinksFiltered)

        // 更新所有需要补充数据的链接
        const linksToUpdate = links.filter((link: FriendLink) => {
          const hasGenericDescription = !link.description || link.description === '暂无描述' || link.description === ''
          const hasDefaultAvatar = !link.avatar || link.avatar === ASSETS.DEFAULT_AVATAR || link.avatar === ''
          let nameMatchesDomain = true
          try {
            const urlHostname = new URL(link.url).hostname
            if (!link.name.toLowerCase().includes(urlHostname.replace('www.', ''))) {
              nameMatchesDomain = false
            }
          } catch (e) {
            nameMatchesDomain = false
          }
          return hasGenericDescription || hasDefaultAvatar || !nameMatchesDomain
        })

        if (linksToUpdate.length === 0) {
          setLoading(false)
          return
        }

        const batchSize = 5
        for (let i = 0; i < linksToUpdate.length; i += batchSize) {
          const batch = linksToUpdate.slice(i, i + batchSize)
          await Promise.all(
            batch.map(async (link: FriendLink) => {
              setFetchingUrls(prev => new Set(prev).add(link.id))
              try {
                const metadata = await fetchWebsiteMetadata(link.url)

                // 更新函数
                const updateLinkList = (prevLinks: FriendLink[]) => {
                  const newLinks = [...prevLinks]
                  const linkIndex = newLinks.findIndex(l => l.id === link.id)
                  if (linkIndex !== -1) {
                    newLinks[linkIndex] = {
                      ...newLinks[linkIndex],
                      description: !newLinks[linkIndex].description || newLinks[linkIndex].description === '暂无描述' || newLinks[linkIndex].description === ''
                        ? metadata.description
                        : newLinks[linkIndex].description,
                      avatar: !newLinks[linkIndex].avatar || newLinks[linkIndex].avatar === ASSETS.DEFAULT_AVATAR || newLinks[linkIndex].avatar === ''
                        ? metadata.avatar
                        : newLinks[linkIndex].avatar,
                      name: newLinks[linkIndex].name || metadata.title
                    }
                  }
                  return newLinks
                }

                // 根据类型更新对应状态
                if (link.type === 'friend') setFriendLinks(prev => updateLinkList(prev))
                if (link.type === 'tool') setToolLinks(prev => updateLinkList(prev))
                if (link.type === 'blog') setBlogLinks(prev => updateLinkList(prev))
                if (link.type === 'resource') setResourceLinks(prev => updateLinkList(prev))

              } catch (error) {
                console.error(`Error fetching metadata for ${link.url}:`, error)
              } finally {
                setFetchingUrls(prev => {
                  const newSet = new Set(prev)
                  newSet.delete(link.id)
                  return newSet
                })
              }
            })
          )
        }
      } catch (error) {
        console.error('Error in fetchAllData:', error)
        setApiError('获取链接信息失败，请稍后重试')
      } finally {
        setLoading(false)
      }
    }

    fetchAllData()
  }, [])

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <BgOverlay />
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 pb-16 page-transition">
        {/* 野兽派标题 */}
        <BrutalistTitle onApply={() => { setModalDefaultTab('copy'); setApplyModalOpen(true) }} />

        {/* 友链模态框 */}
        <ApplyModal
          isOpen={applyModalOpen}
          onClose={() => setApplyModalOpen(false)}
          defaultTab={modalDefaultTab}
        />
        
        {/* 错误提示 */}
        {apiError && (
          <div className="mb-6 border-2 border-[rgb(var(--destructive))] bg-[rgb(var(--destructive))]/10 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-[rgb(var(--destructive))] mt-0.5 shrink-0" />
            <p className="text-sm font-bold uppercase">{apiError}</p>
          </div>
        )}

        {loading ? (
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="relative">
              <div
                className="absolute inset-0 bg-[rgb(var(--primary))]"
                style={{ transform: 'translate(8px, 8px)' }}
              />
              <div className="relative bg-[rgb(var(--bg))] border-2 border-[rgb(var(--text))] p-8">
                <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-[rgb(var(--primary))]" />
                <p className="text-sm font-bold tracking-wider">加载中...</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 友链滚动区域 */}
            {friendLinks.length > 0 ? (
              <section className="relative">
                {/* 野兽派画廊 */}
                <div className="border-2 border-[rgb(var(--border))] bg-[rgb(var(--card))]">
                  <BrutalistGallery links={friendLinks} fetchingUrls={fetchingUrls} />
                </div>
              </section>
            ) : (
              <div className="relative py-16">
                <div
                  className="absolute inset-0 bg-[rgb(var(--muted))]"
                  style={{ transform: 'translate(6px, 6px)' }}
                />
                <div className="relative bg-[rgb(var(--bg))] border-2 border-[rgb(var(--text))] p-12 text-center">
                  <div className="text-6xl mb-4">◯</div>
                  <p className="text-lg font-bold tracking-wider">暂无友链</p>
                </div>
              </div>
            )}

            {/* ========== 工具区域 ========== */}
            {toolLinks.length > 0 && (
              <section className="border-2 border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
                <SectionTitle title="工具" count={toolLinks.length} icon="⚡" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {toolLinks.map((link, index) => (
                    <BrutalistToolCard
                      key={link.id}
                      link={link}
                      fetchingUrls={fetchingUrls}
                      index={index}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ========== 博客 & 资源 并排布局 ========== */}
            {(blogLinks.length > 0 || resourceLinks.length > 0) && (
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 博客区域 */}
                {blogLinks.length > 0 && (
                  <div className="border-2 border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
                    <SectionTitle title="博客" count={blogLinks.length} icon="◈" />
                    <div className="space-y-0">
                      {blogLinks.map((link, index) => (
                        <BrutalistBlogItem
                          key={link.id}
                          link={link}
                          fetchingUrls={fetchingUrls}
                          index={index}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 资源区域 */}
                {resourceLinks.length > 0 && (
                  <div className="border-2 border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
                    <SectionTitle title="资源" count={resourceLinks.length} icon="◉" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {resourceLinks.map((link, index) => (
                        <BrutalistResourceCard
                          key={link.id}
                          link={link}
                          fetchingUrls={fetchingUrls}
                          index={index}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* 底部装饰 */}
            <div className="flex items-center justify-center gap-4 pt-8">
              <div className="h-px flex-1 bg-[rgb(var(--border))]" />
              <div className="flex gap-2">
                <div className="w-3 h-3 bg-[rgb(var(--primary))] rotate-45" />
                <div className="w-3 h-3 border-2 border-[rgb(var(--primary))] rotate-45" />
                <div className="w-3 h-3 bg-[rgb(var(--primary))] rotate-45" />
              </div>
              <div className="h-px flex-1 bg-[rgb(var(--border))]" />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
