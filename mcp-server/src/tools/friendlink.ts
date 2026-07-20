import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { BlogApiClient } from '../client.js';
import { fail, ok } from './util.js';

interface ExistingFriendLink {
  recommend?: boolean;
  published?: boolean;
}

const friendLinkFieldSchema = {
  name: z.string().min(1).describe('站点名称'),
  url: z.string().min(1).describe('站点链接'),
  type: z.string().optional().describe('友链类型/分组'),
  description: z.string().optional().describe('站点描述'),
  linkUrl: z.string().optional().describe('跳转链接（linkUrl）'),
  avatar: z.string().optional().describe('头像/Logo URL'),
  color: z.string().optional().describe('主题色'),
  siteshot: z.string().optional().describe('站点截图 URL'),
  rss: z.string().optional().describe('RSS 地址'),
  nickname: z.string().optional().describe('站长昵称'),
  recommend: z.boolean().optional().describe('是否推荐'),
  published: z.boolean().optional().describe('是否发布（审核通过）'),
};

function buildFriendLinkBody(fields: Record<string, unknown>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  const mapping: Record<string, string> = {
    name: 'name', url: 'url', type: 'type', description: 'description', linkUrl: 'linkUrl',
    avatar: 'avatar', color: 'color', siteshot: 'siteshot', rss: 'rss', nickname: 'nickname',
  };
  for (const [src, dest] of Object.entries(mapping)) {
    if (fields[src] !== undefined) body[dest] = fields[src];
  }
  return body;
}

export function registerFriendLinkTools(server: McpServer, client: BlogApiClient): void {
  server.registerTool(
    'list_friend_links',
    {
      title: '列出全部友链',
      description: '管理视角的友链列表（含未审核申请）。可用 published 过滤。需要内部密钥。',
      inputSchema: {
        published: z.boolean().optional().describe('true 只看已发布，false 只看待审核，不传返回全部'),
      },
    },
    async ({ published }) => {
      try {
        return ok(await client.request('/internal/mcp/friendLinks', { internal: true, params: { published } }));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'list_pending_friend_links',
    {
      title: '列出待审核友链申请',
      description: '获取访客提交但未审核通过的友链申请列表。需要内部密钥。',
      inputSchema: {},
    },
    async () => {
      try {
        return ok(await client.request('/internal/mcp/friendLinks', { internal: true, params: { published: false } }));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'create_friend_link',
    {
      title: '创建友链',
      description: '直接创建一条友链（需要内部密钥）。默认未发布，发布请传 published=true 或调用 set_friend_link_published。',
      inputSchema: friendLinkFieldSchema,
    },
    async (args) => {
      try {
        const friendLink = buildFriendLinkBody(args as Record<string, unknown>);
        if (args.recommend !== undefined) friendLink.recommend = args.recommend;
        if (args.published !== undefined) friendLink.published = args.published;

        await client.request('/internal/mcp/friendLink', { method: 'POST', body: { friendLink }, internal: true });
        return ok({ success: true, message: '友链创建成功' });
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'update_friend_link',
    {
      title: '更新友链',
      description: '更新已有友链（需要内部密钥）。只需传要修改的字段，未传的字段保持不变。',
      inputSchema: {
        id: z.number().int().describe('友链 ID'),
        ...friendLinkFieldSchema,
      },
    },
    async ({ id, ...fields }) => {
      try {
        const all = await client.request<Array<ExistingFriendLink & { id: number }>>('/internal/mcp/friendLinks', { internal: true });
        const existing = all.find((f) => f.id === id);
        if (!existing) throw new Error(`友链 ${id} 不存在`);

        const friendLink = buildFriendLinkBody(fields as Record<string, unknown>);
        friendLink.id = id;
        friendLink.recommend = fields.recommend ?? existing.recommend ?? false;
        if (fields.published !== undefined) friendLink.published = fields.published;

        await client.request('/internal/mcp/friendLink', { method: 'POST', body: { friendLink }, internal: true });
        return ok({ success: true, message: `友链 ${id} 更新成功` });
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'delete_friend_link',
    {
      title: '删除友链',
      description: '按 ID 删除友链（需要内部密钥）。',
      inputSchema: {
        id: z.number().int().describe('友链 ID'),
      },
    },
    async ({ id }) => {
      try {
        await client.request(`/internal/mcp/friendLink/${id}`, { method: 'DELETE', internal: true });
        return ok({ success: true, message: `友链 ${id} 已删除` });
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'set_friend_link_published',
    {
      title: '审核友链',
      description: '审核通过/驳回一条友链申请（需要内部密钥）。published=true 即审核通过并展示。',
      inputSchema: {
        id: z.number().int().describe('友链 ID'),
        published: z.boolean().describe('true 审核通过，false 下架/驳回'),
      },
    },
    async ({ id, published }) => {
      try {
        await client.request('/internal/mcp/friendLinks/published', {
          method: 'POST',
          body: { friendLinkId: id, published },
          internal: true,
        });
        return ok({ success: true, message: `友链 ${id} 发布状态已设为 ${published}` });
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'set_friend_link_recommend',
    {
      title: '设置友链推荐状态',
      description: '开关友链的推荐位（需要内部密钥）。',
      inputSchema: {
        id: z.number().int().describe('友链 ID'),
        recommend: z.boolean().describe('true 设为推荐，false 取消推荐'),
      },
    },
    async ({ id, recommend }) => {
      try {
        await client.request('/internal/mcp/friendLinks/recommend', {
          method: 'POST',
          body: { friendLinkId: id, recommend },
          internal: true,
        });
        return ok({ success: true, message: `友链 ${id} 推荐状态已设为 ${recommend}` });
      } catch (err) {
        return fail(err);
      }
    },
  );
}
