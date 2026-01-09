import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '用户协议 - Hanphone\'s Blog',
  description: '使用本网站前请仔细阅读用户协议，了解使用规则和注意事项。',
  keywords: '用户协议,服务条款,使用规则,注意事项,Hanphone',
  authors: [{ name: 'Hanphone' }],
  openGraph: {
    title: '用户协议 - Hanphone\'s Blog',
    description: '使用本网站前请仔细阅读用户协议，了解使用规则和注意事项。',
    type: 'website',
    url: 'https://hanphone.top/terms',
    siteName: 'Hanphone\'s Blog',
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    title: '用户协议 - Hanphone\'s Blog',
    description: '使用本网站前请仔细阅读用户协议，了解使用规则和注意事项。',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
