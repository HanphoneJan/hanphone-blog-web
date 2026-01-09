import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '关于我 - Hanphone\'s Blog',
  description: '了解更多关于 Hanphone 的信息，包括技能、作品、爱好和评价。',
  keywords: '关于我,个人介绍,技能,作品,爱好,Hanphone',
  authors: [{ name: 'Hanphone' }],
  openGraph: {
    title: '关于我 - Hanphone\'s Blog',
    description: '了解更多关于 Hanphone 的信息，包括技能、作品、爱好和评价。',
    type: 'website',
    url: 'https://hanphone.top/personal',
    siteName: 'Hanphone\'s Blog',
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    title: '关于我 - Hanphone\'s Blog',
    description: '了解更多关于 Hanphone 的信息，包括技能、作品、爱好和评价。',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function PersonalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
