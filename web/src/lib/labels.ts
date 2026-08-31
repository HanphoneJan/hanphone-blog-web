/**
 * 项目 UI 文案配置
 * 提取魔法文字，便于维护与国际化
 */

// ==================== 博客列表页 ====================
export const BLOG_LABELS = {
  NAV_TITLE: '博客导航',
  ALL_CATEGORIES: '全部分类',
  ALL: '全部',
  NO_ARTICLES: '暂无博客',
  VIEW_ALL: '查看全部博客',
  EXPAND: '展开',
  COLLAPSE: '收起',
  ARTICLE_COUNT: (count: number) => `共 ${count} 篇`
} as const

// ==================== 首页 ====================
export const HOME_LABELS = {
  ALL_BLOGS: '全部博客',
  VIEWS_COUNT: (count: number) => `${count} 次浏览`,
  INTRO_TYPING: '欢迎来到寒枫的博客......'
} as const

// ==================== 博客详情页 ====================
export const BLOG_DETAIL_LABELS = {
  CODE_COPIED: '代码已复制',
  REPLY_PLACEHOLDER: '请输入回复内容',
  FETCH_BLOG_FAIL: '获取博客信息失败',
  COMMENT_EMPTY: '请输入评论内容',
  COMMENT_MAX_LENGTH: '评论内容不能超过1000字',
  LOGIN_TO_COMMENT: '请先登录后再评论',
  COMMENT_SUCCESS: '评论成功',
  COMMENT_FAIL: '评论失败',
  COMMENT_FAIL_RETRY: '评论失败，请稍后再试',
  DELETE_SUCCESS: '删除成功',
  DELETE_FAIL: '删除失败',
  DELETE_FAIL_RETRY: '删除失败，请稍后再试',
  LOGIN_TO_LIKE: '请先登录后再点赞',
  OPERATION_FAIL: '操作失败',
  OPERATION_FAIL_RETRY: '操作失败，请稍后再试',
  LINK_COPIED: '链接已复制到剪贴板',
  COPY_LINK_FAIL: '复制失败，请手动复制链接',
  SHARE_UNAVAILABLE: '分享功能暂时不可用',
  CONTENT_COPIED: '博客内容已复制到剪贴板',
  COPY_CONTENT_FAIL: '复制失败，请手动复制',
  COPY_UNAVAILABLE: '复制功能暂时不可用',
  LOGIN_TO_REPLY: '请输入回复内容'
} as const

// ==================== 留言页 ====================
export const MESSAGE_LABELS = {
  SEND_SUCCESS: '留言发表成功',
  SEND_FAIL: '留言发表失败！',
  REPLY_NOT_FOUND: '回复的留言不存在',
  REPLY_SUCCESS: '回复成功',
  REPLY_FAIL: '回复失败！',
  DELETE_SUCCESS: '删除成功',
  DELETE_FAIL: '删除失败',
  DELETE_FAIL_RETRY: '删除失败，请稍后再试'
} as const

// ==================== 随笔页 ====================
export const ESSAY_LABELS = {
  LOGIN_TO_LIKE: '请先登录再点赞',
  LOGIN_TO_COMMENT: '请先登录再评论',
  LOGIN_TO_REPLY: '请先登录再回复',
  COMMENT_EMPTY: '评论内容不能为空',
  REPLY_EMPTY: '回复内容不能为空',
  COMMENT_SUCCESS: '评论成功',
  COMMENT_FAIL: '评论失败，请重试',
  REPLY_SUCCESS: '回复成功',
  REPLY_FAIL: '回复失败，请重试',
  NO_DELETE_PERMISSION: '没有权限删除评论',
  DELETE_SUCCESS: '删除成功',
  DELETE_FAIL: '删除失败，请重试',
  OPERATION_FAIL: '操作失败，请重试'
} as const

// ==================== 友链页 ====================
export const LINK_PAGE_LABELS = {
  ALL_TYPES: '全部类型',
  FRIEND_LINK: '友情链接',
  TOOL_LINK: '工具链接',
  BLOG_LINK: '博客链接',
  RESOURCE_LINK: '资源链接',
  SORT_BY_NAME: '按名称排序',
  SORT_BY_DATE: '按日期排序',
  SORT_BY_RECOMMENDED: '按推荐排序'
} as const

