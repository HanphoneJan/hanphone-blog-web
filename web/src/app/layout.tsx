import type { Metadata, Viewport } from 'next'
import '@fontsource/noto-serif-sc/400.css'
import '@fontsource/noto-serif-sc/500.css'
import '@fontsource/noto-serif-sc/700.css'
import { UserProvider } from '@/contexts/UserContext'
import { ThemeProvider } from '@/contexts/ThemeProvider'
import './globals.css'
import { SITE_CONFIG, SITE_URL } from '@/lib/seo-config'

import { IMAGE } from '@/lib/constants'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_CONFIG.name,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: SITE_CONFIG.name
  },
  title: {
    default: `云林有风 | 寒枫的博客`,
    template: `%s`,
  },
  description: SITE_CONFIG.description,
  keywords: [...SITE_CONFIG.keywords],
  authors: [{ name: SITE_CONFIG.author.name, url: SITE_URL }],
  creator: SITE_CONFIG.author.name,
  publisher: SITE_CONFIG.author.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: SITE_CONFIG.locale,
    url: SITE_URL,
    siteName: SITE_CONFIG.name,
    title: `${SITE_CONFIG.name} - Hanphone's Blog`,
    description: SITE_CONFIG.description,
    images: [
      {
        url: `${SITE_URL}${SITE_CONFIG.images.ogImage}`,
        width: IMAGE.OG_IMAGE_WIDTH,
        height: IMAGE.OG_IMAGE_HEIGHT,
        alt: SITE_CONFIG.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_CONFIG.name} - Hanphone's Blog`,
    description: SITE_CONFIG.description,
    images: [`${SITE_URL}${SITE_CONFIG.images.ogImage}`],
    creator: SITE_CONFIG.social.twitter,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
    types: {
      'application/rss+xml': `${SITE_URL}/rss.xml`,
    },
  },
  bookmarks: [SITE_URL],
  category: SITE_CONFIG.category,
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  themeColor: '#f8fafc'
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const theme = 'light'
  const isDark = false
  const backgroundImageUrl = '/background.webp'
  
  return (
    <html lang={SITE_CONFIG.language} className={isDark ? 'dark' : ''}>
      <head>
        <link 
          rel="preload" 
          href={backgroundImageUrl} 
          as="image" 
        />
        <link
          rel="alternate"
          type="application/rss+xml"
          title={`${SITE_CONFIG.name} - RSS Feed`}
          href={`${SITE_URL}/rss.xml`}
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
