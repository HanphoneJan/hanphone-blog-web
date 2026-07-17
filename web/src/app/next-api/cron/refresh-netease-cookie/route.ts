import { NextRequest, NextResponse } from 'next/server'
import { runCookieRefreshTick } from '@/lib/netease-cookie/scheduler'

export const runtime = 'nodejs'

/**
 * 外部定时任务调用端点：刷新网易云音乐 Cookie。
 *
 * 调用方式：
 *   GET /next-api/cron/refresh-netease-cookie/
 *
 * 注意：项目开启了 trailingSlash，URL 必须带尾斜杠；
 * 否则 Next.js 会返回 308 重定向，未跟随重定向的客户端（如未加 -L 的 curl）
 * 将静默失败。建议 cron 命令：
 *   curl -sSL -H "x-internal-key: $INTERNAL_API_KEY" \
 *     http://127.0.0.1:3000/next-api/cron/refresh-netease-cookie/
 *
 * 安全验证：
 *   - 通过 X-Internal-Key header 验证调用者身份
 *   - 密钥来自环境变量 INTERNAL_API_KEY
 *
 * 返回示例：
 *   { "success": true, "refreshed": true }
 *   { "success": true, "skipped": true, "reason": "Cookie 尚未到期" }
 *   { "success": false, "error": "..." }
 */
export async function GET(request: NextRequest) {
  const internalKey = request.headers.get('x-internal-key')
  const expectedKey = process.env.INTERNAL_API_KEY

  if (!expectedKey) {
    return NextResponse.json(
      { success: false, error: '服务未配置 INTERNAL_API_KEY' },
      { status: 500 }
    )
  }

  if (internalKey !== expectedKey) {
    return NextResponse.json(
      { success: false, error: '未授权' },
      { status: 401 }
    )
  }

  const result = await runCookieRefreshTick()

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    refreshed: result.refreshed ?? false,
    skipped: result.skipped ?? false,
    ...(result.error && { reason: result.error }),
  })
}
