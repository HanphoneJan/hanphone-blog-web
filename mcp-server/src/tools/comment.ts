import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { BlogApiClient } from '../client.js';
import { fail, ok } from './util.js';

export function registerCommentTools(server: McpServer, client: BlogApiClient): void {
  server.registerTool(
    'get_comments',
    {
      title: '获取文章评论',
      description: '获取指定文章的评论列表（含昵称、内容、时间）。无需内部密钥。',
      inputSchema: {
        blogId: z.number().int().describe('文章 ID'),
      },
    },
    async ({ blogId }) => {
      try {
        return ok(await client.request(`/comments/${blogId}`));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'list_all_comments',
    {
      title: '列出全站评论',
      description: '管理视角的全站评论分页列表（按时间倒序）。页码 page 从 1 开始；不传分页参数则返回全部。需要内部密钥。',
      inputSchema: {
        page: z.number().int().min(1).optional().describe('页码，从 1 开始'),
        pageSize: z.number().int().min(1).max(100).optional().describe('每页数量'),
      },
    },
    async ({ page, pageSize }) => {
      try {
        return ok(await client.request('/internal/mcp/comments', { internal: true, params: { page, pageSize } }));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'create_comment',
    {
      title: '发表评论',
      description:
        '在指定文章下发表评论。若配置了 MCP_AUTHOR_ID 则以该用户身份发表（管理员身份标识）；否则按游客身份发表，必须提供 nickname 和 email。parentId 用于回复某条评论。无需内部密钥。',
      inputSchema: {
        blogId: z.number().int().describe('文章 ID'),
        content: z.string().min(1).describe('评论内容'),
        parentId: z.number().int().optional().describe('要回复的评论 ID；不传则为顶级评论'),
        nickname: z.string().optional().describe('游客昵称（未配置 MCP_AUTHOR_ID 时必填）'),
        email: z.string().optional().describe('游客邮箱（未配置 MCP_AUTHOR_ID 时必填）'),
      },
    },
    async ({ blogId, content, parentId, nickname, email }) => {
      try {
        const body: Record<string, unknown> = { blogId, content };
        if (parentId !== undefined) body.parentId = parentId;
        if (client.authorId !== undefined) {
          body.userId = client.authorId;
        } else {
          if (!nickname || !email) throw new Error('未配置 MCP_AUTHOR_ID 时，nickname 和 email 必填');
          body.nickname = nickname;
          body.email = email;
        }
        const data = await client.request('/comments', { method: 'POST', body });
        return ok({ success: true, message: '评论发表成功', comment: data });
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'delete_comment',
    {
      title: '删除评论',
      description: '按 ID 删除一条评论（需要内部密钥）。',
      inputSchema: {
        id: z.number().int().describe('评论 ID'),
      },
    },
    async ({ id }) => {
      try {
        await client.request(`/internal/mcp/comments/${id}`, { method: 'DELETE', internal: true });
        return ok({ success: true, message: `评论 ${id} 已删除` });
      } catch (err) {
        return fail(err);
      }
    },
  );
}