// ==================== 项目页 ====================
export const PROJECT_LABELS = {
  FULL_PROJECT: '完整项目',
  TOOLBOX: '工具箱',
  MINI_GAME: '小游戏',
  MINI_EXERCISE: '小练习',
  HIDDEN: '未展示'
} as const

// ==================== 错误页 ====================
export const ERROR_LABELS = {
  UNKNOWN_ERROR: '发生未知错误',
  ACCESS_ERROR: '访问错误',
  BACK_HOME: '返回首页'
} as const

// ==================== 页脚 ====================
export const FOOTER_LABELS = {
  CONTACT_ME: '联系我',
  SCAN_QR: '扫码关注公众号',
  BLOG_INTRO: '博客简介',
  BLOG_INTRO_DESC: '专注于分享技术心得与生活感悟，不骛于虚声，不驰于空想。\n在这里，你可以找到有价值的思考与实践经验。',
  TAG_FULLSTACK: '全栈开发',
  TAG_TECH: '技术思考',
  TAG_LIFE: '生活感悟',
  TAG_PRACTICE: '实践经验',
  SITE_STATS: '站点数据',
  TOTAL_VISITS: '总访问量',
  DATA_LOAD_FAIL: '数据加载失败',
  VISITS_COUNT: '次访问',
  TERMS: '用户协议',
  PRIVACY: '隐私条款',
  ICP_PREFIX: '备案号：',
  COPYRIGHT: (year: number) => `© ${year} By Hanphone. All rights reserved.`
} as const

// ==================== 管理后台导航 ====================
export const ADMIN_NAV_LABELS = {
  HOME: '后台首页',
  WRITE_BLOG: '撰写博客',
  BLOG_MANAGE: '博客管理',
  TYPE_MANAGE: '分类管理',
  TAG_MANAGE: '标签管理',
  ESSAY_MANAGE: '随笔管理',
  COMMENT_MANAGE: '评论管理',
  PROJECT_MANAGE: '项目管理',
  FILE_MANAGE: '文件管理',
  DOC_MANAGE: '文库管理',
  USER_MANAGE: '用户管理',
  LINK_MANAGE: '友链管理',
  PERSONAL_CENTER: '个人中心'
} as const

// ==================== 个人主页 ====================
export const PERSONAL_LABELS = {
  FETCH_FAIL: 'Failed to fetch data'
} as const

// ==================== 头部搜索 ====================
export const HEADER_LABELS = {
  SEARCH_FAIL: '获取搜索结果失败，请稍后再试'
} as const

// ==================== 图表配置（用户可见文案）====================
export const CHART_OTHERS_LABEL = '其他'

// ==================== 通用提示 ====================
export const COMMON_LABELS = {
  OPERATION_FAIL: '操作失败，请重试',
  IMAGE_UPLOAD_SUCCESS: '图片压缩并上传成功',
  IMAGE_UPLOAD_FAIL: '图片上传失败',
  IMAGE_COMPRESS_FAIL: '图片压缩失败，请重试',
  FETCH_FAIL: '获取失败',
  SAVE_SUCCESS: '保存成功',
  SAVE_FAIL: '保存失败',
  DELETE_SUCCESS: '删除成功',
  DELETE_FAIL: '删除失败',
  UPDATE_SUCCESS: '更新成功',
  UPDATE_FAIL: '更新失败'
} as const

// ==================== 管理后台 - 友链 ====================
export const ADMIN_LINK_LABELS = {
  FETCH_LIST_FAIL: '获取友链列表失败',
  IMAGE_UPLOAD_SUCCESS: '图片压缩并上传成功',
  IMAGE_UPLOAD_FAIL: '图片上传失败',
  IMAGE_COMPRESS_FAIL: '图片压缩失败，请重试',
  NAME_REQUIRED: '请输入友链名称',
  TYPE_REQUIRED: '请选择友链类型',
  URL_REQUIRED: '请输入友链链接',
  PUBLISH_SUCCESS: '友链发布成功',
  PUBLISH_FAIL: '友链发布失败',
  DELETE_SUCCESS: '友链删除成功',
  DELETE_FAIL: '友链删除失败',
  UPDATE_SUCCESS: '友链更新成功',
  UPDATE_FAIL: '友链更新失败',
  OPERATION_FAIL: '操作失败，请重试',
  RECOMMEND_SUCCESS: '推荐成功',
  RECOMMEND_FAIL: '推荐失败',
  UNRECOMMEND_SUCCESS: '取消推荐成功',
  UNRECOMMEND_FAIL: '取消推荐失败'
} as const

