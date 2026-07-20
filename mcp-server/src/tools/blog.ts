import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { BlogApiClient } from '../client.js';
import { fail, ok } from './util.js';

interface ExistingBlog {
  published?: boolean;
  recommend?: boolean;
  commentabled?: boolean;
  shareStatement?: boolean;
  type?: { id: number } | null;
  tags?: Array<{ id: number }>;
}

const blogFieldSchema = {
  title: z.string().min(1).max(100).describe('文章标题'),
  content: z.string().min(1).describe('文章正文（Markdown 格式）'),
  typeId: z.number().int().optional().describe('分类 ID（可用 list_types 查询）'),
  tagIds: z.array(z.number().int()).optional().describe('标签 ID 数组（可用 list_tags 查询）'),
  description: z.string().optional().describe('摘要；不传则由后端从正文自动截取生成'),
  firstPicture: z.string().optional().describe('封面图 URL；不传则使用分类默认封面'),
  flag: z.enum(['原创', '转载', '翻译']).optional().describe('文章属性，默认「原创」'),
  published: z.boolean().optional().describe('是否发布；false 为草稿（公开不可见）'),
  recommend: z.boolean().optional().describe('是否推荐到首页推荐位'),
  commentabled: z.boolean().optional().describe('是否开放评论'),
  shareStatement: z.boolean().optional().describe('是否开启转载声明'),
};

