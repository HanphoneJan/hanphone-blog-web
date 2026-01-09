import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '隐私条款 - Hanphone\'s Blog',
  description: '了解本网站如何收集、使用、披露、保存和保护您的个人信息。',
  keywords: '隐私条款,隐私政策,数据保护,个人信息,Hanphone',
  authors: [{ name: 'Hanphone' }],
  openGraph: {
    title: '隐私条款 - Hanphone\'s Blog',
    description: '了解本网站如何收集、使用、披露、保存和保护您的个人信息。',
    type: 'website',
    url: 'https://hanphone.top/privacy',
    siteName: 'Hanphone\'s Blog',
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    title: '隐私条款 - Hanphone\'s Blog',
    description: '了解本网站如何收集、使用、披露、保存和保护您的个人信息。',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
