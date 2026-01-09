import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '留言 - Hanphone\'s Blog',
  description: '欢迎留言交流，分享你的想法和建议。',
  keywords: '留言板,留言,交流,想法分享,Hanphone',
  authors: [{ name: 'Hanphone' }],
  openGraph: {
    title: '留言 - Hanphone\'s Blog',
    description: '欢迎留言交流，分享你的想法和建议。',
    type: 'website',
    url: 'https://hanphone.top/message',
    siteName: 'Hanphone\'s Blog',
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    title: '留言 - Hanphone\'s Blog',
    description: '欢迎留言交流，分享你的想法和建议。',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function MessageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
