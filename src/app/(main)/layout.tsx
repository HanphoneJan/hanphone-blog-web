import Header from '@/components/Header'
import Live2DWidget from '@/components/Live2DWidget'
import React from 'react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: '首页 - Hanphone\'s Blog',
    template: '%s - Hanphone\'s Blog'
  },
  description: '欢迎来到 Hanphone 的个人博客，这里分享技术文章、随笔、项目经验和学习心得。',
  keywords: '博客,技术文章,随笔,项目,学习心得,Hanphone',
  authors: [{ name: 'Hanphone' }],
  openGraph: {
    title: '首页 - Hanphone\'s Blog',
    description: '欢迎来到 Hanphone 的个人博客，这里分享技术文章、随笔、项目经验和学习心得。',
    type: 'website',
    url: 'https://hanphone.top',
    siteName: 'Hanphone\'s Blog',
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    title: '首页 - Hanphone\'s Blog',
    description: '欢迎来到 Hanphone 的个人博客，这里分享技术文章、随笔、项目经验和学习心得。',
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
    <div>
      <Header />

      {/* 使用picture标签实现WebP和JPEG的条件加载 */}
      <picture className="fixed inset-0 z-0 opacity-60 dark:opacity-30 pointer-events-none">
        {/* 优先加载WebP格式（支持的浏览器会选择这个） */}
        <source srcSet="/background.webp" type="image/webp" />

        {/* WebP不支持时回退到JPEG */}
        <img
          src="/background.jpeg"
          alt="Background"
          style={{
            objectFit: 'cover',
            width: '100vw',
            height: '100vh',
            position: 'fixed',
            top: 0,
            left: 0
          }}
        />
      </picture>

      {children}
      <Live2DWidget />
    </div>
  )
}
