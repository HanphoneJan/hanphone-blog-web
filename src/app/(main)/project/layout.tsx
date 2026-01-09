import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '项目 - Hanphone\'s Blog',
  description: '展示我的个人项目，包括完整项目、工具箱、小游戏和小练习。',
  keywords: '项目展示,个人项目,工具箱,小游戏,代码练习,Hanphone',
  authors: [{ name: 'Hanphone' }],
  openGraph: {
    title: '项目 - Hanphone\'s Blog',
    description: '展示我的个人项目，包括完整项目、工具箱、小游戏和小练习。',
    type: 'website',
    url: 'https://hanphone.top/project',
    siteName: 'Hanphone\'s Blog',
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    title: '项目 - Hanphone\'s Blog',
    description: '展示我的个人项目，包括完整项目、工具箱、小游戏和小练习。',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
