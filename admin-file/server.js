require('dotenv').config();
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const fsExists = require("fs").existsSync;
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { verifyToken } = require('./token');
const { logger, httpLogger } = require('./logger');
const app = express();
const PORT = process.env.PORT || 4000;
const baseUploadDir = path.join(__dirname, "uploads");
const tempUploadDir = path.join(baseUploadDir, "temp"); // 定义临时目录
const avatarUploadDir = path.join(baseUploadDir, "blog", "avatars"); // 头像上传目录

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// Swagger 配置
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '文件管理服务器 API',
      version: '1.0.0',
      description: '文件上传、下载、管理接口文档',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: '本地服务器',
      },
      {
        url: 'https://hanphone.top',
        description: '生产服务器',
      },
    ],
  },
  apis: ['./server.js', './token.js'], // 扫描的文件路径
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// 配置CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "OPTIONS", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization", "Token"],
  })
);

app.options("/*all", cors());

// 【修改 1】丰富了文件类型分类
const fileCategories = {
  images: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/bmp",
    "image/svg+xml",
    "image/webp",
    "image/avif",
    "image/apng",
  ],
  videos: [
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-matroska",
    "video/webm",
  ],
  audios: [
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/flac",
    "audio/aac",
    "audio/x-wav",
  ],
  codes: [
    "text/javascript",
    "application/javascript",
    "application/x-javascript",
    "text/x-python",
    "application/x-python",
    "text/x-php",
    "application/x-php",
    "text/x-java-source",
    "application/x-java-source",
    "text/x-c",
    "text/x-c++",
    "application/x-c",
    "application/x-c++",
    "text/x-ruby",
    "application/x-ruby",
    "text/x-go",
    "application/x-go",
    "text/typescript",
    "application/typescript",
    "text/html",
    "text/css",
    "text/xml",
    "application/json",
    "application/x-yaml",
    "text/yaml",
    "application/sql",
    "text/x-sql",
    "text/x-shellscript",
  ],
  documents: [
    "text/plain",
    "text/markdown",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/rtf",
    "application/vnd.oasis.opendocument.text",
    "application/vnd.oasis.opendocument.spreadsheet",
    "application/vnd.oasis.opendocument.presentation",
  ],
  archives: [
    "application/zip",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
    "application/x-tar",
    "application/gzip",
    "application/x-gzip",
  ],
  fonts: [
    "font/ttf",
    "font/otf",
    "font/woff",
    "font/woff2",
    "application/x-font-ttf",
    "application/x-font-otf",
  ],
};

// 【修改 2】扩展了扩展名分类型映射
const extensionToCategory = {
  // Images
  ".jpg": "images",
  ".jpeg": "images",
  ".png": "images",
  ".gif": "images",
  ".bmp": "images",
  ".svg": "images",
  ".webp": "images",
  ".avif": "images",
  ".apng": "images",
  // Videos
  ".mp4": "videos",
  ".mpeg": "videos",
  ".mov": "videos",
  ".avi": "videos",
  ".mkv": "videos",
  ".webm": "videos",
  // Audios
  ".mp3": "audios",
  ".wav": "audios",
  ".ogg": "audios",
  ".flac": "audios",
  ".aac": "audios",
  // Codes
  ".js": "codes",
  ".mjs": "codes",
  ".py": "codes",
  ".php": "codes",
  ".java": "codes",
  ".c": "codes",
  ".cpp": "codes",
  ".cc": "codes",
  ".h": "codes",
  ".hpp": "codes",
  ".rb": "codes",
  ".go": "codes",
  ".ts": "codes",
  ".tsx": "codes",
  ".html": "codes",
  ".htm": "codes",
  ".css": "codes",
  ".scss": "codes",
  ".less": "codes",
  ".json": "codes",
  ".xml": "codes",
  ".yaml": "codes",
  ".yml": "codes",
  ".toml": "codes",
  ".ini": "codes",
  ".conf": "codes",
  ".sql": "codes",
  ".sh": "codes",
  ".bash": "codes",
  ".zsh": "codes",
  ".swift": "codes",
  ".kt": "codes",
  ".rs": "codes",
  ".dart": "codes",
  ".vue": "codes",
  ".svelte": "codes",
  // Documents
  ".txt": "documents",
  ".md": "documents",
  ".pdf": "documents",
  ".doc": "documents",
  ".docx": "documents",
  ".ppt": "documents",
  ".pptx": "documents",
  ".xls": "documents",
  ".xlsx": "documents",
  ".rtf": "documents",
  ".odt": "documents",
  ".ods": "documents",
  ".odp": "documents",
  // Archives
  ".zip": "archives",
  ".rar": "archives",
  ".7z": "archives",
  ".tar": "archives",
  ".gz": "archives",
  ".tgz": "archives",
  // Fonts
  ".ttf": "fonts",
  ".otf": "fonts",
  ".woff": "fonts",
  ".woff2": "fonts",
  ".eot": "fonts",
};

