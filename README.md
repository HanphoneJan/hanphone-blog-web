<div align="center">

# 🌟 Hanphone's Blog

**基于 Next.js 15 + React 18 + Tailwind CSS 4 的现代化个人博客系统**

![Next.js](https://img.shields.io/badge/Next.js-15.5.7-black?style=flat&logo=next.js)
![React](https://img.shields.io/badge/React-18.2.0-blue?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=flat&logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green.svg)

[在线预览](https://www.hanphone.top) · [后端仓库](https://github.com/HanphoneJan/hanphone-blog-server)

</div>

---

## ✨ 特性

### 🎨 现代化技术栈

- **Next.js 15** - 采用最新的 App Router 架构，支持 Server Components 和 RSC
- **React 18** - 最新的 React 特性和并发渲染
- **TypeScript** - 全面的类型安全
- **Tailwind CSS 4** - 原子化 CSS 框架，支持深色模式
- **Electron** - 支持打包为桌面应用

### 🚀 核心功能

- 📝 **博客管理** - 完整的博客文章发布、编辑、删除功能
- 🏷️ **分类标签** - 灵活的分类和标签系统
- 💬 **评论系统** - 支持文章评论和留言板
- 🔍 **全文搜索** - 实时搜索博客文章
- 📊 **数据统计** - 访问量、点赞数、评论数等数据可视化
- 👤 **用户管理** - 完整的用户注册、登录、权限管理
- 🌙 **深色模式** - 支持亮色/暗色主题切换
- 📱 **响应式设计** - 完美适配移动端和桌面端

### 🎯 用户体验

- ⚡ **性能优化** - 图片懒加载、代码分割、静态资源优化
- 🔒 **SEO 友好** - 完善的 Metadata 配置，支持 Open Graph 和 Twitter Card
- 🎭 **Live2D 看板娘** - 互动的虚拟角色
- 📈 **数据可视化** - ECharts 图表展示统计数据
- 💾 **状态管理** - React Context API 全局状态管理
- 🎨 **代码高亮** - 支持多种编程语言的语法高亮
- 📐 **数学公式** - KaTeX 支持 LaTeX 数学公式渲染

## 📦 项目结构

```plaintext
blog3-front/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (main)/               # 主路由组
│   │   │   ├── blog/             # 博客相关页面
│   │   │   │   ├── [id]/         # 博客详情页（动态路由）
│   │   │   │   └── page.tsx      # 博客列表页
│   │   │   ├── essay/            # 随笔页
│   │   │   ├── link/             # 友链页
│   │   │   ├── message/          # 留言板
│   │   │   ├── personal/         # 关于我
│   │   │   ├── project/          # 项目展示
│   │   │   ├── privacy/          # 隐私条款
│   │   │   ├── terms/            # 用户协议
│   │   │   └── error/            # 错误页
│   │   ├── admin/                # 管理后台
│   │   ├── next-api/             # 服务器端 API
│   │   ├── layout.tsx            # 根布局
│   │   └── globals.css           # 全局样式
│   ├── components/               # React 组件
│   │   ├── Header.tsx            # 头部导航
│   │   ├── Footer.tsx            # 页脚
│   │   ├── Live2DWidget.tsx      # Live2D 看板娘
│   │   ├── LoginForm.tsx         # 登录表单
│   │   ├── RegisterForm.tsx      # 注册表单
│   │   └── charts/               # 图表组件
│   ├── contexts/                 # React Context
│   │   ├── UserContext.tsx       # 用户状态管理
│   │   └── ThemeProvider.tsx     # 主题状态管理
│   ├── lib/                      # 工具库
│   │   ├── api.ts                # API 接口配置
│   │   ├── utils.ts              # 工具函数
│   │   └── location.ts           # 地理位置定位
│   ├── types/                    # TypeScript 类型定义
│   │   └── response.ts           # API 响应类型
│   └── assets/                   # 静态资源
├── public/                       # 公共静态文件
├── main.js                       # Electron 主进程
├── next.config.ts                # Next.js 配置
├── tailwind.config.ts            # Tailwind CSS 配置
├── tsconfig.json                 # TypeScript 配置
└── package.json                  # 项目依赖
```

## 🛠️ 技术栈

### 前端框架

- **Next.js 15.5.7** - React 框架
- **React 18.2.0** - UI 库
- **TypeScript** - 类型系统

### 样式方案

- **Tailwind CSS 4** - CSS 框架
- **PostCSS** - CSS 后处理器

### UI 组件库

- **Ant Design** - 企业级 UI 组件库
- **Font Awesome** - 图标库
- **Lucide React** - 轻量级图标库

### 数据可视化

- **ECharts** - 图表库
- **React Syntax Highlighter** - 代码高亮

### Markdown 渲染

- **react-markdown** - Markdown 解析器
- **remark-gfm** - GitHub Flavored Markdown
- **remark-math** - 数学公式支持
- **rehype-katex** - KaTeX 渲染
- **rehype-raw** - HTML 原始内容支持
- **@uiw/react-md-editor** - Markdown 编辑器

### 其他依赖

- **Axios** - HTTP 客户端
- **DOMPurify** - XSS 防护
- **date-fns** - 日期处理
- **compressorjs** - 图片压缩
- **cheerio** - HTML 解析
- **md5** - MD5 加密
- **clipboard** - 剪贴板操作
- **pixi-live2d-display** - Live2D 渲染引擎
- **pixi.js** - WebGL 渲染引擎

### 开发工具

- **ESLint** - 代码检查
- **TypeScript** - 类型检查
- **Electron** - 桌面应用打包
- **electron-builder** - Electron 打包工具

## 🚀 快速开始

### 环境要求

- Node.js >= 18.x
- npm 或 yarn 或 pnpm

### 安装依赖

```bash
npm install
```

### 配置环境变量

在项目根目录创建 `.env` 文件：

```env
# API 配置
LOCATION_KEY = 'XXXXXX' # 替换为自己的地图定位key
LOCATION_URL='https://apis.map.qq.com/ws/location/v1/ip'  #替换为自己的定位API
```

### 开发模式

```bash
# 启动 Web 开发服务器
npm run dev

# 启动 Electron 桌面应用（需要先启动 Web 服务器）
npm run dev:electron

# 同时启动 Web 和 Electron
npm run dev:both
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用

### 生产构建

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm run start
```

### 打包桌面应用

```bash
# 生成 Electron 应用图标
npm run electron:generate-icons

# 打包为桌面应用
npm run dist
```

打包后的文件在 `release` 目录中

## 📄 API 接口

本项目采用前后端分离架构，API 接口配置在 `src/lib/api.ts` 文件中：

```typescript
// 主要 API 端点
export const ENDPOINTS = {
  LOGIN: '/api/login',
  REGISTER: '/api/register',
  BLOGS: '/api/blogs',
  COMMENTS: '/api/comments',
  // ... 更多接口
}
```

完整的 API 文档请参考：[后端仓库](https://github.com/HanphoneJan/hanphone-blog-backend)

## 🌐 部署

### Node.js 部署

```bash
# 构建项目
npm run build

# 启动服务
npm run start
```

由于使用了服务器组件和动态路由，**不能使用静态编译部署**。编译生成的文件在 `.next/server` 文件夹中。

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Docker 部署（可选）

创建 `Dockerfile`：

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

构建并运行：

```bash
docker build -t hanphone-blog .
docker run -p 3000:3000 hanphone-blog
```

## 🔧 配置说明

### Next.js 配置

主要配置文件：`next.config.ts`

- `images.unoptimized`: 禁用图片优化（兼容性考虑）
- `remotePatterns`: 配置允许的远程图片域名
- `eslint.ignoreDuringBuilds`: 构建时忽略 ESLint

### Tailwind CSS 配置

主要配置文件：`tailwind.config.ts`

- `darkMode: 'class'`: 基于类的深色模式
- `content`: 配置 Tailwind 扫描的文件路径

### TypeScript 配置

主要配置文件：`tsconfig.json`

- `strict: false`: 关闭严格模式（兼容性考虑）
- `paths`: 配置路径别名 `@/*` 指向 `./src/*`

## 🎨 主题定制

### 修改主题颜色

在 `src/app/globals.css` 中修改 CSS 变量：

```css
:root {
  --primary-color: #3b82f6;
  --secondary-color: #8b5cf6;
  /* ... */
}
```

### 添加新的主题

在 `src/contexts/ThemeProvider.tsx` 中扩展主题逻辑。

## 📊 性能优化

本项目已实施多种性能优化措施：

- ⚡ **图片优化** - 使用 Next.js Image 组件，支持懒加载和响应式图片
- 📦 **代码分割** - 自动代码分割，按需加载
- 🔍 **SEO 优化** - 完善 Metadata 配置，支持 Sitemap 和 Robots
- 💾 **缓存策略** - 使用 SWR 或 React Query 进行数据缓存
- 🎯 **组件懒加载** - 动态导入非关键组件
- 🗜️ **资源压缩** - Gzip/Brotli 压缩静态资源

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📝 开发规范

### 代码风格

- 使用 ESLint 进行代码检查
- 遵循 TypeScript 类型定义
- 使用 Prettier 格式化代码（推荐）

### 提交信息

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
feat: 添加新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
test: 测试相关
chore: 构建/工具链相关
```

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源协议。

## 🙏 致谢

感谢以下开源项目：

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Ant Design](https://ant.design/)
- [ECharts](https://echarts.apache.org/)
- [KaTeX](https://katex.org/)
- [Live2D](https://www.live2d.com/)

## 📮 联系方式

- **作者**: 寒枫 (Hanphone)
- **博客**: [https://www.hanphone.top](https://www.hanphone.top)
- **GitHub**: [HanphoneJan](https://github.com/HanphoneJan)

---

<div align="center">

如果这个项目对你有帮助，请给个 ⭐️ 支持一下！

Made with ❤️ by Hanphone

</div>
