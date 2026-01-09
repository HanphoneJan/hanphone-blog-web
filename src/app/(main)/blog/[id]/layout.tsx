import { Suspense } from 'react'
import { Metadata } from 'next'

const API_BASE_URL = 'https://www.hanphone.top/api'

interface BlogMetadata {
  id: number
  title: string
  description?: string
  content: string
  firstPicture: string
  createTime: string
  views: number
  flag: string
  likes: number
  isLiked: boolean
  user: {
    id: number
    nickname: string
    avatar: string
  }
  tags: { id: number; name: string }[]
}

// 生成 metadata 的异步函数 - 现在可以在服务端正确获取 params.id
export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const resolvedParams = await params
  const blogId = resolvedParams.id

  try {
    const response = await fetch(`${API_BASE_URL}/blog/${blogId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 3600 }
    })

    if (!response.ok) {
      console.error(`Failed to fetch blog: HTTP ${response.status}`)
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.code === 200 && data.data) {
      const blog: BlogMetadata = data.data

      // 优先使用 description 字段，如果没有则从 content 提取摘要
      const description = blog.description ||
        blog.content
          .replace(/[#*`_\[\]]/g, '')
          .replace(/\n+/g, ' ')
          .trim()
          .substring(0, 150) + '...'

      // 生成关键词：标题 + 标签
      const keywords = [
        blog.title,
        ...blog.tags.map(tag => tag.name)
      ].join(', ')

      return {
        title: `${blog.title} - 博客`,
        description: description,
        keywords: keywords,
        openGraph: {
          title: blog.title,
          description: description,
          type: 'article',
          images: blog.firstPicture
            ? [
                {
                  url: blog.firstPicture,
                  width: 1200,
                  height: 630,
                  alt: blog.title
                }
              ]
            : undefined,
          publishedTime: new Date().toISOString(),
          authors: [blog.title]
        },
        twitter: {
          card: 'summary_large_image',
          title: blog.title,
          description: description,
          images: blog.firstPicture ? [blog.firstPicture] : undefined
        },
        alternates: {
          canonical: `/blogInfo/${blogId}`
        },
        other: {
          'article:author': blog.title,
          'article:section': '技术博客'
        },
        robots: {
          index: true,
          follow: true
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch blog metadata:', error)
  }

  // 默认 metadata（如果获取失败）
  return {
    title: '博客详情',
    description: '查看博客详情',
    robots: {
      index: false,
      follow: false
    }
  }
}

export default function BlogInfoLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div>
      <div className="min-h-screen z-1 flex flex-col bg-white dark:bg-slate-950">
        <Suspense>
          <div>{children}</div>
        </Suspense>
      </div>
    </div>
  )
}
