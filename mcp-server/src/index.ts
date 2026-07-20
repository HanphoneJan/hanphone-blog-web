#!/usr/bin/env node
import express, { type NextFunction, type Request, type Response } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { loadConfig, type McpConfig } from './config.js';
import { BlogApiClient } from './client.js';
import { registerAllTools } from './tools/index.js';

const config = loadConfig();
const client = new BlogApiClient(config);

function createMcpServer(): McpServer {
  const server = new McpServer({
    name: 'hanphone-blog-mcp',
    version: '0.2.0',
  });
  registerAllTools(server, client);
  return server;
}

interface CacheEntry {
  valid: boolean;
  expiresAt: number;
  keyName?: string;
}

const verifyCache = new Map<string, CacheEntry>();

/**
 * 校验 Bearer token 是否为一个有效的 MCP API Key。
 * 通过调用后端的 POST /internal/mcp/verify-key（X-Internal-Key 保护）校验。
 * 命中缓存（ttl 由 MCP_VERIFY_CACHE_TTL_MS 控制，默认 60s）直接放行，避免每次请求都打后端。
 */
async function verifyBearerToken(req: Request): Promise<{ valid: boolean; keyName?: string }> {
  const auth = req.header('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) return { valid: false };

  const cached = verifyCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    return { valid: cached.valid, keyName: cached.keyName };
  }

  try {
    const url = new URL(`${config.baseUrl}/internal/mcp/verify-key`);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Key': config.internalApiKey,
      },
      body: JSON.stringify({ key: token }),
    });
    if (!res.ok) {
      return { valid: false };
    }
    const json = (await res.json()) as {
      flag?: boolean;
      code?: number;
      data?: { valid?: boolean; keyName?: string };
    };
    const valid = Boolean(json.data?.valid);
    verifyCache.set(token, {
      valid,
      expiresAt: Date.now() + config.verifyCacheTtlMs,
      keyName: json.data?.keyName,
    });
    // 简单 LRU：限制缓存规模
    if (verifyCache.size > 10_000) {
      const first = verifyCache.keys().next().value;
      if (first !== undefined) verifyCache.delete(first);
    }
    return { valid, keyName: json.data?.keyName };
  } catch (err) {
    console.error('MCP 密钥校验失败：', err);
    return { valid: false };
  }
}

async function bearerAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const result = await verifyBearerToken(req);
  if (!result.valid) {
    res.status(401).json({ error: '未授权：无效或缺失 MCP API Key（Bearer token）' });
    return;
  }
  (req as Request & { mcpKeyName?: string }).mcpKeyName = result.keyName;
  next();
}

const app = express();
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    name: 'hanphone-blog-mcp',
    version: '0.2.0',
    blogApi: config.baseUrl,
    internalKeyConfigured: Boolean(config.internalApiKey),
  });
});

app.post('/mcp', bearerAuth, async (req: Request, res: Response) => {
  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on('close', () => {
    void transport.close();
    void server.close();
  });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error('处理 MCP 请求失败：', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'MCP 服务器内部错误' });
    }
  }
});

const methodNotAllowed = (_req: Request, res: Response) => {
  res.status(405).json({ error: '本服务为无状态模式，仅支持 POST' });
};
app.get('/mcp', methodNotAllowed);
app.delete('/mcp', methodNotAllowed);

app.listen(config.port, () => {
  console.log(`hanphone-blog-mcp 已启动`);
  console.log(`  MCP 端点:    http://127.0.0.1:${config.port}/mcp （Bearer MCP API Key）`);
  console.log(`  健康检查:    http://127.0.0.1:${config.port}/health`);
  console.log(`  博客 API:    ${config.baseUrl}`);
  console.log(`  密钥来源:    后端数据库（由 /admin/personal 页面管理）`);
  console.log(`  校验缓存:    TTL ${config.verifyCacheTtlMs}ms`);
});
