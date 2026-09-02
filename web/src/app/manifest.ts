import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '寒枫的博客',
    short_name: '寒枫博客',
    description: '欢迎来到寒枫的博客，这里是我的个人网站，分享我的技术文章和生活点滴。',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    theme_color: '#f8fafc',
    background_color: '#ffffff',
    categories: ['blog', 'social'],
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-maskable-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ]
  }
}
