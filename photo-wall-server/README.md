# 🖼️ 寒枫的照片墙服务端 | Hanphone's Photo Wall Server

## 📌 项目简介

仓库中同时保留了同一套业务的两种后端实现：

- `Node.js + Express`：当前目录即为服务端实现（推荐生产使用）
- `archive-php/`：基于 `PHP + MySQL` 的服务端实现（已归档，功能落后于 Node.js 版本，仅用于学习参考）

项目聚焦于 **图片上传、可视化展示、标签检索、后台管理** 等核心能力，适合作为个人照片墙、轻量图库系统、前后端分离练手项目，以及双语言后端实现对照参考。

## 🏗️ 项目架构

### 🎯 核心定位

- 个人照片墙后端：围绕图片展示、管理与分享构建
- 双实现对照：同一业务提供 `Node.js` 与 `PHP` 两套版本
- 前后端分离：可直接对接开源前端项目 `photo-wall`
- 轻量可扩展：目录清晰，便于继续演进接口与部署方案

### 🚀 技术架构栈

#### 🔹 前端配套项目 | Frontend

<p align="left">
  <img src="https://img.shields.io/badge/Vue3-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white" alt="Vue3">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/ElementPlus-1989FA?style=for-the-badge&logo=element&logoColor=white" alt="ElementPlus">
  <img src="https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA">
</p>

- 对应仓库：[`HanphoneJan/photo-wall`](https://github.com/HanphoneJan/photo-wall)
- 技术方向：Vue 3 + Vite + Element Plus + PWA
- 使用方式：前端负责界面展示、交互与多端适配，当前仓库提供配套接口能力

#### 🔹 服务端架构一 | Node.js Backend

<p align="left">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT">
</p>

- 基础框架：Node.js + Express
- 鉴权方案：JWT + Session
- 数据存储：PostgreSQL
- 功能范围：图片展示、上传、搜索、点赞、标签查询、部分后台管理
- 适用场景：希望基于 JavaScript 生态继续扩展 API 与服务能力

#### 🔹 服务端架构二 | PHP Backend

<p align="left">
  <img src="https://img.shields.io/badge/PHP-777BB4?style=for-the-badge&logo=php&logoColor=white" alt="PHP">
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL">
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT">
  <img src="https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white" alt="Nginx">
</p>

- 基础架构：轻量级 PHP 目录组织
- 接口方式：面向前后端分离场景的接口式后端
- 身份认证：JWT 鉴权 + 拦截器
- 数据存储：MySQL
- 功能模块：登录、注册、验证码、找回密码、图片管理、标签管理、后台管理

## ✨ 核心功能

1. 📤 图片管理：支持图片上传、展示、删除与分类处理
2. 🔍 标签与搜索：支持标签获取、检索与后台标签管理
3. ❤️ 互动能力：支持点赞与访问统计
4. 🔐 身份认证：基于 JWT 的登录鉴权与接口拦截
5. 🛠️ 后台管理：支持图片、标签、用户等后台管理功能
6. 📚 学习参考：保留 PHP 实现供对照学习（功能较 Node.js 版本滞后）

## 📂 仓库结构

```text
photo-wall-server/
├── app.js                     # 应用入口
├── config/                    # 数据库和业务配置
│   ├── config.js              # 通用配置（密钥、端口等）
│   └── db.js                  # PostgreSQL 数据库连接配置
├── controller/                # 业务控制器
│   ├── admin/                 # 后台管理控制器
│   │   ├── addTag.js
│   │   ├── adminShow.js
│   │   ├── adminUpdate.js
│   │   ├── changePhotoType.js
│   │   ├── changeUser.js
│   │   ├── createTag.js
│   │   ├── deletePhoto.js
│   │   ├── deletePhotoTag.js
│   │   ├── deleteTag.js
│   │   ├── deleteUser.js
│   │   ├── getAdminTag.js
│   │   └── getUser.js
│   ├── getTag.js
│   ├── likes.js
│   ├── search.js
│   ├── show.js
│   ├── upload.js
│   └── visitCount.js
├── middleware/                # 中间件
│   └── interceptor.js         # JWT 鉴权拦截器
├── routes/                    # 路由定义
│   ├── admin.js               # 后台管理路由
│   └── index.js               # 公开接口路由
├── utils/                     # 通用工具函数
│   ├── password.js            # 密码哈希工具
│   └── token.js               # JWT 生成与校验
├── archive-php/               # PHP + MySQL 实现（归档）
│   ├── README.md
│   ├── .env.example           # PHP 环境变量示例
│   ├── application.php        # PHP 应用入口
│   ├── 404.html               # 错误页面
│   ├── atlas.sql              # MySQL 初始化脚本
│   ├── nginx.conf             # Nginx 配置示例
│   ├── config/                # PHP 配置目录
│   │   ├── config.php
│   │   ├── db_connect.php
│   │   ├── email_connect.php
│   │   └── env.php
│   ├── controller/            # PHP 控制器
│   │   ├── admin/             # PHP 后台管理
│   │   │   ├── addTag.php
│   │   │   ├── adminShow.php
│   │   │   ├── adminUpdate.php
│   │   │   ├── changePhotoType.php
│   │   │   ├── changeUser.php
│   │   │   ├── createTag.php
│   │   │   ├── deletePhoto.php
│   │   │   ├── deletePhotoTag.php
│   │   │   ├── deleteTag.php
│   │   │   ├── deleteUser.php
│   │   │   ├── getAdminTag.php
│   │   │   └── getUser.php
│   │   ├── forgotPassword.php
│   │   ├── getTag.php
│   │   ├── likes.php
│   │   ├── login.php
│   │   ├── register.php
│   │   ├── search.php
│   │   ├── sendVerificationCode.php
│   │   ├── show.php
│   │   ├── upload.php
│   │   └── visitCount.php
│   └── interceptor/           # PHP 拦截器
│       ├── interceptor.php
│       └── token.php
├── ecosystem.config.cjs       # PM2 部署配置
├── init.sql                   # PostgreSQL 初始化脚本
├── package.json
├── package-lock.json
├── README.md
└── .gitignore
```

## 🚀 快速开始

两个实现任选其一启动即可，不需要同时运行。

### 方式一：启动 Node.js 后端

```bash
pnpm install
pnpm start
```

- 默认端口：`4001`
- 关键配置：`config/db.js`

### 方式二：启动 PHP 后端

```bash
cd archive-php
cp .env.example .env
php -S 127.0.0.1:3003 application.php
```

- 数据库初始化：`archive-php/atlas.sql`
- Nginx 示例：`archive-php/nginx.conf`
- 环境变量示例：`archive-php/.env.example`
- 关键配置入口：`archive-php/.env`

## 部署

```Shell
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```
