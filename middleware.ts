import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 1. 从Cookie获取主题设置（服务器端可访问）
  const themeCookie = request.cookies.get('theme')?.value
  const isDark = themeCookie === 'dark'

  // 2. 获取系统主题偏好（仅服务器端模拟，实际以客户端为准）
  const userAgent = request.headers.get('user-agent') || ''
  const prefersDark = userAgent.includes('Dark Mode') // 简化判断

  // 3. 决定最终主题（Cookie优先，否则使用系统偏好）
  const shouldBeDark = themeCookie ? isDark : prefersDark

  // 4. 克隆响应并添加主题类名到HTML
  const response = NextResponse.next()
  response.headers.set('x-theme', shouldBeDark ? 'dark' : 'light')

  return response
}

// 应用于所有路由
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