/**
 * 确保目录存在，如果不存在则创建
 * @param {string} dirPath - 目录路径
 */
async function ensureDirectoryExists(dirPath) {
  try {
    if (!fsExists(dirPath)) {
      logger.info(`目录不存在，正在创建: ${dirPath}`);
      await fs.mkdir(dirPath, { recursive: true });
      logger.info(`目录创建成功: ${dirPath}`);
    }
  } catch (err) {
    logger.error(`创建目录失败 ${dirPath}:`, { error: err.message, stack: err.stack });
    throw err;
  }
}

// 初始化基础、临时和头像上传目录
Promise.all([
  ensureDirectoryExists(baseUploadDir),
  ensureDirectoryExists(tempUploadDir),
  ensureDirectoryExists(avatarUploadDir),
])
  .then(() => logger.info(`基础、临时和头像上传目录准备就绪`))
  .catch((err) => logger.error("初始化目录失败:", { error: err.message, stack: err.stack }));

// 头像上传速率限制器（每IP每小时最多5次上传）
const avatarUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 5, // 最多5次请求
  message: {
    error: "上传频率过高，请稍后再试",
    retryAfter: "3600"
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 确定文件分类
function getFileCategory(mimetype, filename) {
  for (const [category, types] of Object.entries(fileCategories)) {
    if (types.includes(mimetype)) {
      return category;
    }
  }

  const ext = path.extname(filename).toLowerCase();
  if (extensionToCategory[ext]) {
    return extensionToCategory[ext];
  }

  return "others";
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取完整的文件存储路径，遵循新的优先级规则
 * @param {string} category - 指定的分类
 * @param {string} namespace - 指定的命名空间
 * @param {string} mimetype - 文件的MIME类型
 * @param {string} filename - 文件名
 * @returns {string} 完整的存储目录路径
 */
function getFullStoragePath(category, namespace, mimetype, filename) {
  // 1. 优先按指定的分类存储
  if (category) {
    return path.join(baseUploadDir, category);
  }
  // 2. 若为空则按指定的namespace存储
  if (namespace) {
    return path.join(baseUploadDir, namespace);
  }
  // 3. 都空才按类型存储
  const autoCategory = getFileCategory(mimetype, filename);
  return path.join(baseUploadDir, autoCategory);
}

/**
 * 修复ISO-8859-1编码的中文文件名
 */
function fixFileNameEncoding(originalName) {
  try {
    return Buffer.from(originalName, "latin1").toString("utf8");
  } catch (err) {
    logger.warn("文件名编码转换失败", { originalName, error: err.message });
    return originalName;
  }
}

// 配置multer存储
const storage = multer.diskStorage({
  // 目标目录：统一使用临时目录
  destination: async function (req, file, cb) {
    try {
      // 确保临时目录存在
      await ensureDirectoryExists(tempUploadDir);
      cb(null, tempUploadDir);
    } catch (err) {
      logger.error("设置临时存储目录失败:", { error: err.message, stack: err.stack });
      cb(err);
    }
  },
  // 文件名：保持原样，如果存在则加时间戳
  filename: async function (req, file, cb) {
    try {
      const originalName = fixFileNameEncoding(file.originalname);
      const ext = path.extname(originalName);
      const nameWithoutExt = path.basename(originalName, ext);

      // 检查原文件名是否存在
      let filePath = path.join(tempUploadDir, originalName);
      let exists = await fileExists(filePath);

      if (!exists) {
        return cb(null, originalName);
      }

      // 文件名存在时添加时间戳
      const timestamp = Date.now();
      const uniqueName = `${nameWithoutExt}-${timestamp}${ext}`;
      cb(null, uniqueName);
    } catch (err) {
      logger.error("生成文件名时出错:", { error: err.message, stack: err.stack });
      const uniqueName = `${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    }
  },
});

// 【修改 3】配置multer，扩大文件大小限制到1GB
const upload = multer({
  storage,
  limits: {
    fileSize: 1 * 1024 * 1024 * 1024, // 1GB
  },
});

// 头像上传配置（仅限图片，大小限制5MB）
const avatarStorage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      await ensureDirectoryExists(avatarUploadDir);
      cb(null, avatarUploadDir);
    } catch (err) {
      logger.error("设置头像存储目录失败:", { error: err.message, stack: err.stack });
      cb(err);
    }
  },
  filename: async function (req, file, cb) {
    try {
      const originalName = fixFileNameEncoding(file.originalname);
      const ext = path.extname(originalName);
      const nameWithoutExt = path.basename(originalName, ext);
      const timestamp = Date.now();
      const uniqueName = `avatar-${timestamp}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, uniqueName);
    } catch (err) {
      logger.error("生成头像文件名时出错:", { error: err.message, stack: err.stack });
      const uniqueName = `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    }
  },
});

// 头像上传过滤器（仅限图片）
const avatarFileFilter = (req, file, cb) => {
  const allowedMimetypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/avif",
    "image/svg+xml"
  ];
  
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg"];
  
  if (allowedMimetypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("仅限上传图片文件（jpg, jpeg, png, gif, webp, avif, svg）"), false);
  }
};

// 头像上传配置
const uploadAvatar = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: avatarFileFilter,
});


// 辅助函数：从 Authorization header 中提取 token
const extractToken = (authHeader) => {
  if (!authHeader) {
    return null;
  }

  // 去除首尾的空格
  let token = authHeader.trim();
  
  // 处理 Bearer 前缀（可能带引号）
  if (token.toLowerCase().startsWith('bearer')) {
    token = token.substring(6).trim(); // 移除 "bearer"（6个字符）
  }
  
  // 处理可能包裹在 token 外层的单引号或双引号
  if ((token.startsWith('"') && token.endsWith('"')) || 
      (token.startsWith("'") && token.endsWith("'"))) {
    token = token.slice(1, -1);
  }
  
  return token.trim();
};

// Token 验证中间件
const authenticateToken = (req, res, next) => {
  // 内部服务调用（服务间通信，如 blog server 回收文件），通过 x-internal-key 认证
  const internalKey = req.headers["x-internal-key"];
  if (
    internalKey &&
    process.env.INTERNAL_API_KEY &&
    internalKey === process.env.INTERNAL_API_KEY
  ) {
    req.internal = true;
    return next();
  }

  // 检查是否是公开接口（不需要认证）
  const publicPaths = ['/upload/avatar'];
  if (publicPaths.includes(req.path)) {
    return next(); // 跳过认证
  }
  
  // 优先使用 'Authorization' header，其次使用 'Token' header
  // HTTP header 名称是大小写不敏感的，使用小写是更常见的 Node.js/Express 实践。
  const authHeader = req.headers['authorization'] || req.headers['token'];

  // 使用辅助函数提取 token
  const token = extractToken(authHeader);

  if (!token) {
    return res.status(401).json({ error: "缺少访问令牌" });
  }

  // 假设 verifyToken 是您验证 token 的函数
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: "无效的访问令牌" });
  }

  req.user = decoded;
  next();
};

// HTTP 请求日志中间件
app.use((req, res, next) => {
  const start = Date.now();
  
  // 记录请求开始
  httpLogger.info({
    type: 'request',
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // 重写 res.json 以记录响应
  const originalJson = res.json.bind(res);
  res.json = function(data) {
    const duration = Date.now() - start;
    
    httpLogger.info({
      type: 'response',
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      userId: req.user ? req.user.id : null,
      response: data.error ? { error: data.error } : { code: data.code }
    });
    
    return originalJson(data);
  };

  next();
});

// 解析请求体
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * @swagger
 * /upload/avatar:
 *   post:
 *     summary: 上传头像（公共接口）
 *     description: 无需认证，仅支持图片（jpg/png/gif/webp/avif/svg），大小≤5MB，每IP每小时限5次。支持自定义文件名
 *     tags: [Avatar]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [avatar]
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: 头像图片（字段名必须是avatar）
 *               filename:
 *                 type: string
 *                 description: 自定义文件名（可选，不包含扩展名）
 *     responses:
 *       200:
 *         description: 上传成功
 *         content:
 *           application/json:
 *             example: { "code": 200, "message": "头像上传成功", "url": "https://hanphone.top/blog/avatars/avatar-xxx.jpg" }
 *       400:
 *         description: 未上传文件或文件类型不支持
 *       413:
 *         description: 文件大小超过5MB限制
 *       429:
 *         description: 上传频率过高
 *       500:
 *         description: 服务器内部错误
 */
// 公共头像上传接口（无需认证，但有速率限制）
app.post("/upload/avatar", avatarUploadLimiter, uploadAvatar.single("avatar"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "没有文件被上传" });
  }

  try {
    const fixedName = fixFileNameEncoding(req.file.originalname);
    const ext = path.extname(fixedName);
    const customFilename = req.body.filename;
    
    let finalFilename;
    if (customFilename && typeof customFilename === 'string' && customFilename.trim()) {
      // 使用自定义文件名（清理非法字符）
      const safeFilename = customFilename.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
      finalFilename = `${safeFilename}${ext}`;
    } else {
      // 使用原始文件名（清理非法字符）
      const originalNameWithoutExt = path.basename(fixedName, ext);
      const safeOriginalName = originalNameWithoutExt.replace(/[^a-zA-Z0-9_-]/g, '_');
      finalFilename = `${safeOriginalName}${ext}`;
    }
    
    // 检查并处理文件名冲突
    const finalPath = path.join(avatarUploadDir, finalFilename);
    if (await fileExists(finalPath)) {
      // 文件已存在，添加时间戳
      const nameWithoutExt = path.basename(finalFilename, ext);
      const timestamp = Date.now();
      finalFilename = `${nameWithoutExt}-${timestamp}${ext}`;
    }
    
    // 移动文件到最终位置并重命名
    const finalFilePath = path.join(avatarUploadDir, finalFilename);
    await fs.rename(req.file.path, finalFilePath);
    
    // 构建返回的URL
    const encodedFilename = encodeURIComponent(finalFilename);
    const urlPath = `blog/avatars/${encodedFilename}`;

    res.json({
      code: 200,
      message: "头像上传成功",
      url: `https://hanphone.top/${urlPath}`,
      filename: finalFilename,
      originalName: fixedName,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });
  } catch (err) {
    logger.error("处理头像上传时出错:", { error: err.message, stack: err.stack, filename: req.file?.filename });
    if (req.file && req.file.path) {
      await fs.unlink(req.file.path).catch((e) => logger.error("删除头像文件失败:", { error: e.message }));
    }
    res.status(500).json({ error: "头像上传失败" });
  }
});

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: 上传文件（需要认证）
 *     description: 需要认证的文件上传接口，支持多种文件类型和分类，最大1GB
 *     tags: [File]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: 要上传的文件
 *               category:
 *                 type: string
 *                 enum: [images, videos, audios, codes, documents, archives, fonts]
 *                 description: 文件分类（可选，自动识别）
 *               namespace:
 *                 type: string
 *                 description: 命名空间（可选，用于组织文件）
 *     responses:
 *       200:
 *         description: 文件上传成功
 *         content:
 *           application/json:
 *             example: { "code": 200, "message": "文件上传成功", "url": "https://hanphone.top/images/example.jpg", "filename": "xxx.jpg" }
 *       400:
 *         description: 没有文件被上传
 *       401:
 *         description: 缺少或无效的访问令牌
 *       413:
 *         description: 文件大小超过1GB限制
 *       500:
 *         description: 文件处理失败
 */
