import Header from '@/components/Header'
import BackgroundImage from '@/components/BackgroundImage'
import Live2DWidget from '@/components/Live2DWidget'
import FloatingChat from '@/components/FloatingChat'
import { WebsiteJsonLd, PersonJsonLd } from '@/components/JsonLd'
import { Metadata } from 'next'
import { SITE_CONFIG, SITE_URL } from '@/lib/seo-config'
import { PageTransition } from '@/components/shared/PageTransition'
import { LoadingBar } from '@/components/shared/LoadingBar'
import { ScrollReset } from './components/ScrollReset'

export const metadata: Metadata = {
  description: SITE_CONFIG.description,
  keywords: [...SITE_CONFIG.keywords],
  authors: [{ name: SITE_CONFIG.author.name }],
  openGraph: {
    title: `云林有风 | 寒枫的博客`,
    description: SITE_CONFIG.description,
    type: 'website',
    url: SITE_URL,
    siteName: SITE_CONFIG.name,
    locale: SITE_CONFIG.locale,
  },
  twitter: {
    card: 'summary_large_image',
    title: `云林有风 | 寒枫的博客`,
    description: SITE_CONFIG.description,
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function MainLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* 结构化数据 - SEO优化 */}
      <WebsiteJsonLd />
      <PersonJsonLd />

      {/* 全局加载进度条 */}
      <LoadingBar />

      {/* 路由变化时重置滚动（popstate 后退/前进除外） */}
      <ScrollReset />

      <Header />



      <div className="main-content flex-1 flex flex-col min-h-0 pt-14">
        {/* 背景图：默认 WebP/JPEG，支持 localStorage 自定义 */}
        <BackgroundImage />
        <PageTransition>
          {children}
        </PageTransition>
      </div>
      <Live2DWidget />
      <FloatingChat />
    </div>
  )
}
