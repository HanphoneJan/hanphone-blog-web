import { NextRequest, NextResponse } from 'next/server'

const FETCH_TIMEOUT = 5000;
const ALLOWED_PROTOCOLS = ['https:'];

// 内网IP/本地域名正则（扩展覆盖更多内网段）
const INTERNAL_REGEX = /^(127\.0\.0\.1|localhost|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+)$/;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  try {
    const urlParam = searchParams.get('url');
    const validDomain = searchParams.get('validDomain');

    // 1. 基础参数校验
    if (!urlParam || !validDomain) {
      return NextResponse.json({ error: '参数缺失' }, { status: 400 });
    }

    // 2. 解析URL（提前解析，用于后续内网IP校验）
    let urlObj: URL;
    try {
      urlObj = new URL(urlParam.startsWith('http') ? urlParam : `https://${urlParam}`);
    } catch (e) {
      return NextResponse.json({ error: 'URL格式错误'+e }, { status: 400 });
    }

    // 3. 优先：过滤内网IP/本地域名（核心优化）
    const targetHost = urlObj.hostname.replace(/^www\./, '').toLowerCase();
    if (INTERNAL_REGEX.test(targetHost)) {
      return NextResponse.json({ error: '禁止解析内网/本地地址' }, { status: 403 });
    }

    // 4. 其次：校验域名一致性
    const targetDomain = urlObj.hostname.replace(/^www\./, '').toLowerCase();
    if (targetDomain !== validDomain.toLowerCase()) {
      return NextResponse.json({ error: '仅允许解析当前友链域名' }, { status: 403 });
    }

    // 5. 最后：协议校验
    if (!ALLOWED_PROTOCOLS.includes(urlObj.protocol)) {
      return NextResponse.json({ error: '仅支持HTTPS协议' }, { status: 403 });
    }

    // 6. 发起请求（后续逻辑不变）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    const response = await fetch(urlObj.href, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      signal: controller.signal,
      redirect: 'manual'
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`);
    }

    const html = await response.text();
    const titleMatch = html.match(/<title>([\s\S]{1,200}?)<\/title>/i);
    const descMatch = html.match(/<meta name="description" content="([\s\S]{1,500}?)"/i) || html.match(/<meta property="og:description" content="([\s\S]{1,500}?)"/i);
    let favicon = '';
    const iconMatch = html.match(/<link rel="(?:icon|shortcut icon)" href="([^"]+?)"/i);
    if (iconMatch) favicon = new URL(iconMatch[1], urlObj.href).href;
    if (!favicon) favicon = `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`;

    return NextResponse.json({
      title: titleMatch ? titleMatch[1].trim() : urlObj.hostname,
      description: descMatch ? descMatch[1].trim().replace(/"/g, '') : '',
      avatar: favicon
    });
  } catch (error) {
    console.error('解析失败:', error);
    const urlParam = searchParams.get('url') || '';
    try {
      const urlObj = new URL(urlParam.startsWith('http') ? urlParam : `https://${urlParam}`);
      return NextResponse.json({
        title: urlObj.hostname,
        description: '',
        avatar: `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=128`
      }, { status: 200 });
    } catch (e) {
      return NextResponse.json({ error: '解析失败' +e}, { status: 500 });
    }
  }
}