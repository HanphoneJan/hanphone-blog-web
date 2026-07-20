import { existsSync, readFileSync } from 'node:fs';

export interface McpConfig {
  baseUrl: string;
  internalApiKey: string;
  port: number;
  authorId?: number;
  authorNickname: string;
  verifyCacheTtlMs: number;
}

function loadEnvFile(): void {
  if (typeof process.loadEnvFile === 'function') {
    try {
      process.loadEnvFile();
      return;
    } catch {
      // .env 不存在时退回手动解析
    }
  }
  if (!existsSync('.env')) return;
  for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2];
    }
  }
}

export function loadConfig(): McpConfig {
  loadEnvFile();

  const baseUrl = (process.env.BLOG_API_BASE_URL || 'https://hanphone.cn/api').replace(/\/+$/, '');

  const internalApiKey = process.env.INTERNAL_API_KEY?.trim() || '';
  if (!internalApiKey) {
    throw new Error(
      '缺少必需的环境变量 INTERNAL_API_KEY。MCP server 必须通过它向后端校验 Agent 提交的 MCP 密钥，请配置后重启。',
    );
  }

  const portRaw = process.env.MCP_PORT?.trim();
  const port = portRaw ? Number.parseInt(portRaw, 10) : 4002;
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`MCP_PORT 非法：${portRaw}`);
  }

  const authorIdRaw = process.env.MCP_AUTHOR_ID?.trim();
  const authorId = authorIdRaw ? Number.parseInt(authorIdRaw, 10) : undefined;
  if (authorIdRaw && !Number.isInteger(authorId)) {
    throw new Error(`MCP_AUTHOR_ID 非法：${authorIdRaw}`);
  }

  const cacheTtlRaw = process.env.MCP_VERIFY_CACHE_TTL_MS?.trim();
  const verifyCacheTtlMs = cacheTtlRaw ? Number.parseInt(cacheTtlRaw, 10) : 60_000;

  return {
    baseUrl,
    internalApiKey,
    port,
    authorId,
    authorNickname: process.env.MCP_AUTHOR_NICKNAME?.trim() || '博主',
    verifyCacheTtlMs,
  };
}
