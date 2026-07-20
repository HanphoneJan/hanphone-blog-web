import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { BlogApiClient } from '../client.js';
import { fail, ok } from './util.js';

const essayFileUrlSchema = z.object({
  url: z.string().describe('文件/图片 URL'),
  urlType: z.string().describe('类型，如 image、video、file'),
  urlDesc: z.string().optional().describe('描述'),
});

export function registerEssayTools(server: McpServer, client: BlogApiClient): void {
  server.registerTool(
    'list_essays',
    {
      title: '列出全部随笔',
      description: '管理视角的随笔列表（含未发布草稿），按时间倒序。页码 page 从 1 开始；不传分页参数则返回全部。需要内部密钥。',
      inputSchema: {
        page: z.number().int().min(1).optional().describe('页码，从 1 开始'),
        pageSize: z.number().int().min(1).max(100).optional().describe('每页数量'),
      },
    },
    async ({ page, pageSize }) => {
      try {
        return ok(await client.request('/internal/mcp/essays', { internal: true, params: { page, pageSize } }));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'get_essay',
    {
      title: '获取随笔详情',
      description: '按 ID 获取随笔完整详情（含正文和附件列表）。无需内部密钥。',
      inputSchema: {
        id: z.number().int().describe('随笔 ID'),
      },
    },
    async ({ id }) => {
      try {
        return ok(await client.request(`/essays/${id}`));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'search_essays',
    {
      title: '搜索随笔',
      description: '按关键词搜索已发布随笔。页码 page 从 0 开始。无需内部密钥。',
      inputSchema: {
        query: z.string().min(1).describe('搜索关键词'),
        page: z.number().int().min(0).default(0).describe('页码，从 0 开始'),
        size: z.number().int().min(1).max(50).default(8).describe('每页数量'),
      },
    },
    async ({ query, page, size }) => {
      try {
        return ok(await client.request('/essays/search', { params: { query, page, size } }));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'get_essay_comments',
    {
      title: '获取随笔评论',
      description: '获取指定随笔的评论列表。无需内部密钥。',
      inputSchema: {
        id: z.number().int().describe('随笔 ID'),
      },
    },
    async ({ id }) => {
      try {
        return ok(await client.request(`/essays/${id}/comments`));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'create_essay',
    {
      title: '创建随笔',
      description:
        '创建一篇新随笔（需要内部密钥和 MCP_AUTHOR_ID 配置）。新随笔默认未发布（published=false），发布请调用 set_essay_published。可附带图片/文件附件。',
      inputSchema: {
        title: z.string().min(1).describe('随笔标题'),
        content: z.string().min(1).describe('随笔正文'),
        essayFileUrls: z.array(essayFileUrlSchema).optional().describe('附件列表（图片/文件）'),
      },
    },
    async ({ title, content, essayFileUrls }) => {
      try {
        if (client.authorId === undefined) {
          throw new Error('创建随笔需要配置 MCP_AUTHOR_ID（作者用户 ID）');
        }
        const essay: Record<string, unknown> = { title, content, user_id: client.authorId };
        if (essayFileUrls !== undefined) essay.essayFileUrls = essayFileUrls;
        const data = await client.request('/internal/mcp/essay', { method: 'POST', body: { essay }, internal: true });
        return ok({ success: true, message: '随笔创建成功（默认为未发布状态）', essay: data });
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'update_essay',
    {
      title: '更新随笔',
      description:
        '更新已有随笔（需要内部密钥）。注意：后端仅支持修改标题、正文和附件（附件为全量替换）；推荐/发布状态请用 set_essay_recommend / set_essay_published。',
      inputSchema: {
        id: z.number().int().describe('随笔 ID'),
        title: z.string().min(1).optional().describe('新标题'),
        content: z.string().min(1).optional().describe('新正文'),
        essayFileUrls: z.array(essayFileUrlSchema).optional().describe('附件列表（全量替换）'),
      },
    },
    async ({ id, title, content, essayFileUrls }) => {
      try {
        if (client.authorId === undefined) {
          throw new Error('更新随笔需要配置 MCP_AUTHOR_ID（作者用户 ID）');
        }
        const essay: Record<string, unknown> = { id, user_id: client.authorId };
        if (title !== undefined) essay.title = title;
        if (content !== undefined) essay.content = content;
        if (essayFileUrls !== undefined) essay.essayFileUrls = essayFileUrls;
        const data = await client.request('/internal/mcp/essay', { method: 'POST', body: { essay }, internal: true });
        return ok({ success: true, message: `随笔 ${id} 更新成功`, essay: data });
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'delete_essay',
    {
      title: '删除随笔',
      description: '按 ID 永久删除随笔（需要内部密钥，不可恢复）。',
      inputSchema: {
        id: z.number().int().describe('随笔 ID'),
      },
    },
    async ({ id }) => {
      try {
        await client.request(`/internal/mcp/essay/${id}`, { method: 'DELETE', internal: true });
        return ok({ success: true, message: `随笔 ${id} 已删除` });
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'set_essay_recommend',
    {
      title: '设置随笔推荐状态',
      description: '开关随笔的推荐位（需要内部密钥）。',
      inputSchema: {
        id: z.number().int().describe('随笔 ID'),
        recommend: z.boolean().describe('true 设为推荐，false 取消推荐'),
      },
    },
    async ({ id, recommend }) => {
      try {
        await client.request('/internal/mcp/essays/recommend', {
          method: 'POST',
          body: { essayId: id, recommend },
          internal: true,
        });
        return ok({ success: true, message: `随笔 ${id} 推荐状态已设为 ${recommend}` });
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'set_essay_published',
    {
      title: '设置随笔发布状态',
      description: '发布/下架一篇随笔（需要内部密钥）。',
      inputSchema: {
        id: z.number().int().describe('随笔 ID'),
        published: z.boolean().describe('true 发布，false 下架为草稿'),
      },
    },
    async ({ id, published }) => {
      try {
        await client.request('/internal/mcp/essays/published', {
          method: 'POST',
          body: { essayId: id, published },
          internal: true,
        });
        return ok({ success: true, message: `随笔 ${id} 发布状态已设为 ${published}` });
      } catch (err) {
        return fail(err);
      }
    },
  );
}