// ==================== 管理后台 - 用户 ====================
export const ADMIN_USER_LABELS = {
  FETCH_FAIL: '获取用户信息失败！',
  PERMISSION_CHANGE_FAIL: '修改权限失败',
  DELETE_FAIL: '删除用户失败！',
  DELETE_SUCCESS: '删除用户成功！',
  AVATAR_UPLOAD_SUCCESS: '头像上传成功',
  AVATAR_UPLOAD_FAIL: '头像上传失败',
  NICKNAME_REQUIRED: '昵称不能为空',
  EMAIL_REQUIRED: '邮箱不能为空',
  EMAIL_INVALID: '请输入有效的邮箱地址',
  UPDATE_FAIL: '更新用户信息失败！',
  UPDATE_SUCCESS: '更新用户信息成功！'
} as const

// ==================== 管理后台 - 个人资料 ====================
export const ADMIN_PERSONAL_LABELS = {
  FETCH_FAIL: '获取个人资料数据失败',
  AVATAR_UPLOAD_FAIL: '头像上传失败',
  AVATAR_REQUIRED: '请先上传头像',
  AVATAR_UPDATE_SUCCESS: '头像更新成功',
  AVATAR_UPDATE_FAIL: '更新头像失败',
  USER_INFO_REQUIRED: '未获取到用户信息',
  INFO_UPDATE_SUCCESS: '信息更新成功',
  INFO_UPDATE_FAIL: '更新用户信息失败',
  PASSWORD_RESET_SUCCESS: '密码重置成功',
  PASSWORD_RESET_FAIL: '重置密码失败',
  ADD_SUCCESS: '添加成功',
  ADD_FAIL: '添加失败',
  MODIFY_SUCCESS: '修改成功',
  MODIFY_FAIL: '修改失败',
  DELETE_SUCCESS: '删除成功',
  DELETE_FAIL: '删除失败',
  ADD_FAIL_MSG: (msg: string) => `添加失败: ${msg}`,
  MODIFY_FAIL_MSG: (msg: string) => `修改失败: ${msg}`,
  DELETE_FAIL_MSG: (msg: string) => `删除失败: ${msg}`
} as const

// ==================== 管理后台 - 评论 ====================
export const ADMIN_COMMENT_LABELS = {
  FETCH_LIST_FAIL: '获取评论列表失败',
  DELETE_SUCCESS: '评论删除成功',
  DELETE_FAIL: '删除评论失败'
} as const

// ==================== 管理后台 - 博客 ====================
export const ADMIN_BLOG_LABELS = {
  OPERATION_FAIL: '操作失败，请重试',
  FETCH_LIST_FAIL: '获取博客列表失败',
  FETCH_TYPE_FAIL: '获取分类列表失败',
  FETCH_TAG_FAIL: '获取标签列表失败',
  DELETE_CONFIRM: '删除',
  DELETE_SUCCESS: '删除博客成功',
  DELETE_FAIL: '删除博客失败',
  MODIFY_SUCCESS: '修改博客成功',
  MODIFY_FAIL: '修改博客失败',
  TYPE_REQUIRED: '请选择有效的分类',
  TYPE_CHANGE_SUCCESS: '修改分类成功',
  TYPE_CHANGE_FAIL: '修改分类失败',
  FLAG_CHANGE_SUCCESS: '修改博客类型成功',
  FLAG_CHANGE_FAIL: '修改博客类型失败',
  TAG_ADD_SUCCESS: '添加标签成功',
  TAG_ADD_FAIL: '添加标签失败',
  TAG_DELETE_SUCCESS: '删除标签成功',
  TAG_DELETE_FAIL: '删除标签失败',
  IMAGE_FORMAT: '请上传JPG、PNG或WEBP格式的图片',
  IMAGE_SIZE: '图片大小不能超过5MB',
  IMAGE_UPLOAD_SUCCESS: '图片压缩并上传成功',
  IMAGE_UPLOAD_FAIL: '图片上传失败',
  IMAGE_UPLOAD_FAIL_MSG: (msg: string) => `图片上传失败: ${msg || '未知错误'}`,
  IMAGE_COMPRESS_FAIL: '图片压缩失败，请重试',
  IMAGE_PROCESS_FAIL: '图片处理失败，请重试',
  IMAGE_REQUIRED: '请先上传图片',
  COVER_UPDATE_SUCCESS: '修改首图成功',
  COVER_UPDATE_FAIL: '修改首图失败',
  RECOMMEND_SUCCESS: '推荐成功',
  RECOMMEND_FAIL: '推荐失败',
  UNRECOMMEND_SUCCESS: '取消推荐成功',
  UNRECOMMEND_FAIL: '取消推荐失败',
  PUBLISH_SUCCESS: '发布博客成功',
  PUBLISH_FAIL: '发布博客失败',
  UNPUBLISH_SUCCESS: '取消发布博客成功',
  UNPUBLISH_FAIL: '取消发布博客失败'
} as const