// 上传文件接口
app.post("/upload", authenticateToken, upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "没有文件被上传" });
  }

  try {
    const category = req.body.category || req.query.category;
    const namespace = req.body.namespace || req.query.namespace;
    const fixedName = fixFileNameEncoding(req.file.originalname);

    // 1. 决定最终的存储目录
    const finalDir = getFullStoragePath(
      category,
      namespace,
      req.file.mimetype,
      fixedName
    );
    await ensureDirectoryExists(finalDir);

    // 2. 构建最终的文件路径
    const finalPath = path.join(finalDir, req.file.filename);

    // 3. 如果最终路径和初始路径不同，则移动文件
    if (req.file.path !== finalPath) {
      logger.info(`文件从临时目录移动到最终目录`, {
        from: req.file.path,
        to: finalPath,
        filename: req.file.filename
      });
      await fs.rename(req.file.path, finalPath);
      // 更新 req.file 对象，使其反映新位置，方便后续使用
      req.file.path = finalPath;
    }

    // 4. 构建返回的URL
    let urlDir;
    let finalCategoryForResponse = null;

    if (category) {
      urlDir = category;
      finalCategoryForResponse = category;
    } else if (namespace) {
      urlDir = namespace;
      finalCategoryForResponse = null; // 按namespace存储时，分类为null
    } else {
      finalCategoryForResponse = getFileCategory(req.file.mimetype, fixedName);
      urlDir = finalCategoryForResponse;
    }

    // 按路径段逐段编码，保留 / 分隔符（避免整串编码产生 %2F）
    const encodedUrlDir = urlDir
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");
    const encodedFilename = encodeURIComponent(req.file.filename);
    const urlPath = `${encodedUrlDir}/${encodedFilename}`;

    // 5. 返回成功响应
    res.json({
      code: 200,
      message: "文件上传成功",
      url: `https://hanphone.top/${urlPath}`,
      filename: req.file.filename,
      category: finalCategoryForResponse,
      namespace: namespace || null,
      originalName: fixedName,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });
  } catch (err) {
    logger.error("处理上传文件时出错:", { error: err.message, stack: err.stack, filename: req.file?.filename });
    // 如果移动失败，可以尝试删除临时文件
    if (req.file && req.file.path) {
      await fs
        .unlink(req.file.path)
        .catch((e) => logger.error("删除临时文件失败:", { error: e.message }));
    }
    res.status(500).json({ error: "文件处理失败" });
  }
});

