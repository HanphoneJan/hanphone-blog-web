import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '随笔 - Hanphone\'s Blog',
  description: '记录生活中的点滴，分享学习过程中的感悟和思考。',
  keywords: '随笔,生活记录,学习感悟,思考,Hanphone',
  authors: [{ name: 'Hanphone' }],
  openGraph: {
    title: '随笔 - Hanphone\'s Blog',
    description: '记录生活中的点滴，分享学习过程中的感悟和思考。',
    type: 'website',
    url: 'https://hanphone.top/essay',
    siteName: 'Hanphone\'s Blog',
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    title: '随笔 - Hanphone\'s Blog',
    description: '记录生活中的点滴，分享学习过程中的感悟和思考。',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function EssayLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
