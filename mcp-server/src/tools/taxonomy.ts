import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { BlogApiClient } from '../client.js';
import { fail, ok } from './util.js';

export function registerTaxonomyTools(server: McpServer, client: BlogApiClient): void {
  server.registerTool(
    'list_types',
    {
      title: '列出所有分类',
      description: '获取博客全部分类（含 id、名称、封面图），创建/更新文章时用其中的 id 作为 typeId。无需内部密钥。',
      inputSchema: {},
    },
    async () => {
      try {
        return ok(await client.request('/getFullTypeList'));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'list_tags',
    {
      title: '列出所有标签',
      description: '获取博客全部标签（含 id、名称），创建/更新文章时用其中的 id 组成 tagIds。无需内部密钥。',
      inputSchema: {},
    },
    async () => {
      try {
        return ok(await client.request('/getFullTagList'));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'create_type',
    {
      title: '创建分类',
      description: '创建新的文章分类（需要内部密钥）。分类名不能重复。',
      inputSchema: {
        name: z.string().min(1).describe('分类名称'),
        picUrl: z.string().optional().describe('分类封面图 URL'),
      },
    },
    async ({ name, picUrl }) => {
      try {
        const type: Record<string, unknown> = { name };
        if (picUrl !== undefined) type.pic_url = picUrl;
        const data = await client.request('/internal/mcp/types', { method: 'POST', body: { type }, internal: true });
        return ok({ success: true, message: '分类创建成功', type: data });
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'update_type',
    {
      title: '更新分类',
      description: '更新分类名称/封面（需要内部密钥）。未传的字段保持原值。',
      inputSchema: {
        id: z.number().int().describe('分类 ID'),
        name: z.string().min(1).optional().describe('新分类名称'),
        picUrl: z.string().optional().describe('新封面图 URL'),
      },
    },
    async ({ id, name, picUrl }) => {
      try {
        const types = await client.request<Array<{ id: number; name: string; pic_url?: string }>>('/getFullTypeList');
        const existing = types.find((t) => t.id === id);
        if (!existing) throw new Error(`分类 ${id} 不存在`);

        const type: Record<string, unknown> = {
          id,
          name: name ?? existing.name,
          pic_url: picUrl ?? existing.pic_url,
        };
        const data = await client.request('/internal/mcp/types', { method: 'POST', body: { type }, internal: true });
        return ok({ success: true, message: `分类 ${id} 更新成功`, type: data });
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'delete_type',
    {
      title: '删除分类',
      description: '按 ID 删除分类（需要内部密钥）。若分类下仍有文章可能失败，建议先把文章移到其他分类。',
      inputSchema: {
        id: z.number().int().describe('分类 ID'),
      },
    },
    async ({ id }) => {
      try {
        await client.request(`/internal/mcp/types/${id}`, { method: 'DELETE', internal: true });
        return ok({ success: true, message: `分类 ${id} 已删除` });
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'create_tag',
    {
      title: '创建标签',
      description: '创建新的文章标签（需要内部密钥）。标签名不能重复。',
      inputSchema: {
        name: z.string().min(1).describe('标签名称'),
      },
    },
    async ({ name }) => {
      try {
        const data = await client.request('/internal/mcp/tags', { method: 'POST', body: { tag: { name } }, internal: true });
        return ok({ success: true, message: '标签创建成功', tag: data });
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'update_tag',
    {
      title: '重命名标签',
      description: '修改标签名称（需要内部密钥）。',
      inputSchema: {
        id: z.number().int().describe('标签 ID'),
        name: z.string().min(1).describe('新标签名称'),
      },
    },
    async ({ id, name }) => {
      try {
        const data = await client.request('/internal/mcp/tags', { method: 'POST', body: { tag: { id, name } }, internal: true });
        return ok({ success: true, message: `标签 ${id} 更新成功`, tag: data });
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'delete_tag',
    {
      title: '删除标签',
      description: '按 ID 删除标签（需要内部密钥）。',
      inputSchema: {
        id: z.number().int().describe('标签 ID'),
      },
    },
    async ({ id }) => {
      try {
        await client.request(`/internal/mcp/tags/${id}`, { method: 'DELETE', internal: true });
        return ok({ success: true, message: `标签 ${id} 已删除` });
      } catch (err) {
        return fail(err);
      }
    },
  );
}
