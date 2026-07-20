import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { BlogApiClient } from '../client.js';
import { fail, ok } from './util.js';

interface ExistingProject {
  recommend?: boolean;
  published?: boolean;
}

const projectFieldSchema = {
  title: z.string().min(1).describe('项目标题'),
  content: z.string().optional().describe('项目描述（支持 Markdown）'),
  picUrl: z.string().optional().describe('项目封面图 URL'),
  url: z.string().optional().describe('项目链接'),
  techs: z.string().optional().describe('技术栈，如 "Vue3, Spring Boot"'),
  type: z.number().int().optional().describe('项目分类（数字；0 表示不在前台展示）'),
  recommend: z.boolean().optional().describe('是否推荐'),
  published: z.boolean().optional().describe('是否发布'),
};

export function registerProjectTools(server: McpServer, client: BlogApiClient): void {
  server.registerTool(
    'list_projects',
    {
      title: '列出全部项目',
      description: '管理视角的项目列表（含未发布）。页码 page 从 1 开始；不传分页参数则返回全部。需要内部密钥。',
      inputSchema: {
        page: z.number().int().min(1).optional().describe('页码，从 1 开始'),
        pageSize: z.number().int().min(1).max(100).optional().describe('每页数量'),
      },
    },
    async ({ page, pageSize }) => {
      try {
        return ok(await client.request('/internal/mcp/projects', { internal: true, params: { page, pageSize } }));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'get_project',
    {
      title: '获取项目详情',
      description: '按 ID 获取项目详情。无需内部密钥。',
      inputSchema: {
        id: z.number().int().describe('项目 ID'),
      },
    },
    async ({ id }) => {
      try {
        return ok(await client.request(`/projects/${id}`));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'search_projects',
    {
      title: '搜索项目',
      description: '按关键词搜索已发布项目。页码 page 从 0 开始。无需内部密钥。',
      inputSchema: {
        query: z.string().min(1).describe('搜索关键词'),
        page: z.number().int().min(0).default(0).describe('页码，从 0 开始'),
        size: z.number().int().min(1).max(50).default(10).describe('每页数量'),
      },
    },
    async ({ query, page, size }) => {
      try {
        return ok(await client.request('/projects/search', { params: { query, page, size } }));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'create_project',
    {
      title: '创建项目',
      description: '创建一个新项目（需要内部密钥）。默认未发布，发布请传 published=true 或调用 set_project_published。',
      inputSchema: projectFieldSchema,
    },
    async (args) => {
      try {
        const project: Record<string, unknown> = { title: args.title };
        if (args.content !== undefined) project.content = args.content;
        if (args.picUrl !== undefined) project.pic_url = args.picUrl;
        if (args.url !== undefined) project.url = args.url;
        if (args.techs !== undefined) project.techs = args.techs;
        if (args.type !== undefined) project.type = args.type;
        project.recommend = args.recommend ?? false;
        if (args.published !== undefined) project.published = args.published;

        await client.request('/internal/mcp/project', { method: 'POST', body: { project }, internal: true });
        return ok({ success: true, message: '项目创建成功' });
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'update_project',
    {
      title: '更新项目',
      description: '更新已有项目（需要内部密钥）。只需传要修改的字段，未传的字段保持不变。',
      inputSchema: {
        id: z.number().int().describe('项目 ID'),
        ...projectFieldSchema,
      },
    },
    async ({ id, ...fields }) => {
      try {
        const existing = await client.request<ExistingProject>(`/projects/${id}`);

        const project: Record<string, unknown> = { id };
        if (fields.title !== undefined) project.title = fields.title;
        if (fields.content !== undefined) project.content = fields.content;
        if (fields.picUrl !== undefined) project.pic_url = fields.picUrl;
        if (fields.url !== undefined) project.url = fields.url;
        if (fields.techs !== undefined) project.techs = fields.techs;
        if (fields.type !== undefined) project.type = fields.type;
        project.recommend = fields.recommend ?? existing.recommend ?? false;
        if (fields.published !== undefined) project.published = fields.published;

        await client.request('/internal/mcp/project', { method: 'POST', body: { project }, internal: true });
        return ok({ success: true, message: `项目 ${id} 更新成功` });
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'delete_project',
    {
      title: '删除项目',
      description: '按 ID 永久删除项目（需要内部密钥，不可恢复）。',
      inputSchema: {
        id: z.number().int().describe('项目 ID'),
      },
    },
    async ({ id }) => {
      try {
        await client.request(`/internal/mcp/project/${id}`, { method: 'DELETE', internal: true });
        return ok({ success: true, message: `项目 ${id} 已删除` });
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'set_project_recommend',
    {
      title: '设置项目推荐状态',
      description: '开关项目的推荐位（需要内部密钥）。',
      inputSchema: {
        id: z.number().int().describe('项目 ID'),
        recommend: z.boolean().describe('true 设为推荐，false 取消推荐'),
      },
    },
    async ({ id, recommend }) => {
      try {
        await client.request('/internal/mcp/projects/recommend', {
          method: 'POST',
          body: { projectId: id, recommend },
          internal: true,
        });
        return ok({ success: true, message: `项目 ${id} 推荐状态已设为 ${recommend}` });
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'set_project_published',
    {
      title: '设置项目发布状态',
      description: '发布/下架一个项目（需要内部密钥）。',
      inputSchema: {
        id: z.number().int().describe('项目 ID'),
        published: z.boolean().describe('true 发布，false 下架'),
      },
    },
    async ({ id, published }) => {
      try {
        await client.request('/internal/mcp/projects/published', {
          method: 'POST',
          body: { projectId: id, published },
          internal: true,
        });
        return ok({ success: true, message: `项目 ${id} 发布状态已设为 ${published}` });
      } catch (err) {
        return fail(err);
      }
    },
  );
}
