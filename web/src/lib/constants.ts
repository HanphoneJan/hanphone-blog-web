/**
 * 项目魔法值配置
 * 数值、配置、路径等非文案常量
 * 文案类常量见 @/lib/labels
 */

// ==================== HTTP/API 状态码 ====================
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
} as const

// API 响应状态码
export const API_CODE = {
  SUCCESS: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  SERVER_ERROR: 500
} as const

// ==================== 时间常量（毫秒） ====================
export const TIME = {
  // API 请求超时时间
  API_TIMEOUT: 10000,

  // 文件上传超时时间（大文件/弱网环境需要远大于普通请求的超时）
  UPLOAD_TIMEOUT: 600000,
  
  // 提示框默认显示时长
  ALERT_DURATION: 3000,
  
  // 倒计时间隔
  COUNTDOWN_INTERVAL: 1000,
  
  // 动画持续时间
  ANIMATION_DURATION: 300,
  
  // 长按触发时间
  LONG_PRESS_DURATION: 500,
  
  // 成功后关闭延迟
  SUCCESS_CLOSE_DELAY: 1000,
  
  // 密码重置成功后延迟
  PASSWORD_RESET_DELAY: 1500,
  
  // 主题切换过渡时间
  THEME_TRANSITION_DURATION: 300,
  
  // Token 过期阈值（提前1分钟刷新）
  TOKEN_EXPIRE_THRESHOLD: 60000,
  
  // Alert 初始化延迟
  ALERT_INIT_DELAY: 100,
  
  // 防抖延迟
  DEBOUNCE_DELAY: 300,
  
  // 拖拽移动阈值
  DRAG_MOVE_THRESHOLD: 3,

  // 加载条持续时间
  LOADING_BAR_DURATION: 800
} as const

// ==================== 图片处理常量 ====================
export const IMAGE = {
  // 最大宽度
  MAX_WIDTH: 1200,
  
  // 最大高度
  MAX_HEIGHT: 1200,
  
  // 压缩质量 (0-1)
  COMPRESS_QUALITY: 0.8,
  
  // 转换阈值（小于此大小的图片也会转换）
  CONVERT_SIZE: 102400, // 100KB
  
  // 头像尺寸
  AVATAR_SIZE: 144,
  
  // 默认 MIME 类型
  DEFAULT_MIME_TYPE: 'image/jpeg',
  
  // 默认扩展名
  DEFAULT_EXTENSION: 'jpeg',

  // OG 图片尺寸
  OG_IMAGE_WIDTH: 1200,
  OG_IMAGE_HEIGHT: 630
} as const

// ==================== 响应式断点（像素） ====================
export const BREAKPOINT = {
  XS: 576,
  SM: 768,
  MD: 992,
  LG: 1200
} as const

// ==================== Live2D 配置 ====================
export const LIVE2D = {
  // 移动端是否显示（环境变量 NEXT_PUBLIC_LIVE2D_MOBILE: "true" | "false"，默认 true）
  MOBILE_VISIBLE: process.env.NEXT_PUBLIC_LIVE2D_MOBILE !== 'false',

  // 默认尺寸
  DEFAULT_WIDTH: 220,
  DEFAULT_HEIGHT: 320,

  // 不同断点下的尺寸配置
  DIMENSIONS: {
    XS: { width: 120, height: 190 },
    SM: { width: 150, height: 210 },
    MD: { width: 180, height: 260 },
    LG: { width: 220, height: 320 }
  },

  // 按钮尺寸
  BUTTON_SIZE: 24,
  BUTTON_OFFSET: 5,

  // Z-Index
  Z_INDEX: 9999,
  IFRAME_Z_INDEX: 100,
  BUTTON_Z_INDEX: 101,

  // === 消息相关 ===

  // 消息显示时长（毫秒）
  MESSAGE_DURATION: 5000,

  // 同选择器 hover 再次触发的冷却时间（毫秒）
  HOVER_COOLDOWN: 10000,

  // 初始定位偏移（距右下角）
  INITIAL_POSITION_X_OFFSET: 260,
  INITIAL_POSITION_Y_OFFSET: 380,

  // 隐藏后重新显示的等待时间（24小时）
  HIDE_DURATION: 86400000,

  // 页面特定交互的延迟触发（毫秒）
  PAGE_INTERACTION_DELAY: 1000,
  PAGE_INTERACTION_DELAY_LONG: 1500,
  DOC_SIDEBAR_DELAY: 2000,

  // 欢迎消息延迟
  WELCOME_DELAY: 2500,

  // 博客上下文消息延迟
  ARTICLE_CONTEXT_DELAY: 3500,

  // 消息优先级（数值越大优先级越高）
  PRIORITY: {
    WELCOME: 11,
    MODEL_SWITCH: 10,
    ARTICLE_CONTEXT: 10,
    PAGE_WELCOME: 10,
    IDLE: 9,
    COPY: 9,
    HITOKOTO: 9,
    PHOTO: 9,
    TAP_BODY: 9,
    VISIBILITY: 9,
    MOUSEOVER: 8,
    CLICK: 8,
    SCROLL_DEPTH: 7,
    COMMENT_FOCUS: 7,
    DOC_SIDEBAR: 7,
    ABOUT_SECTION: 7,
  },

  // 空闲消息检测间隔
  ACTIVITY_CHECK_INTERVAL: 1000,
  IDLE_MESSAGE_INTERVAL: 20000,

  // 滚动深度消息的触发阈值
  SCROLL_DEPTH_THRESHOLDS: [0.3, 0.7, 1.0] as readonly number[],
} as const