/**
 * @swagger
 * /upload/batch:
 *   post:
 *     summary: 批量上传文件（需要认证）
 *     description: 一次上传多个文件，最多20个，每个最大1GB
 *     tags: [File]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [files]
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: 要上传的多个文件（字段名必须是 files）
 *               category:
 *                 type: string
 *                 enum: [images, videos, audios, codes, documents, archives, fonts]
 *                 description: 文件分类（可选，自动识别）
 *               namespace:
 *                 type: string
 *                 description: 命名空间（可选，用于组织文件）
 *     responses:
 *       200:
 *         description: 批量上传完成
 *         content:
 *           application/json:
 *             example: { "code": 200, "message": "批量上传完成", "total": 3, "success": 2, "failed": 1, "results": [{ "success": true, "filename": "xxx.jpg", "url": "https://hanphone.top/..." }, { "success": false, "filename": "yyy.zip", "error": "文件处理失败" }] }
 *       400:
 *         description: 没有文件被上传
 *       401:
 *         description: 缺少或无效的访问令牌
 *       413:
 *         description: 单个文件大小超过1GB限制
 *       500:
 *         description: 批量处理时发生错误
 */
// 批量上传文件接口
app.post("/upload/batch", authenticateToken, upload.array("files", 20), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "没有文件被上传" });
  }

  const category = req.body.category || req.query.category;
  const namespace = req.body.namespace || req.query.namespace;

  const results = [];
  let successCount = 0;
  let failedCount = 0;

  for (const file of req.files) {
    try {
      const fixedName = fixFileNameEncoding(file.originalname);

      // 1. 决定最终的存储目录
      const finalDir = getFullStoragePath(
        category,
        namespace,
        file.mimetype,
        fixedName
      );
      await ensureDirectoryExists(finalDir);

      // 2. 构建最终的文件路径
      const finalPath = path.join(finalDir, file.filename);

      // 3. 如果最终路径和初始路径不同，则移动文件
      if (file.path !== finalPath) {
        logger.info(`批量上传：文件从临时目录移动到最终目录`, {
          from: file.path,
          to: finalPath,
          filename: file.filename
        });
        await fs.rename(file.path, finalPath);
        file.path = finalPath;
      }

      // 4. 构建返回的URL
      let urlDir;
      let finalCategoryForResponse = null;

      if (category) {
        urlDir = category;
        finalCategoryForResponse = category;
      } else if (namespace) {
        urlDir = namespace;
        finalCategoryForResponse = null;
      } else {
        finalCategoryForResponse = getFileCategory(file.mimetype, fixedName);
        urlDir = finalCategoryForResponse;
      }

      const encodedUrlDir = urlDir
        .split("/")
        .map((segment) => encodeURIComponent(segment))
        .join("/");
      const encodedFilename = encodeURIComponent(file.filename);
      const urlPath = `${encodedUrlDir}/${encodedFilename}`;

      results.push({
        success: true,
        filename: file.filename,
        originalName: fixedName,
        url: `https://hanphone.top/${urlPath}`,
        category: finalCategoryForResponse,
        namespace: namespace || null,
        mimetype: file.mimetype,
        size: file.size,
      });
      successCount++;
    } catch (err) {
      logger.error("批量上传处理单个文件失败:", { error: err.message, filename: file.originalname });
      // 尝试清理临时文件
      if (file.path) {
        await fs.unlink(file.path).catch((e) => logger.error("删除临时文件失败:", { error: e.message }));
      }
      results.push({
        success: false,
        filename: file.filename,
        originalName: fixFileNameEncoding(file.originalname),
        error: err.message || "文件处理失败",
      });
      failedCount++;
    }
  }

  res.json({
    code: 200,
    message: `批量上传完成，成功 ${successCount} 个，失败 ${failedCount} 个`,
    total: req.files.length,
    success: successCount,
    failed: failedCount,
    results,
  });
});

