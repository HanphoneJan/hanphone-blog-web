import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { BlogApiClient } from '../client.js';
import { fail, ok } from './util.js';

export function registerMiscTools(server: McpServer, client: BlogApiClient): void {
  server.registerTool(
    'list_person_infos',
    {
      title: '列出个人信息展示项',
      description: '获取关于页的个人展示信息（可按 category 过滤）。无需内部密钥。',
      inputSchema: {
        category: z.string().optional().describe('分类过滤，如 skill、hobby'),
      },
    },
    async ({ category }) => {
      try {
        return ok(await client.request('/personInfos', { params: { category } }));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'save_person_info',
    {
      title: '创建/更新个人信息展示项',
      description: '新增或更新一条个人展示信息（需要内部密钥）。传 id 为更新（未传字段保持原值），不传 id 为新增。',
      inputSchema: {
        id: z.number().int().optional().describe('展示项 ID（更新时传）'),
        category: z.string().min(1).describe('分类，如 skill、hobby'),
        name: z.string().min(1).describe('名称'),
        description: z.string().optional().describe('描述'),
        picUrl: z.string().optional().describe('图片 URL'),
        url: z.string().optional().describe('链接'),
        iconSrc: z.string().optional().describe('图标 URL'),
        rank: z.number().int().optional().describe('排序值，越小越靠前'),
      },
    },
    async ({ id, category, name, description, picUrl, url, iconSrc, rank }) => {
      try {
        const personInfo: Record<string, unknown> = { category, name };
        if (id !== undefined) personInfo.id = id;
        if (description !== undefined) personInfo.description = description;
        if (picUrl !== undefined) personInfo.pic_url = picUrl;
        if (url !== undefined) personInfo.url = url;
        if (iconSrc !== undefined) personInfo.icon_src = iconSrc;
        if (rank !== undefined) personInfo.rank = rank;

        await client.request('/internal/mcp/personInfo', { method: 'POST', body: { personInfo }, internal: true });
        return ok({ success: true, message: id === undefined ? '展示项创建成功' : `展示项 ${id} 更新成功` });
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'delete_person_info',
    {
      title: '删除个人信息展示项',
      description: '按 ID 删除一条个人展示信息（需要内部密钥）。',
      inputSchema: {
        id: z.number().int().describe('展示项 ID'),
      },
    },
    async ({ id }) => {
      try {
        await client.request(`/internal/mcp/personInfo/${id}`, { method: 'DELETE', internal: true });
        return ok({ success: true, message: `展示项 ${id} 已删除` });
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'list_users',
    {
      title: '列出用户',
      description: '获取全部注册用户列表（密码不返回）。需要内部密钥。',
      inputSchema: {},
    },
    async () => {
      try {
        return ok(await client.request('/users', { internal: true }));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'get_site_stats',
    {
      title: '获取站点统计',
      description: '获取站点公开统计（文章数、随笔数、项目数等）。无需内部密钥。',
      inputSchema: {},
    },
    async () => {
      try {
        return ok(await client.request('/site-stats'));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'get_dashboard_stats',
    {
      title: '获取仪表盘统计',
      description: '管理视角的聚合统计：文章/阅读/点赞/评论总数及按月趋势、月度访问量。需要内部密钥。',
      inputSchema: {
        year: z.string().optional().describe('访问量统计年份，如 "2026"；不传为全部'),
      },
    },
    async ({ year }) => {
      try {
        return ok(await client.request('/internal/mcp/stats/dashboard', { internal: true, params: { year } }));
      } catch (err) {
        return fail(err);
      }
    },
  );
}