// ==================== 管理后台 - 博客编辑 ====================
export const ADMIN_BLOG_INPUT_LABELS = {
  RESET_SUCCESS: '已重置所有内容',
  FETCH_TYPE_FAIL: '获取分类列表失败',
  FETCH_TAG_FAIL: '获取标签列表失败',
  MODIFY_SUCCESS: '修改博客成功！',
  MODIFY_FAIL: '修改博客失败！',
  IMAGE_REQUIRED: '请上传图片文件',
  IMAGE_UPLOAD_SUCCESS: '图片压缩并上传成功',
  IMAGE_UPLOAD_FAIL: '图片上传失败',
  IMAGE_COMPRESS_FAIL: '图片压缩失败，请重试',
  IMAGE_PROCESS_FAIL: '图片处理失败',
  PUBLISH_SUCCESS: '发布博客成功！',
  PUBLISH_FAIL: '发布博客失败！',
  PUBLISH_ERROR: '发布博客出错'
} as const

// ==================== 管理后台 - 分类 ====================
export const ADMIN_TYPE_LABELS = {
  FETCH_FAIL: '获取分类失败',
  FETCH_LIST_FAIL: '获取分类列表失败',
  UPLOAD_FAIL: '上传失败',
  IMAGE_COMPRESS_FAIL: '图片压缩失败，请重试',
  NAME_REQUIRED: '分类名称不能为空',
  SAVE_FAIL: '保存分类失败',
  SAVE_SUCCESS: '分类更新成功',
  CREATE_SUCCESS: '分类创建成功',
  DELETE_SUCCESS: '分类删除成功',
  DELETE_FAIL: '删除分类失败',
  OPERATION_FAIL: '操作失败'
} as const

// ==================== 管理后台 - 标签 ====================
export const ADMIN_TAG_LABELS = {
  NAME_REQUIRED: '标签名称不能为空',
  SAVE_FAIL: '保存标签失败',
  SAVE_SUCCESS: '标签更新成功',
  CREATE_SUCCESS: '标签创建成功',
  DELETE_SUCCESS: '标签删除成功',
  DELETE_FAIL: '删除标签失败',
  OPERATION_FAIL: '操作失败'
} as const

// ==================== 管理后台 - 项目 ====================
export const ADMIN_PROJECT_LABELS = {
  FETCH_LIST_FAIL: '获取项目列表失败',
  IMAGE_UPLOAD_SUCCESS: '图片压缩并上传成功',
  IMAGE_UPLOAD_FAIL: '图片上传失败',
  IMAGE_COMPRESS_FAIL: '图片压缩失败，请重试',
  TITLE_REQUIRED: '请输入项目名称',
  CONTENT_REQUIRED: '请输入项目描述',
  URL_REQUIRED: '请输入项目地址',
  TECHS_REQUIRED: '请输入技术栈',
  IMAGE_REQUIRED: '请上传项目图片',
  PUBLISH_SUCCESS: '项目发布成功',
  PUBLISH_FAIL: '项目发布失败',
  DELETE_SUCCESS: '项目删除成功',
  DELETE_FAIL: '项目删除失败',
  UPDATE_SUCCESS: '项目更新成功',
  UPDATE_FAIL: '项目更新失败',
  OPERATION_FAIL: '操作失败，请重试',
  PUBLISHED_SUCCESS: '发布成功',
  PUBLISHED_FAIL: '发布失败',
  UNPUBLISHED_SUCCESS: '取消发布成功',
  UNPUBLISHED_FAIL: '取消发布失败'
} as const

