/**
 * 个人信息页配置（默认值 / 兜底）
 * 实际展示内容从 public/personal-profile.json 运行时加载
 * 修改 public/personal-profile.json 即可更新，无需重新编译
 * 仅当 JSON 加载失败时使用此文件中的值
 */

// 从环境变量读取域名配置
const fileDomain = process.env.NEXT_PUBLIC_FILE_DOMAIN || 'hanphone.top'

// ==================== 基础资料 ====================
export const PROFILE = {
  /** 姓名/昵称 */
  name: '寒枫',
  /** 头像图片 URL */
  avatar: `https://${fileDomain}/images/zhuxun.jpg`,
  /** 个人描述 */
  description: '一个焦虑于找工作的大学生',
  /** 技术方向（顿号分隔） */
  techDirection: 'Agent应用、全栈开发',
  /** 个性签名 */
  signature: '不鹜于虚声'
} as const

// ==================== 社交媒体与链接 ====================
export const SOCIAL_LINKS = [
  { platform: 'github', url: 'https://github.com/HanphoneJan/', label: 'GitHub' },
  { platform: 'bilibili', url: 'https://space.bilibili.com/649062555/', label: 'Bilibili' },
  { platform: 'email', url: 'mailto:janhizian@qq.com', label: 'Email' },
  { platform: 'x', url: 'https://x.com/hanphonejan', label: 'X' },
  { platform: 'youtube', url: 'https://youtube.com/@Hanphone', label: 'YouTube' }
] as const

// ==================== 外部链接 ====================
export const EXTERNAL_LINKS = {
  docs: {
    href: 'https://docs.hanphone.cn',
    text: '技术文档站'
  }
} as const

// ==================== 内部链接 ====================
export const INTERNAL_LINKS = {
  /** 照片墙 */
  atlas: {
    href: '/atlas',
    text: '快来看看我的照片墙'
  },
  /** 私信 */
  privateChat: {
    href: '/chat',
    text: '点击这里可以给我私发消息'
  }
} as const
