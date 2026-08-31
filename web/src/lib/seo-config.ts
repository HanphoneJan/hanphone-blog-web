import { IMAGE } from '@/lib/constants'
/**
 * SEO配置文件 - 集中管理所有SEO相关配置
 * 修改域名或SEO配置时只需修改此文件
 */

import type { Metadata } from 'next'
// 从环境变量读取站点URL，默认为本地开发地址
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const SITE_CONFIG = {
  // 网站基础信息
  name: '云林有风',
  shortName: '云林有风',
  description: '寒枫的个人博客 | Hanphone\'s Blog | 分享Agent开发、前端开发、全栈开发、机器学习等技术文章，记录项目经验、生活经历，探究AI应用，探索自我发展。',

  // 域名配置
  url: siteUrl,

  // 作者信息
  author: {
    name: '寒枫',
    alternateName: 'Hanphone',
    email: 'janhizian@qq.com',
  },

  // 社交媒体链接
  social: {
    github: 'https://github.com/hanphonejan',
    twitter: '@hanphone',
    bilibili: ''
  },

  // 图片资源
  images: {
    ogImage: '/og-image.png',
    avatar: '/avatar.png',
    favicon: '/favicon.ico',
  },

  // 地区/语言
  locale: 'zh_CN',
  language: 'zh-CN',

  // 关键词
  keywords: [
    '寒枫',
    '云林有风',
    'Hanphone',
    '个人博客',
    '技术博客',
    '前端开发',
    'React',
    'Next.js',
    'TypeScript',
    'Node.js',
    'Python',
    'Java',
    'Javascript',
    '全栈开发',
    '后端有风',
    '机器学习',
    'Web开发',
    '编程学习',
    '技术分享',
  ],

  // 站点分类
  category: 'technology',
} as const

// 导出常用快捷方式
export const SITE_URL = SITE_CONFIG.url
export const SITE_NAME = SITE_CONFIG.name

/**
 * 统一的 Metadata 创建函数
 * 所有页面的 metadata 都应通过此函数创建，确保格式统一
 *
 * @param title - 页面标题（不需要包含站点名称，会自动拼接）
 * @param description - 页面描述
 * @param options - 可选配置
 */
export interface CreateMetadataOptions {
  /** 页面关键词 */
  keywords?: string[] | string
  /** 页面路径（用于生成 canonical URL） */
  path?: string
  /** 是否使用绝对标题（不添加站点名后缀） */
  absolute?: boolean
  /** 文章类型，用于文章详情页 */
  type?: 'website' | 'article'
  /** 文章发布时间（仅 article 类型有效） */
  publishedTime?: string
  /** 文章作者（仅 article 类型有效） */
  authors?: string[]
  /** OG 图片 URL */
  ogImage?: string
  /** 是否允许搜索引擎索引 */
  noIndex?: boolean
}

export function createMetadata(
  title: string,
  description: string,
  options: CreateMetadataOptions = {}
): Metadata {
  const {
    keywords = [],
    path = '',
    absolute = false,
    type = 'website',
    publishedTime,
    authors = [SITE_CONFIG.author.name],
    ogImage = `${SITE_URL}${SITE_CONFIG.images.ogImage}`,
    noIndex = false
  } = options

  // 处理关键词
  const keywordsArray = Array.isArray(keywords) ? keywords : keywords.split(',').map(k => k.trim())
  const allKeywords = [...SITE_CONFIG.keywords, ...keywordsArray]

  // 构建完整标题
  const fullTitle = absolute ? title : `${title} | 云林有风 | 寒枫的博客`

  // 构建 URL
  const pageUrl = path ? `${SITE_URL}${path}` : SITE_URL

  // 构建 openGraph 配置
  const openGraph: Metadata['openGraph'] = {
    type,
    locale: SITE_CONFIG.locale,
    url: pageUrl,
    siteName: SITE_CONFIG.name,
    title: fullTitle,
    description,
    images: ogImage ? [{ url: ogImage, width: IMAGE.OG_IMAGE_WIDTH, height: IMAGE.OG_IMAGE_HEIGHT, alt: title }] : undefined,
  }

  // 如果是文章类型，添加文章特有属性
  if (type === 'article' && publishedTime) {
    const ogArticle = openGraph as Record<string, unknown>
    ogArticle.publishedTime = publishedTime
    ogArticle.authors = authors
  }

  return {
    title: absolute ? { absolute: fullTitle } : fullTitle,
    description,
    keywords: allKeywords,
    authors: authors.map(name => ({ name })),
    creator: SITE_CONFIG.author.name,
    publisher: SITE_CONFIG.author.name,
    openGraph,
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: ogImage ? [ogImage] : undefined,
      creator: SITE_CONFIG.social.twitter,
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
    },
    alternates: {
      canonical: pageUrl,
    },
  }
}