// ==================== 管理后台 - 随笔 ====================
export const ADMIN_ESSAY_LABELS = {
  OPERATION_FAIL: '操作失败，请重试',
  RECOMMEND_SUCCESS: '推荐成功',
  RECOMMEND_FAIL: '推荐失败',
  UNRECOMMEND_SUCCESS: '取消推荐成功',
  UNRECOMMEND_FAIL: '取消推荐失败',
  MAX_FILES_MSG: (max: number, remaining: number) => `最多只能上传${max}个文件，还可以上传${remaining}个`,
  FILE_DELETE_FAIL: '文件删除失败，但已从本地移除',
  PARTIAL_UPLOAD_FAIL: '部分文件上传失败，已跳过',
  UPLOAD_FAIL_LIST: (names: string) => `以下文件上传失败：${names}。已成功的文件已保留，请检查网络后重新发布`,
  URL_ADD_INVALID: '请输入有效的文件URL（以 http:// 或 https:// 开头）',
  URL_ADD_DUPLICATE: '该文件URL已存在',
  URL_ADD_SUCCESS: '文件URL添加成功',
  OPERATION_SUCCESS: '操作成功！',
  OPERATION_FAIL_MSG: '操作失败',
  PUBLISH_FAIL: '发布随笔失败',
  DELETE_SUCCESS: '删除成功！',
  DELETE_FAIL: '删除失败',
  PUBLISHED_SUCCESS: '发布成功',
  PUBLISHED_FAIL: '发布失败',
  UNPUBLISHED_SUCCESS: '取消发布成功',
  UNPUBLISHED_FAIL: '取消发布失败'
} as const

// ==================== 管理后台 - 文件 ====================
export const ADMIN_FILE_LABELS = {
  OPERATION_FAIL: '操作失败，请重试',
  UPLOAD_SUCCESS: '文件上传成功',
  UPLOAD_ERR: '文件上传时发生错误',
  DIR_CREATE_SUCCESS: '目录创建成功',
  DELETE_SUCCESS: '删除成功！',
  DELETE_ERR: '删除时发生错误',
  DOWNLOAD_STARTED: '文件下载已开始',
  DOWNLOAD_ERR: '下载文件时发生错误',
  VIEW_ERR: '查看文件时发生错误'
} as const

// ==================== 登录/注册/用户 ====================
export const AUTH_LABELS = {
  LOGIN_SUCCESS: '登录成功',
  LOGIN_FAIL: '登录失败，请检查用户名和密码',
  CAPTCHA_SENT: '验证码已发送到您的邮箱，请查收',
  CAPTCHA_FAIL: '获取验证码失败，请稍后再试',
  PASSWORD_RESET_SUCCESS: '密码重置成功，请登录',
  PASSWORD_RESET_FAIL: '密码重置失败，请检查信息是否正确',
  LOGOUT_SUCCESS: '已成功退出登录',
  REGISTER_SUCCESS: '注册成功',
  REGISTER_FAIL: '注册失败，请稍后重试',
  AVATAR_UPLOAD_SUCCESS: '头像上传成功',
  AVATAR_UPLOAD_FAIL: '头像上传失败',
  AVATAR_COMPRESS_FAIL: '图片压缩失败，请重试',
  USER_INFO_INCOMPLETE: '用户信息不完整，请重新登录',
  PROFILE_UPDATE_SUCCESS: '更新用户信息成功',
  PROFILE_UPDATE_FAIL: '更新用户信息失败，请稍后重试'
} as const

// ==================== 背景设置 ====================
export const BACKGROUND_LABELS = {
  TITLE: '自定义背景',
  DEFAULT: '默认背景',
  CUSTOM_URL: '自定义链接',
  CUSTOM_FILE: '本地上传',
  URL_PLACEHOLDER: '请输入图片链接（https://...）',
  URL_HINT: '支持 jpg、png、webp 等格式',
  FILE_HINT: '支持高清大图，将自动压缩后存储（建议 1920×1080 及以上）',
  FILE_TOO_LARGE: '文件过大，请选择 20MB 以内的图片',
  COMPRESSING: '正在压缩图片...',
  COMPRESS_FAIL: '图片压缩失败，请重试',
  SAVE_SUCCESS: '背景已更新',
  RESET: '恢复默认',
  CLOSE: '关闭'
} as const