/**
 * @swagger
 * /delete:
 *   delete:
 *     summary: 删除文件或目录（需要认证）
 *     description: 删除指定路径下的文件或空目录
 *     tags: [File]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 description: 要删除的文件名或目录名
 *               namespace:
 *                 type: string
 *                 description: 命名空间（可选）
 *               category:
 *                 type: string
 *                 description: 文件分类（可选）
 *               parentNamespace:
 *                 type: string
 *                 description: 父命名空间（可选）
 *     responses:
 *       200:
 *         description: 删除成功
 *         content:
 *           application/json:
 *             example: { "code": 200, "message": "文件删除成功", "type": "file", "name": "xxx.jpg" }
 *       400:
 *         description: 请求错误（如目录不为空）
 *       401:
 *         description: 缺少或无效的访问令牌
 *       404:
 *         description: 目标不存在
 *       500:
 *         description: 删除时发生错误
 */
// 删除文件接口
app.delete("/delete", authenticateToken, async (req, res) => {
  try {
    const { name, namespace, category, parentNamespace, recursive } = req.body;

    if (!name) {
      return res.status(400).json({ error: "请提供要删除的名称" });
    }

    let targetPath;
    if (namespace) {
      targetPath = path.join(baseUploadDir, namespace, name);
    } else if (category) {
      targetPath = path.join(baseUploadDir, category, name);
    } else if (parentNamespace) {
      targetPath = path.join(baseUploadDir, parentNamespace, name);
    } else {
      targetPath = path.join(baseUploadDir, name);
    }

    // 路径安全校验：禁止越出上传根目录（防御 ../ 路径穿越）
    const resolvedBase = path.resolve(baseUploadDir);
    const resolvedTarget = path.resolve(targetPath);
    if (
      resolvedTarget === resolvedBase ||
      !resolvedTarget.startsWith(resolvedBase + path.sep)
    ) {
      return res.status(400).json({ error: "非法的删除路径" });
    }

    if (!(await fileExists(targetPath))) {
      return res
        .status(404)
        .json({
          error: "目标不存在",
          name,
          namespace,
          category,
          parentNamespace,
        });
    }

    const stats = await fs.stat(targetPath);

    if (stats.isFile()) {
      await fs.unlink(targetPath);
      res.json({
        code: 200,
        message: "文件删除成功",
        type: "file",
        name,
        namespace: namespace || parentNamespace || null,
        category: category || null,
      });
    } else if (stats.isDirectory()) {
      const items = await fs.readdir(targetPath);
      if (recursive) {
        await fs.rm(targetPath, { recursive: true, force: false });
        return res.json({
          code: 200,
          message: "目录删除成功（含全部内容）",
          type: "directory",
          name,
          namespace: namespace || parentNamespace || null,
          category: category || null,
          itemCount: items.length,
        });
      }
      if (items.length > 0) {
        return res
          .status(400)
          .json({
            error: "目录不为空，无法删除",
            type: "directory",
            name,
            namespace: namespace || parentNamespace || null,
            category: category || null,
            itemCount: items.length,
          });
      }
      await fs.rmdir(targetPath);
      res.json({
        code: 200,
        message: "目录删除成功",
        type: "directory",
        name,
        namespace: namespace || parentNamespace || null,
        category: category || null,
      });
    }
  } catch (err) {
    logger.error("删除操作失败:", { error: err.message, stack: err.stack, name: req.body.name });
    res.status(500).json({ error: "删除时发生错误" });
  }
});

