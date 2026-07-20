import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { BlogApiClient } from '../client.js';
import { fail, ok } from './util.js';

export function registerMessageTools(server: McpServer, client: BlogApiClient): void {
  server.registerTool(
    'list_messages',
    {
      title: '列出留言',
      description: '获取留言板留言列表（按时间倒序）。页码 page 从 1 开始；不传分页参数则返回全部（上限 200 条）。无需内部密钥。',
      inputSchema: {
        page: z.number().int().min(1).optional().describe('页码，从 1 开始'),
        pageSize: z.number().int().min(1).max(100).optional().describe('每页数量'),
      },
    },
    async ({ page, pageSize }) => {
      try {
        return ok(await client.request('/messages', { params: { page, pageSize } }));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'reply_message',
    {
      title: '管理员回复留言',
      description:
        '以博主/管理员身份发表或回复留言（需要内部密钥），留言会带管理员标识。parentId 传入要回复的留言 ID。',
      inputSchema: {
        content: z.string().min(1).describe('留言内容'),
        parentId: z.number().int().optional().describe('要回复的留言 ID；不传则为顶级留言'),
        nickname: z.string().optional().describe('显示昵称，默认取 MCP_AUTHOR_NICKNAME 配置（「博主」）'),
        avatar: z.string().optional().describe('头像 URL'),
      },
    },
    async ({ content, parentId, nickname, avatar }) => {
      try {
        const message: Record<string, unknown> = {
          content,
          nickname: nickname ?? client.authorNickname,
        };
        if (parentId !== undefined) message.parentId = parentId;
        if (avatar !== undefined) message.avatar = avatar;

        const data = await client.request('/internal/mcp/messages', { method: 'POST', body: { message }, internal: true });
        return ok({ success: true, message: '留言发表成功（管理员身份）', data });
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'delete_message',
    {
      title: '删除留言',
      description: '按 ID 删除一条留言（需要内部密钥）。',
      inputSchema: {
        id: z.number().int().describe('留言 ID'),
      },
    },
    async ({ id }) => {
      try {
        await client.request(`/internal/mcp/messages/${id}`, { method: 'DELETE', internal: true });
        return ok({ success: true, message: `留言 ${id} 已删除` });
      } catch (err) {
        return fail(err);
      }
    },
  );
}