// ==================== Z-Index 层级 ====================
export const Z_INDEX = {
  MODAL: 1100,
  DROPDOWN: 50,
  HEADER_DROPDOWN: 50,
  ALERT: 2000,
  LIVE2D: 9999,
  MAX_HOVER: 96
} as const

// ==================== 表单验证规则 ====================
export const VALIDATION = {
  // 用户名长度
  USERNAME_MIN: 2,
  USERNAME_MAX: 30,
  
  // 昵称长度
  NICKNAME_MIN: 2,
  NICKNAME_MAX: 20,
  // 个人信息编辑时昵称最大长度（与注册不同）
  NICKNAME_MAX_PROFILE: 10,
  
  // 密码长度
  PASSWORD_MIN: 6,
  PASSWORD_MAX: 20,
  // 可选密码修改时的最大长度（如修改密码、重置密码）
  PASSWORD_MAX_OPTIONAL: 10,
  
  // 验证码长度
  CAPTCHA_LENGTH: 6,
  
  // 邮箱正则（标准格式，区分大小写）
  EMAIL_REGEX: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  // 邮箱正则（简化格式，用于快速校验）
  EMAIL_REGEX_SIMPLE: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // 验证码有效期（秒）
  CAPTCHA_COUNTDOWN: 60
} as const

// ==================== 主题颜色 ====================
export const THEME_COLORS = {
  // 主题背景色
  BACKGROUND: {
    light: '#f8fafc',
    dark: '#111827',
    macaron: '#fff7fa',
    cyber: '#04040a'
  },
  
  // 默认友链颜色
  DEFAULT_LINK_COLOR: '#1890ff',
  
  // 代码块背景
  CODE_BLOCK_BG: '#282a36'
} as const

// ==================== 图表颜色配置 ====================
export const CHART_COLORS = {
  // 主题配色方案
  light: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
  dark: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
  macaron: ['#ec4899', '#a855f7', '#f43f5e', '#db2777', '#f472b6'],
  cyber: ['#06b6d4', '#22d3ee', '#0891b2', '#67e8f9', '#06b6d4'],
  
  // 扩展配色（用于标签图表）
  lightExtended: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#6366f1'],
  darkExtended: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#6366f1'],
  macaronExtended: ['#ec4899', '#a855f7', '#f43f5e', '#db2777', '#f472b6', '#e879f9'],
  cyberExtended: ['#06b6d4', '#22d3ee', '#0891b2', '#67e8f9', '#06b6d4', '#22d3ee'],
  
  // 博客图表配色
  blogChart: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899']
} as const