/**
 * @swagger
 * /files:
 *   get:
 *     summary: 获取文件列表（需要认证）
 *     description: 获取指定命名空间或分类下的文件和目录列表
 *     tags: [File]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: namespace
 *         schema:
 *           type: string
 *         description: 命名空间（与category二选一）
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [images, videos, audios, codes, documents, archives, fonts, others]
 *         description: 文件分类（与namespace二选一）
 *     responses:
 *       200:
 *         description: 获取文件列表成功
 *         content:
 *           application/json:
 *             example: { "code": 200, "message": "获取文件列表成功", "items": [{ "name": "xxx.jpg", "isDirectory": false, "size": 1024 }] }
 *       401:
 *         description: 缺少或无效的访问令牌
 *       404:
 *         description: 目录不存在
 *       500:
 *         description: 获取文件列表时发生错误
 */
// 获取文件列表接口
app.get("/files", authenticateToken, async (req, res) => {
  try {
    const { namespace, category } = req.query;

    if (!namespace && !category) {
      const items = await fs.readdir(baseUploadDir, { withFileTypes: true });
      const result = [];
      for (const item of items) {
        if (item.name === "temp") continue; // 不显示临时目录
        const itemPath = path.join(baseUploadDir, item.name);
        const stats = await fs.stat(itemPath);
        result.push({
          name: item.name,
          isDirectory: item.isDirectory(),
          type: item.isDirectory() ? "namespace" : "file",
          size: stats.size,
          mtime: stats.mtime,
          birthtime: stats.birthtime,
        });
      }
      return res.json({
        code: 200,
        message: "获取根目录内容成功",
        items: result,
      });
    }

    const targetDir = getFullStoragePath(category, namespace, "", "");
    if (!(await fileExists(targetDir))) {
      return res.status(404).json({ error: "目录不存在", namespace, category });
    }

    const items = await fs.readdir(targetDir, { withFileTypes: true });
    const fileItems = [];
    const dirStats = await fs.stat(targetDir);

    for (const item of items) {
      const itemPath = path.join(targetDir, item.name);
      const stats = await fs.stat(itemPath);
      fileItems.push({
        name: item.name,
        isDirectory: item.isDirectory(),
        size: stats.size,
        mtime: stats.mtime,
        birthtime: stats.birthtime,
        category: !namespace ? category : null,
        namespace: namespace || null,
      });
    }

    res.json({
      code: 200,
      message: "获取文件列表成功",
      items: fileItems,
      directoryInfo: {
        name: namespace || category,
        size: dirStats.size,
        mtime: dirStats.mtime,
        birthtime: dirStats.birthtime,
      },
      namespace,
      category,
    });
  } catch (err) {
    logger.error("获取文件列表失败:", { error: err.message, stack: err.stack, namespace: req.query.namespace, category: req.query.category });
    res.status(500).json({ error: "获取文件列表时发生错误" });
  }
});

