#!/usr/bin/env node
import { timingSafeEqual } from 'node:crypto';
import express, { type NextFunction, type Request, type Response } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { loadConfig } from './config.js';
import { BlogApiClient } from './client.js';
import { registerAllTools } from './tools/index.js';

const config = loadConfig();
const client = new BlogApiClient(config);

function createMcpServer(): McpServer {
  const server = new McpServer({
    name: 'hanphone-blog-mcp',
    version: '0.1.0',
  });
  registerAllTools(server, client);
  return server;
}

function bearerAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.header('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const expected = Buffer.from(config.mcpApiKey);
  const actual = Buffer.from(token);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    res.status(401).json({ error: '未授权：无效或缺失 Bearer token' });
    return;
  }
  next();
}

const app = express();
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    name: 'hanphone-blog-mcp',
    version: '0.1.0',
    blogApi: config.baseUrl,
    internalKeyConfigured: client.hasInternalKey,
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
  console.log(`  MCP 端点:    http://127.0.0.1:${config.port}/mcp （Bearer MCP_API_KEY）`);
  console.log(`  健康检查:    http://127.0.0.1:${config.port}/health`);
  console.log(`  博客 API:    ${config.baseUrl}`);
  console.log(`  内部密钥:    ${client.hasInternalKey ? '已配置（写工具可用）' : '未配置（写工具不可用）'}`);
});
