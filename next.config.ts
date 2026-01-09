import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // output: 'export', //静态打包模式
  // distDir: 'blog3', //静态打包输出目录
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hanphone.top',
        port: '',
        pathname: '/**' // 允许该域名下所有图片
      },
      {
        protocol: 'http', // 添加http支持
        hostname: 'hanphone.top',
        port: '',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
        port: '',
        pathname: '/**' // 允许该域名下所有图片
      }
    ]
  },
  eslint: {
    // 生成期间禁用eslint
    ignoreDuringBuilds: true
  },
  experimental: {
    scrollRestoration: false
  }
}

export default nextConfig