/**
 * @swagger
 * /file:
 *   get:
 *     summary: 获取文件详情（需要认证）
 *     description: 获取指定文件的详细信息
 *     tags: [File]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: 文件名
 *       - in: query
 *         name: namespace
 *         schema:
 *           type: string
 *         description: 命名空间（与category二选一）
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [images, videos, audios, codes, documents, archives, fonts, others]
 *         description: 文件分类（与namespace二选一）
 *     responses:
 *       200:
 *         description: 获取文件详情成功
 *         content:
 *           application/json:
 *             example: { "code": 200, "message": "获取文件详情成功", "file": { "name": "xxx.jpg", "size": 1024, "url": "https://hanphone.top/images/xxx.jpg" } }
 *       400:
 *         description: 参数错误（缺少文件名或命名空间/分类）
 *       401:
 *         description: 缺少或无效的访问令牌
 *       404:
 *         description: 文件不存在
 *       500:
 *         description: 获取文件详情时发生错误
 */
// 获取文件详情接口
app.get("/file", authenticateToken, async (req, res) => {
  try {
    const { filename, namespace, category } = req.query;
    if (!filename || (!namespace && !category)) {
      return res.status(400).json({ error: "请提供文件名和命名空间或分类" });
    }

    const targetDir = getFullStoragePath(category, namespace, "", "");
    const filePath = path.join(targetDir, filename);

    if (!(await fileExists(filePath))) {
      return res
        .status(404)
        .json({ error: "文件不存在", filename, namespace, category });
    }

    const stats = await fs.stat(filePath);
    const ext = path.extname(filename).toLowerCase();
    let fileCategory = getFileCategory("", filename);

    let urlPath = "";
    if (namespace) {
      const encodedNamespace = encodeURIComponent(namespace);
      const encodedFilename = encodeURIComponent(filename);
      urlPath = `${encodedNamespace}/${encodedFilename}`;
    } else {
      const encodedCategory = encodeURIComponent(category);
      const encodedFilename = encodeURIComponent(filename);
      urlPath = `${encodedCategory}/${encodedFilename}`;
    }

    res.json({
      code: 200,
      message: "获取文件详情成功",
      file: {
        name: filename,
        originalName: filename,
        size: stats.size,
        mtime: stats.mtime,
        birthtime: stats.birthtime,
        extension: ext,
        category: fileCategory,
        namespace: namespace || null,
        url: `https://hanphone.top/${urlPath}`,
        mimetype: extensionToCategory[ext]
          ? `${extensionToCategory[ext]}/${ext.substring(1)}`
          : "application/octet-stream",
      },
    });
  } catch (err) {
    logger.error("获取文件详情失败:", { error: err.message, stack: err.stack, filename: req.query.filename });
    res.status(500).json({ error: "获取文件详情时发生错误" });
  }
});

