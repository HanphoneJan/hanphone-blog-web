import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '访问错误 - Hanphone\'s Blog',
  description: '页面访问出现错误，请检查链接或返回首页。',
  keywords: '错误页面,404,访问错误,Hanphone',
  authors: [{ name: 'Hanphone' }],
  openGraph: {
    title: '访问错误 - Hanphone\'s Blog',
    description: '页面访问出现错误，请检查链接或返回首页。',
    type: 'website',
    url: 'https://hanphone.top/error',
    siteName: 'Hanphone\'s Blog',
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    title: '访问错误 - Hanphone\'s Blog',
    description: '页面访问出现错误，请检查链接或返回首页。',
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function ErrorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
