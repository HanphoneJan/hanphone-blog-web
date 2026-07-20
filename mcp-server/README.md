# Hanphone Blog MCP Server

面向外部 AI Agent 的博客操作接口。基于 [Model Context Protocol](https://modelcontextprotocol.io)，将博客的全部内容管理能力（文章、随笔、项目、文档、友链、留言、评论、分类标签、统计）封装为 60+ 个 MCP 工具，任何支持 MCP 的 Agent（Claude Code、Claude Desktop、Cursor 等）都可以通过 HTTP 远程接入并操作博客。

## 架构

```
外部 Agent（任意位置）
      │  HTTPS + Bearer <MCP API Key>   ← 由管理员在博客后台 /admin/personal 页面生成
      ▼
https://hanphone.cn/mcp ──nginx 反代──► mcp-server（Node.js，:4002）
      │ 校验密钥 ──X-Internal-Key──► POST /internal/mcp/verify-key（:8090，命中缓存则跳过）
      │ 只读工具 ──────────────────────► 博客公开接口（/blogs、/essays …）
      │ 写工具/管理读取 ──X-Internal-Key──► 后端内部接口（/internal/mcp/**，:8090）
```

两道密钥，职责分离：

| 密钥 | 方向 | 用途 | 配置位置 |
|---|---|---|---|
| **MCP API Key** | Agent → MCP server | 对外访问凭证（Bearer） | **博客后台 /admin/personal 页面**（每位管理员最多 10 个，支持启停/轮转） |
| `INTERNAL_API_KEY` | MCP server → Spring Boot | 服务间内部调用凭证（`X-Internal-Key` 头） | `mcp-server/.env` 与 `server/.env` **必须一致** |

MCP server 为**无状态**模式（stateless Streamable HTTP），每个请求独立会话，可直接用 pm2/systemd 常驻并水平扩展。

## 快速开始

```bash
# 安装依赖（在仓库根目录）
pnpm install

# 配置（仅内部服务间凭证）
cp mcp-server/.env.example mcp-server/.env   # 修改 INTERNAL_API_KEY = server/.env 一致

# 构建
pnpm --filter hanphone-blog-mcp build

# 启动
pnpm --filter hanphone-blog-mcp start        # 或开发模式：pnpm --filter hanphone-blog-mcp dev
```

> Agent 访问 `/mcp` 时使用的 MCP API Key **不在 .env 里配置**，而是登录博客后台 `/admin/personal` 页面切到「MCP 密钥」tab 创建/管理。

验证服务存活：

```bash
curl http://127.0.0.1:4002/health
# {"status":"ok","name":"hanphone-blog-mcp","version":"0.2.0", ...}
```

## 环境变量

| 变量 | 必填 | 默认值 | 说明 |
|---|---|---|---|
| `INTERNAL_API_KEY` | **是** | — | 内部接口密钥，与 `server/.env` 的 `INTERNAL_API_KEY` 一致 |
| `MCP_PORT` | 否 | `4002` | 本服务监听端口 |
| `BLOG_API_BASE_URL` | 否 | `https://hanphone.cn/api` | 博客 API 地址；本地联调后端时用 `http://localhost:8090` |
| `MCP_AUTHOR_ID` | 随笔必填 | — | 创建内容时的作者用户 ID（管理员）。可先用 `list_users` 工具查询 |
| `MCP_AUTHOR_NICKNAME` | 否 | `博主` | 管理员回复留言时显示的昵称 |
| `MCP_VERIFY_CACHE_TTL_MS` | 否 | `60000` | 密钥校验结果的内存缓存 TTL（ms），60s 内重复请求同一 bearer 不会再打后端 |

> 密钥建议只使用字母数字：后端安全过滤器会对请求头做 HTML 转义，特殊字符可能导致 `X-Internal-Key` 比对失败。

## 部署（生产）

### 1. 启动后端内部接口

MCP 写工具依赖后端新增的 `/internal/mcp/**` 接口（`server/src/main/java/com/example/blog/web/Mcp*ApiController.java`），需要重新构建并重启 Spring Boot：

```bash
cd server && mvn clean package -DskipTests
# 重启 blog 服务（按现有部署方式）
```

确认 `server/.env` 中已配置 `INTERNAL_API_KEY`（与 hanphone-chat 共用同一密钥）。

### 2. 常驻 MCP server

```bash
cd mcp-server && pnpm build
pm2 start dist/index.js --name blog-mcp
pm2 save
```

### 3. nginx 反代

在 `hanphone.cn` 的 server 块中追加：

```nginx
location = /mcp {
    proxy_pass http://127.0.0.1:4002;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    # MCP 长连接
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_read_timeout 300s;
}
```

> `/internal/mcp/**` 接口会经 `/api` 反代暴露到公网，仅由 `X-Internal-Key` 保护（与既有内部接口 `/users` 等同一安全模型）。如需加固，可在 nginx 中封禁外部对 `/api/internal/` 的访问（MCP server 与后端同机，走 `http://localhost:8090` 直连即可）。

## Agent 接入

### Claude Code

```bash
claude mcp add --transport http hanphone-blog https://hanphone.cn/mcp \
  --header "Authorization: Bearer <在后台生成的 MCP API Key>"
```

### Claude Desktop / Cursor（JSON 配置）

```json
{
  "mcpServers": {
    "hanphone-blog": {
      "type": "http",
      "url": "https://hanphone.cn/mcp",
      "headers": {
        "Authorization": "Bearer <在后台生成的 MCP API Key>"
      }
    }
  }
}
```

不支持 HTTP 传输的客户端可用 [`mcp-remote`](https://www.npmjs.com/package/mcp-remote) 桥接。

## 工具清单

工具描述中标注「需要内部密钥」的依赖 `INTERNAL_API_KEY` 配置，其余开箱可用。

### 文章（12）

| 工具 | 说明 |
|---|---|
| `list_blogs` | 已发布文章分页列表（页码从 1） |
| `list_all_blogs` | 全部文章（含草稿、全文），支持标题/分类过滤 |
| `get_blog` | 文章详情（Markdown 原文；**每次调用阅读量 +1**） |
| `search_blogs` | 关键词搜索文章（页码从 0） |
| `list_blogs_by_type` / `list_blogs_by_tag` | 按分类/标签列出文章 |
| `get_archives` / `list_recommend_blogs` | 归档 / 推荐文章 |
| `create_blog` | 创建文章（默认草稿，`published=true` 才公开；摘要/封面可留空自动生成） |
| `update_blog` | 更新文章（只传要改的字段；`tagIds` 为全量替换） |
| `delete_blog` / `set_blog_recommend` | 删除 / 推荐开关 |

### 分类与标签（8）

`list_types`、`list_tags`、`create_type`、`update_type`、`delete_type`、`create_tag`、`update_tag`、`delete_tag`

### 评论（4）

`get_comments`（文章评论）、`list_all_comments`（全站评论）、`create_comment`（可以管理员或游客身份）、`delete_comment`

### 随笔（9）

`list_essays`（含草稿）、`get_essay`、`search_essays`、`get_essay_comments`、`create_essay`、`update_essay`（**仅支持改标题/正文/附件**，后端限制）、`delete_essay`、`set_essay_recommend`、`set_essay_published`

### 项目（8）

`list_projects`（含未发布）、`get_project`、`search_projects`、`create_project`、`update_project`、`delete_project`、`set_project_recommend`、`set_project_published`

### 文档（8）

`list_docs`（含未发布）、`get_doc`（按**字符串** docId）、`create_doc`、`update_doc`、`delete_doc`、`set_doc_recommend`、`set_doc_published`（后 4 个按**数字主键** id）

### 友链（8）

`list_friend_links`（含未审核，可按 `published` 过滤）、`list_pending_friend_links`（待审核申请）、`create_friend_link`、`update_friend_link`、`delete_friend_link`、`set_friend_link_published`（**审核通过/驳回**）、`set_friend_link_recommend`

### 留言（3）

`list_messages`、`reply_message`（**管理员身份**发表/回复，带管理标识）、`delete_message`

### 其他（6）

`list_person_infos`、`save_person_info`（传 id 更新/不传新增）、`delete_person_info`、`list_users`、`get_site_stats`（公开统计）、`get_dashboard_stats`（管理聚合统计 + 按月趋势）

## 后端配套接口

新增 3 个控制器（均挂载在 `/internal/mcp`，`X-Internal-Key` 鉴权，只新增不改动现有代码）：

| 文件 | 覆盖 |
|---|---|
| `server/.../web/McpBlogApiController.java` | 博客列表（含草稿）/详情（**免阅读量 +1**）/创建更新/删除/推荐，分类标签增删改，全站评论/删除 |
| `server/.../web/McpContentApiController.java` | 随笔/项目/文档/友链的 CRUD 与 recommend/published 开关，友链全量列表 |
| `server/.../web/McpMiscApiController.java` | 管理员留言回复（`adminMessage=true`）、留言删除、个人信息增删改、仪表盘聚合统计 |

密钥校验组件：`server/.../util/InternalKeyVerifier.java`（与 `InternalApiController` 同一配置 `internal.api.key`）。

## 注意事项

1. **业务码判定**：后端业务失败也返回 HTTP 200，MCP server 已统一检查 `code === 200` 并将失败转为工具错误返回。
2. **内容转义**：与博客后台发文一致，JSON body 中的字符串会被后端 XSS 过滤器做 HTML 实体转义（既有行为，非 MCP 引入）。
3. **更新语义**：`update_*` 工具内部会先读取原值合并再提交，未传字段不会被意外清空（规避后端 primitive boolean 缺省覆盖问题）。
4. **用户管理**：仅开放 `list_users`，创建/删除用户、重置密码不对 Agent 开放。

## 故障排查

| 现象 | 排查 |
|---|---|
| `/mcp` 返回 401 | 检查 `Authorization: Bearer <MCP API Key>`。密钥是否已在后台停用？请切到 `/admin/personal` → MCP 密钥 tab 查看状态 |
| 写工具报「未配置 INTERNAL_API_KEY」 | `.env` 中配置并重启 MCP server |
| 写工具报「未授权访问」 | 两端 `INTERNAL_API_KEY` 不一致；或密钥含 HTML 特殊字符 |
| 写工具报 HTTP 404 | 后端未重新构建部署（`/internal/mcp/**` 不存在） |
| 工具报「无法连接博客后端」 | 检查 `BLOG_API_BASE_URL`（生产需带 `/api` 后缀，直连 8090 不带） |