// ==================== 图表 Tooltip 主题配色 ====================
export const CHART_TOOLTIP_THEMES = {
  light: {
    tooltipBg: 'rgba(255, 255, 255, 0.95)',
    tooltipBorder: 'rgba(226, 232, 240, 0.8)',
    tooltipText: '#1e293b',
    itemBorder: 'rgba(0, 0, 0, 0.1)'
  },
  dark: {
    tooltipBg: 'rgba(15, 23, 42, 0.95)',
    tooltipBorder: 'rgba(51, 65, 85, 0.8)',
    tooltipText: '#e2e8f0',
    itemBorder: 'rgba(255, 255, 255, 0.1)'
  },
  macaron: {
    tooltipBg: 'rgba(255, 245, 250, 0.95)',
    tooltipBorder: 'rgba(244, 114, 182, 0.5)',
    tooltipText: '#4c1d95',
    itemBorder: 'rgba(76, 29, 149, 0.2)'
  },
  cyber: {
    tooltipBg: 'rgba(15, 25, 40, 0.95)',
    tooltipBorder: 'rgba(34, 211, 238, 0.5)',
    tooltipText: '#f1f5f9',
    itemBorder: 'rgba(34, 211, 238, 0.3)'
  }
} as const

// ==================== 地图颜色配置 ====================
export const MAP_COLORS = {
  light: {
    labelColor: '#475569',
    legendColor: '#475569',
    visualMapColor: '#475569',
    tooltipText: '#1e293b',
    pieces: [
      { gte: 50, label: '>= 50', color: '#dc2626' },
      { gte: 30, lte: 49, label: '30 - 49', color: '#ea580c' },
      { gte: 10, lte: 29, label: '10 - 29', color: '#2563eb' },
      { gte: 1, lte: 9, label: '1 - 9', color: '#16a34a' }
    ]
  },
  dark: {
    labelColor: '#cbd5e1',
    legendColor: '#cbd5e1',
    visualMapColor: '#cbd5e1',
    tooltipText: '#f8fafc',
    pieces: [
      { gte: 50, label: '>= 50', color: '#ff416c' },
      { gte: 30, lte: 49, label: '30 - 49', color: '#ff8c00' },
      { gte: 10, lte: 29, label: '10 - 29', color: '#38bdf8' },
      { gte: 1, lte: 9, label: '1 - 9', color: '#4ade80' }
    ]
  },
  macaron: {
    labelColor: '#762995',
    legendColor: '#762995',
    visualMapColor: '#762995',
    tooltipText: '#4c1d95',
    pieces: [
      { gte: 50, label: '>= 50', color: '#dc2626' },
      { gte: 30, lte: 49, label: '30 - 49', color: '#ec4899' },
      { gte: 10, lte: 29, label: '10 - 29', color: '#f472b6' },
      { gte: 1, lte: 9, label: '1 - 9', color: '#a855f7' }
    ]
  },
  cyber: {
    labelColor: '#f1f5f9',
    legendColor: '#f1f5f9',
    visualMapColor: '#f1f5f9',
    tooltipText: '#f1f5f9',
    pieces: [
      { gte: 50, label: '>= 50', color: '#f43f5e' },
      { gte: 30, lte: 49, label: '30 - 49', color: '#f97316' },
      { gte: 10, lte: 29, label: '10 - 29', color: '#06b6d4' },
      { gte: 1, lte: 9, label: '1 - 9', color: '#22d3ee' }
    ]
  }
} as const

// ==================== 用户类型 ====================
export const USER_TYPE = {
  NORMAL: 0,
  ADMIN: 1,
  ADMIN_STRING: '1'
} as const

// ==================== 默认地理位置 ====================
export const DEFAULT_LOCATION = {
  loginLat: 30.27,
  loginLng: 103.08,
  loginProvince: '',
  loginCity: ''
} as const

// ==================== 本地存储键名 ====================
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER_INFO: 'userInfo',
  REFRESH_TOKEN: 'refreshToken',
  EXPIRE: 'expire',
  THEME: 'theme',
  // 管理后台当前选中的导航路径
  ACTIVE_PATH: 'activePath',
  // 自定义背景（值: "default" | "url:https://..." | "data:image/...;base64,..."）
  BACKGROUND_CUSTOM: 'blog_background',
  // 背景透明度（0-100）
  BACKGROUND_OPACITY: 'blog_bg_opacity',
  // 背景遮罩强度（0-100）
  BACKGROUND_OVERLAY: 'blog_bg_overlay',
  // 音乐播放器状态
  MUSIC_PLAYER_STATE: 'music_player_state'
} as const