export function registerBlogTools(server: McpServer, client: BlogApiClient): void {
  server.registerTool(
    'list_blogs',
    {
      title: '分页列出已发布文章',
      description: '获取博客已发布文章的分页列表（不含正文，仅元数据：标题/摘要/封面/分类/标签/浏览量等）。页码从 1 开始。无需内部密钥。',
      inputSchema: {
        pagenum: z.number().int().min(1).default(1).describe('页码，从 1 开始'),
        pagesize: z.number().int().min(1).max(50).default(10).describe('每页数量'),
      },
    },
    async ({ pagenum, pagesize }) => {
      try {
        return ok(await client.request('/blogs', { params: { pagenum, pagesize } }));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'list_all_blogs',
    {
      title: '列出全部文章（含草稿）',
      description: '管理视角的文章分页列表，包含未发布草稿和完整正文，支持按标题/分类过滤。页码从 1 开始。需要内部密钥。',
      inputSchema: {
        pagenum: z.number().int().min(1).default(1).describe('页码，从 1 开始'),
        pagesize: z.number().int().min(1).max(50).default(10).describe('每页数量'),
        title: z.string().optional().describe('按标题模糊过滤'),
        typeId: z.number().int().optional().describe('按分类 ID 过滤'),
      },
    },
    async ({ pagenum, pagesize, title, typeId }) => {
      try {
        return ok(await client.request('/internal/mcp/blogs/list', {
          method: 'POST',
          body: { pagenum, pagesize, title, typeId },
          internal: true,
        }));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'get_blog',
    {
      title: '获取文章详情',
      description: '按 ID 获取文章完整详情，content 为 Markdown 原文。注意：每次调用会使该文章阅读量 +1。无需内部密钥。',
      inputSchema: {
        id: z.number().int().describe('文章 ID'),
      },
    },
    async ({ id }) => {
      try {
        return ok(await client.request(`/blog/${id}`));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'search_blogs',
    {
      title: '搜索文章',
      description: '按关键词搜索已发布文章（匹配标题/摘要/正文）。页码 page 从 0 开始。无需内部密钥。',
      inputSchema: {
        query: z.string().min(1).max(100).describe('搜索关键词'),
        page: z.number().int().min(0).default(0).describe('页码，从 0 开始'),
        size: z.number().int().min(1).max(50).default(10).describe('每页数量'),
      },
    },
    async ({ query, page, size }) => {
      try {
        return ok(await client.request('/search/blog', { params: { query, page, size } }));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'list_blogs_by_type',
    {
      title: '按分类列出文章',
      description: '获取指定分类下的已发布文章分页列表。页码 page 从 0 开始。无需内部密钥。',
      inputSchema: {
        typeId: z.number().int().describe('分类 ID'),
        page: z.number().int().min(0).default(0).describe('页码，从 0 开始'),
        size: z.number().int().min(1).max(50).default(10).describe('每页数量'),
      },
    },
    async ({ typeId, page, size }) => {
      try {
        return ok(await client.request(`/types/${typeId}`, { params: { page, size } }));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'list_blogs_by_tag',
    {
      title: '按标签列出文章',
      description: '获取指定标签下的已发布文章分页列表。页码 page 从 0 开始。无需内部密钥。',
      inputSchema: {
        tagId: z.number().int().describe('标签 ID'),
        page: z.number().int().min(0).default(0).describe('页码，从 0 开始'),
        size: z.number().int().min(1).max(50).default(10).describe('每页数量'),
      },
    },
    async ({ tagId, page, size }) => {
      try {
        return ok(await client.request(`/tags/${tagId}`, { params: { page, size } }));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'get_archives',
    {
      title: '获取文章归档',
      description: '按年份分组获取已发布文章归档。无需内部密钥。',
      inputSchema: {},
    },
    async () => {
      try {
        return ok(await client.request('/archiveBlog'));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'list_recommend_blogs',
    {
      title: '列出推荐文章',
      description: '获取被标记为推荐的已发布文章列表。无需内部密钥。',
      inputSchema: {},
    },
    async () => {
      try {
        return ok(await client.request('/getRecommendBlogList'));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'create_blog',
    {
      title: '创建文章',
      description:
        '创建一篇新文章（需要内部密钥）。正文为 Markdown。默认创建为草稿（published=false），需显式传 published=true 才会公开。摘要和封面留空时由后端自动生成。',
      inputSchema: blogFieldSchema,
    },
    async (args) => {
      try {
        const blog: Record<string, unknown> = {
          title: args.title,
          content: args.content,
          published: args.published ?? false,
          recommend: args.recommend ?? false,
          commentabled: args.commentabled ?? true,
          shareStatement: args.shareStatement ?? false,
          flag: args.flag ?? '原创',
        };
        if (args.description !== undefined) blog.description = args.description;
        if (args.firstPicture !== undefined) blog.firstPicture = args.firstPicture;
        if (args.typeId !== undefined) blog.type = { id: args.typeId };
        if (args.tagIds !== undefined) blog.tags = args.tagIds.map((id) => ({ id }));
        if (client.authorId !== undefined) blog.user = { id: client.authorId };

        await client.request('/internal/mcp/blogs', { method: 'POST', body: { blog }, internal: true });
        return ok({ success: true, message: '文章创建成功' });
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'update_blog',
    {
      title: '更新文章',
      description:
        '更新已有文章（需要内部密钥）。只需传要修改的字段，未传的字段保持不变。注意：tagIds 若传入则是全量替换而非增量追加；修改 content 时建议同步传 description，否则摘要保持旧值。',
      inputSchema: {
        id: z.number().int().describe('要更新的文章 ID'),
        ...blogFieldSchema,
      },
    },
    async ({ id, ...fields }) => {
      try {
        const existing = await client.request<ExistingBlog>(`/internal/mcp/blogs/${id}`, { internal: true });

        const blog: Record<string, unknown> = { id };
        if (fields.title !== undefined) blog.title = fields.title;
        if (fields.content !== undefined) blog.content = fields.content;
        if (fields.description !== undefined) blog.description = fields.description;
        if (fields.firstPicture !== undefined) blog.firstPicture = fields.firstPicture;
        if (fields.flag !== undefined) blog.flag = fields.flag;

        blog.published = fields.published ?? existing.published ?? false;
        blog.recommend = fields.recommend ?? existing.recommend ?? false;
        blog.commentabled = fields.commentabled ?? existing.commentabled ?? false;
        blog.shareStatement = fields.shareStatement ?? existing.shareStatement ?? false;

        const mergedTypeId = fields.typeId ?? existing.type?.id;
        if (mergedTypeId !== undefined) blog.type = { id: mergedTypeId };

        const mergedTagIds = fields.tagIds ?? (existing.tags ?? []).map((t) => t.id);
        blog.tags = mergedTagIds.map((tagId) => ({ id: tagId }));

        await client.request('/internal/mcp/blogs', { method: 'POST', body: { blog }, internal: true });
        return ok({ success: true, message: `文章 ${id} 更新成功` });
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'delete_blog',
    {
      title: '删除文章',
      description: '按 ID 永久删除文章（需要内部密钥，不可恢复）。',
      inputSchema: {
        id: z.number().int().describe('要删除的文章 ID'),
      },
    },
    async ({ id }) => {
      try {
        await client.request(`/internal/mcp/blogs/${id}`, { method: 'DELETE', internal: true });
        return ok({ success: true, message: `文章 ${id} 已删除` });
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    'set_blog_recommend',
    {
      title: '设置文章推荐状态',
      description: '开关一篇文章的首页推荐位（需要内部密钥）。',
      inputSchema: {
        id: z.number().int().describe('文章 ID'),
        recommend: z.boolean().describe('true 设为推荐，false 取消推荐'),
      },
    },
    async ({ id, recommend }) => {
      try {
        await client.request('/internal/mcp/blogs/recommend', {
          method: 'POST',
          body: { blogId: id, recommend },
          internal: true,
        });
        return ok({ success: true, message: `文章 ${id} 推荐状态已设为 ${recommend}` });
      } catch (err) {
        return fail(err);
      }
    },
  );
}
