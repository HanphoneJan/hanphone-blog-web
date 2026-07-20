import { existsSync, readFileSync } from 'node:fs';

export interface McpConfig {
  baseUrl: string;
  internalApiKey?: string;
  mcpApiKey: string;
  port: number;
  authorId?: number;
  authorNickname: string;
}

function loadEnvFile(): void {
  if (typeof process.loadEnvFile === 'function') {
    try {
      process.loadEnvFile();
      return;
    } catch {
      // .env 不存在时退回手动解析（可能仍无文件，下面会静默跳过）
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

  const mcpApiKey = process.env.MCP_API_KEY?.trim();
  if (!mcpApiKey) {
    throw new Error('缺少必需的环境变量 MCP_API_KEY（外部 Agent 访问 /mcp 的 Bearer 密钥）');
  }

  const internalApiKey = process.env.INTERNAL_API_KEY?.trim() || undefined;

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

  return {
    baseUrl,
    internalApiKey,
    mcpApiKey,
    port,
    authorId,
    authorNickname: process.env.MCP_AUTHOR_NICKNAME?.trim() || '博主',
  };
}