// ==================== 背景配置 ====================
export const BACKGROUND_CONFIG = {
  // 透明度默认值(百分比 0-100)
  DEFAULT_OPACITY: 80,
  DARK_OPACITY: 50,
  CUSTOM_OPACITY: 60,
  DARK_CUSTOM_OPACITY: 30,
  
  // 遮罩强度默认值(百分比 0-100)
  DEFAULT_OVERLAY: 90,
  DARK_OVERLAY: 40,
  
  // 透明度范围
  MIN_OPACITY: 10,
  MAX_OPACITY: 100,
  
  // 遮罩强度范围
  MIN_OVERLAY: 0,
  MAX_OVERLAY: 100,
  
  // 文件上传限制
  MAX_INPUT_BYTES: 5 * 1024 * 1024,
  MAX_STORED_BYTES: 800 * 1024,
  COMPRESS_QUALITY: 0.85,
  COMPRESS_MAX_WIDTH: 1920,
  COMPRESS_MAX_HEIGHT: 1080,
  
  // 事件名称
  CHANGE_EVENT: 'blog-bg-change',
  OPACITY_CHANGE_EVENT: 'blog-bg-opacity-change',
  OVERLAY_CHANGE_EVENT: 'blog-bg-overlay-change'
}

// ==================== API 请求参数名 ====================
export const API_PARAMS = {
  TYPE_ID: 'typeId',
  PAGE_NUM: 'pagenum',
  PAGE_SIZE: 'pagesize',
  QUERY: 'query'
} as const

// ==================== 路由/路径 ====================
export const ROUTES = {
  // 首页
  HOME: '/',
  // 博客列表
  BLOG_LIST: '/blog',
  // 博客详情（传入 id）
  BLOG_DETAIL: (id: number) => `/blog/${id}`,
  // 带分类筛选的博客列表
  BLOG_LIST_WITH_TYPE: (typeId: number) => `/blog?typeId=${typeId}`,
  // 管理后台默认首页
  ADMIN_DEFAULT: '/admin/',
  // 管理后台子路径
  ADMIN_BLOG_INPUT: '/admin/blog-input',
  ADMIN_BLOGS: '/admin/blogs',
  ADMIN_TYPES: '/admin/types',
  ADMIN_TAGS: '/admin/tags',
  ADMIN_ESSAYS: '/admin/essays',
  ADMIN_COMMENTS: '/admin/comments',
  ADMIN_PROJECTS: '/admin/projects',
  ADMIN_BLOG_FILES: '/admin/blog-files',
  ADMIN_DOCS: '/admin/docs',
  ADMIN_USERS: '/admin/users',
  ADMIN_LINKS: '/admin/links',
  ADMIN_PERSONAL: '/admin/personal',
  TERMS: '/terms',
  PRIVACY: '/privacy'
} as const

// ==================== 静态资源路径 ====================
export const ASSETS = {
  DEFAULT_AVATAR: '/default-avatar.png',
  BACKGROUND_WEBP: '/background.webp',
  BACKGROUND_JPEG: '/background.jpeg'
} as const

// ==================== 页脚/联系信息 ====================
// 通过环境变量读取，需在 .env 文件中配置
// NEXT_PUBLIC_FOOTER_QR_IMAGE: 公众号二维码图片地址
// NEXT_PUBLIC_FOOTER_EMAIL: 联系邮箱
// NEXT_PUBLIC_FOOTER_GITHUB: GitHub 链接
// NEXT_PUBLIC_FOOTER_BILIBILI: Bilibili 链接
// NEXT_PUBLIC_FOOTER_ICP_URL: ICP 备案链接
// NEXT_PUBLIC_FOOTER_ICP_NUMBER: ICP 备案号
// NEXT_PUBLIC_FOOTER_PSB_URL: 公安备案链接
// NEXT_PUBLIC_FOOTER_PSB_NUMBER: 公安备案号
export const FOOTER_CONFIG = {
  QR_IMAGE: process.env.NEXT_PUBLIC_FOOTER_QR_IMAGE || 'https://hanphone.top/images/云林有风公众号.jpg',
  EMAIL: process.env.NEXT_PUBLIC_FOOTER_EMAIL || 'janhizian@qq.com',
  GITHUB: process.env.NEXT_PUBLIC_FOOTER_GITHUB || 'https://github.com/HanphoneJan/',
  BILIBILI: process.env.NEXT_PUBLIC_FOOTER_BILIBILI || 'https://space.bilibili.com/649062555/',
  ICP_URL: process.env.NEXT_PUBLIC_FOOTER_ICP_URL || 'https://beian.miit.gov.cn/',
  ICP_NUMBER: process.env.NEXT_PUBLIC_FOOTER_ICP_NUMBER || '粤ICP备2024325722号-2',
  PSB_URL: process.env.NEXT_PUBLIC_FOOTER_PSB_URL || 'https://beian.mps.gov.cn/#/query/webSearch?code=44128302000378',
  PSB_NUMBER: process.env.NEXT_PUBLIC_FOOTER_PSB_NUMBER || '粤公网安备44128302000378号'
} as const