// 创建目录接口
app.post("/directory", authenticateToken, async (req, res) => {
  try {
    const { name, parentNamespace } = req.body;
    if (!name) {
      return res.status(400).json({ error: "请提供目录名称" });
    }
    let parentDir = baseUploadDir;
    if (parentNamespace) {
      parentDir = path.join(baseUploadDir, parentNamespace);
      if (!(await fileExists(parentDir))) {
        return res
          .status(404)
          .json({ error: "父命名空间不存在", parentNamespace });
      }
    }
    const newDirPath = path.join(parentDir, name);
    if (await fileExists(newDirPath)) {
      return res
        .status(409)
        .json({ error: "目录已存在", directoryName: name, parentNamespace });
    }
    await fs.mkdir(newDirPath, { recursive: true });
    res.json({
      code: 200,
      message: "目录创建成功",
      directoryName: name,
      parentNamespace,
      path: newDirPath,
    });
  } catch (err) {
    logger.error("创建目录失败:", { error: err.message, stack: err.stack, directoryName: req.body.name });
    res.status(500).json({ error: "创建目录时发生错误" });
  }
});

// 【新增】定义可以在浏览器中直接预览的文件扩展名集合
// 使用 Set 可以提高查找效率
const previewableExtensions = new Set([
  // 图片
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".bmp",
  ".svg",
  ".webp",
  ".avif",
  ".apng",
  // PDF
  ".pdf",
  // 音频
  ".mp3",
  ".wav",
  ".ogg",
  ".flac",
  ".aac",
  // 视频
  ".mp4",
  ".webm",
  ".ogg",
  ".mov",
  ".avi",
  ".mkv",
]);

// 提供文件静态访问
app.use(
  "/",
  express.static(baseUploadDir, {
    maxAge: "7d", // 延长缓存时间至7天
    etag: true, // 启用etag支持
    lastModified: true, // 启用last-modified支持
    index: false, // 禁用目录索引
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath).toLowerCase();

      // 【修改】扩展了 mimeTypes 映射，特别是增加了音频类型，以确保浏览器能正确识别
      const mimeTypes = {
        ".json": "application/json",
        ".pdf": "application/pdf",
        ".zip": "application/zip",
        ".txt": "text/plain",
        ".md": "text/markdown",
        ".html": "text/html",
        ".css": "text/css",
        ".js": "application/javascript",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".svg": "image/svg+xml",
        ".webp": "image/webp", // 补充 webp
        ".bmp": "image/bmp", // 补充 bmp
        ".avif": "image/avif", // 补充 avif
        ".mp4": "video/mp4",
        ".avi": "video/x-msvideo",
        ".webm": "video/webm",
        ".mov": "video/quicktime",
        ".mkv": "video/x-matroska",
        // 【新增】音频 MIME 类型，对预览至关重要
        ".mp3": "audio/mpeg",
        ".wav": "audio/wav",
        ".ogg": "audio/ogg",
        ".flac": "audio/flac",
        ".aac": "audio/aac",
      };

      if (mimeTypes[ext]) {
        res.setHeader("Content-Type", mimeTypes[ext]);
      }

      // 优化缓存头设置
      res.setHeader("Cache-Control", "public, max-age=604800");
      res.setHeader("X-Content-Type-Options", "nosniff");

      const fileName = path.basename(filePath);
      const encodedFileName = encodeURIComponent(fileName);

      // 【核心修改】根据URL参数和文件扩展名决定是预览还是下载
      const url = new URL(res.req.url, `http://${res.req.headers.host}`);
      const isDownload =
        url.searchParams.has("download") &&
        url.searchParams.get("download") === "1";

      if (isDownload) {
        // 如果URL中包含download=1参数，强制下载
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`
        );
      } else if (previewableExtensions.has(ext)) {
        // 对于可预览的文件，设置为 inline，浏览器会尝试在窗口内打开
        res.setHeader(
          "Content-Disposition",
          `inline; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`
        );
      } else {
        // 对于其他文件，保持 attachment，强制浏览器下载
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`
        );
      }
    },
  })
);

// 【修改 4】错误处理中间件，更新提示信息
app.use((err, req, res, next) => {
  logger.error("服务器错误:", { 
    error: err.message, 
    stack: err.stack, 
    path: req.path,
    method: req.method 
  });
  
  if (err.code === "LIMIT_FILE_SIZE") {
    // 根据请求路径返回不同的错误信息
    if (req.path === "/upload/avatar") {
      return res.status(413).json({ error: "头像文件大小超过限制（最大5MB）" });
    }
    return res.status(413).json({ error: "文件大小超过限制（最大1GB）" });
  }
  res.status(500).json({ error: "服务器内部错误" });
});

app.listen(PORT, () => {
  logger.info(`服务器启动成功`, { 
    port: PORT, 
    env: process.env.NODE_ENV || 'development',
    uploadDir: baseUploadDir 
  });
});
