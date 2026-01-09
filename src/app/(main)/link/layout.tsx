import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '友链 - Hanphone\'s Blog',
  description: '与志同道合的朋友建立联系，分享优质资源和工具。',
  keywords: '友情链接,友链,资源分享,工具推荐,Hanphone',
  authors: [{ name: 'Hanphone' }],
  openGraph: {
    title: '友链 - Hanphone\'s Blog',
    description: '与志同道合的朋友建立联系，分享优质资源和工具。',
    type: 'website',
    url: 'https://hanphone.top/link',
    siteName: 'Hanphone\'s Blog',
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    title: '友链 - Hanphone\'s Blog',
    description: '与志同道合的朋友建立联系，分享优质资源和工具。',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function LinkLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