// ==================== 分页配置 ====================
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  HOME_BLOG_PAGE_SIZE: 5,
  // 博客列表页每页数量
  BLOG_PAGE_SIZE: 12,
  // 博客列表页后续页每页数量（更大的 pageSize）
  BLOG_PAGE_SIZE_LARGE: 12,
  // 分页器显示省略号阈值（少于等于该数量时显示全部页码）
  ELLIPSIS_THRESHOLD: 5
} as const

// ==================== 个人主页配置 ====================
export const PERSONAL_CONFIG = {
  INIT_SCREEN_WIDTH: 1200,
  DEFAULT_SECTION_ID: '#info',
  CACHE_DURATION_MS: 5 * 60 * 1000
} as const

// ==================== 首页配置 ====================
export const HOME_CONFIG = {
  // 侧边栏自动关闭的屏幕断点（px）
  SIDEBAR_CLOSE_BREAKPOINT: 1024,
  // 初始屏幕宽度（SSR 用）
  INIT_SCREEN_WIDTH: 1200,
  // 缓存过期时间（毫秒）
  CACHE_EXPIRY_MS: 10 * 60 * 1000,
  // 打字机效果间隔（毫秒）
  TYPEWRITER_INTERVAL: 150,
  // 打字机重置延迟（毫秒）
  TYPEWRITER_RESET_DELAY: 3000,
  // 打字机初始延迟（毫秒）
  TYPEWRITER_INIT_DELAY: 200,
  // Hero 区域打字机效果专用配置
  TYPEWRITER_CHAR_DELAY: 150,
  TYPEWRITER_DELETE_DELAY: 100,
  TYPEWRITER_PAUSE_AFTER_DELETE: 2000,
  TYPEWRITER_START_DELAY: 1200,
  // 获取全部博客时的每页数量（用于筛选场景）
  ALL_BLOGS_PAGE_SIZE: 1000,
  // 分页紧凑布局断点（px）
  PAG_COMPACT_BREAKPOINT: 768
} as const

// ==================== 博客列表页配置 ====================
export const BLOG_LIST_CONFIG = {
  // 加载骨架屏数量
  SKELETON_COUNT: 6,
  // 侧栏二级导航最多展示博客数
  SUB_NAV_LIMIT: 10,
  // 获取分类下博客时的每页数量
  TYPE_BLOGS_PAGE_SIZE: 12
} as const

// ==================== 图表配置 ====================
export const CHART_CONFIG = {
  // 动画持续时间
  ANIMATION_DURATION: 2800,
  // 动画缓动
  ANIMATION_EASING: 'cubicInOut',
  // 边框宽度
  BORDER_WIDTH: 1.5,
  // 阴影模糊
  SHADOW_BLUR: 10,
  // 字体大小
  FONT_SIZE: 12,
  // 小屏幕字体大小
  SMALL_FONT_SIZE: 10,
  // 小屏幕断点
  SMALL_SCREEN_BREAKPOINT: 400,
  // 分类图表：最多展示的分类数量
  MAX_CATEGORIES_DISPLAY: 4,

  // 标签云默认容器尺寸
  TAG_CLOUD_WIDTH: 400,
  TAG_CLOUD_HEIGHT: 300,

  // 标签云 3D 球体参数
  TAG_CLOUD_RADIUS: 112,
  TAG_CLOUD_DISTANCE: 187
} as const
