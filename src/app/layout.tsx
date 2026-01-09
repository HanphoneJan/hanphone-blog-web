import type { Metadata, Viewport } from 'next'
import { UserProvider } from '@/contexts/UserContext'
import { ThemeProvider } from '@/contexts/ThemeProvider'
import './globals.css'
import { headers } from 'next/headers'
export const metadata: Metadata = {
  title: '寒枫的博客',
  description: '寒枫的个人技术博客，分享全栈开发、ML等技术文章和生活点滴'
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0
}

// 关键：将布局改为异步组件（async）
export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  // 1. 异步获取请求头（必须用await）
  const headerList = await headers()
  const theme = headerList.get('x-theme') || 'light'
  const isDark = theme === 'dark'
  const backgroundImageUrl = "/background.webp"
  return (
    // 2. 服务器端直接渲染正确的类名
    <html lang="zh-CN" className={isDark ? 'dark' : ''}>
      <head>
          <link 
          rel="preload" 
          href={backgroundImageUrl} 
          as="image" 
        />
      </head>
      <body className="min-h-screen">
        <ThemeProvider>
          <UserProvider>
            <main>{children}</main>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
