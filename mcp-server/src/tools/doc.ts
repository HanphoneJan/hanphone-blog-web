import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { BlogApiClient } from '../client.js';
import { fail, ok } from './util.js';

const docFieldSchema = {
  docId: z.string().min(1).max(64).describe('文档唯一标识（字符串，如 "spring-boot-guide"）'),
  title: z.string().min(1).describe('文档标题'),
  description: z.string().max(512).optional().describe('文档描述'),
  filename: z.string().optional().describe('存储文件名'),
  fileType: z.string().max(20).optional().describe('文件类型，如 md、pdf'),
  docNamespace: z.string().optional().describe('存储命名空间，默认 "blog/docs"'),
  recommend: z.boolean().optional().describe('是否推荐'),
  published: z.boolean().optional().describe('是否发布'),
};

export function registerDocTools(server: McpServer, client: BlogApiClient): void {
  server.registerTool(
    'list_docs',
    {
      title: '列出全部文档',
      description: '管理视角的文档列表（含未发布）。需要内部密钥。',
      inputSchema: {},
    },
    async () => {
      try {
        return ok(await client.request('/internal/mcp/docs', { internal: true }));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'get_doc',
    {
      title: '获取文档详情',
      description: '按字符串 docId（非数字主键）获取文档详情。无需内部密钥。',
      inputSchema: {
        docId: z.string().describe('文档唯一标识（字符串）'),
      },
    },
    async ({ docId }) => {
      try {
        return ok(await client.request(`/docs/${encodeURIComponent(docId)}`));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'create_doc',
    {
      title: '创建文档',
      description: '创建一条文档记录（需要内部密钥）。默认未发布，发布请传 published=true 或调用 set_doc_published。',
      inputSchema: docFieldSchema,
    },
    async (args) => {
      try {
        const doc: Record<string, unknown> = { docId: args.docId, title: args.title };
        if (args.description !== undefined) doc.description = args.description;
        if (args.filename !== undefined) doc.filename = args.filename;
        if (args.fileType !== undefined) doc.fileType = args.fileType;
        if (args.docNamespace !== undefined) doc.docNamespace = args.docNamespace;
        if (args.recommend !== undefined) doc.recommend = args.recommend;
        if (args.published !== undefined) doc.published = args.published;

        await client.request('/internal/mcp/doc', { method: 'POST', body: { doc }, internal: true });
        return ok({ success: true, message: '文档创建成功' });
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'update_doc',
    {
      title: '更新文档',
      description: '更新已有文档（需要内部密钥）。只需传要修改的字段，未传的字段保持不变。注意 id 是数字主键，不是字符串 docId。',
      inputSchema: {
        id: z.number().int().describe('文档数字主键 ID'),
        ...docFieldSchema,
      },
    },
    async ({ id, ...fields }) => {
      try {
        const doc: Record<string, unknown> = { id, docId: fields.docId, title: fields.title };
        if (doc.docId === undefined) delete doc.docId;
        if (doc.title === undefined) delete doc.title;
        if (fields.description !== undefined) doc.description = fields.description;
        if (fields.filename !== undefined) doc.filename = fields.filename;
        if (fields.fileType !== undefined) doc.fileType = fields.fileType;
        if (fields.docNamespace !== undefined) doc.docNamespace = fields.docNamespace;
        if (fields.recommend !== undefined) doc.recommend = fields.recommend;
        if (fields.published !== undefined) doc.published = fields.published;

        await client.request('/internal/mcp/doc', { method: 'POST', body: { doc }, internal: true });
        return ok({ success: true, message: `文档 ${id} 更新成功` });
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'delete_doc',
    {
      title: '删除文档',
      description: '按数字主键 ID 永久删除文档（需要内部密钥，不可恢复）。',
      inputSchema: {
        id: z.number().int().describe('文档数字主键 ID'),
      },
    },
    async ({ id }) => {
      try {
        await client.request(`/internal/mcp/doc/${id}`, { method: 'DELETE', internal: true });
        return ok({ success: true, message: `文档 ${id} 已删除` });
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'set_doc_recommend',
    {
      title: '设置文档推荐状态',
      description: '开关文档的推荐位（需要内部密钥）。',
      inputSchema: {
        id: z.number().int().describe('文档数字主键 ID'),
        recommend: z.boolean().describe('true 设为推荐，false 取消推荐'),
      },
    },
    async ({ id, recommend }) => {
      try {
        await client.request('/internal/mcp/docs/recommend', {
          method: 'POST',
          body: { docId: id, recommend },
          internal: true,
        });
        return ok({ success: true, message: `文档 ${id} 推荐状态已设为 ${recommend}` });
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'set_doc_published',
    {
      title: '设置文档发布状态',
      description: '发布/下架一篇文档（需要内部密钥）。',
      inputSchema: {
        id: z.number().int().describe('文档数字主键 ID'),
        published: z.boolean().describe('true 发布，false 下架'),
      },
    },
    async ({ id, published }) => {
      try {
        await client.request('/internal/mcp/docs/published', {
          method: 'POST',
          body: { docId: id, published },
          internal: true,
        });
        return ok({ success: true, message: `文档 ${id} 发布状态已设为 ${published}` });
      } catch (err) {
        return fail(err);
      }
    },
  );
}
