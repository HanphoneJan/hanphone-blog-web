import { Code, BookOpen, Heart, MessageSquare, User, Music, Video, Dumbbell, Book, Gamepad } from 'lucide-react'
import { NavItem } from './types'

// 导航项配置
export const NAV_ITEMS: NavItem[] = [
  { id: 'info', label: '基本信息', shortLabel: '信息', icon: null }, // icon 在组件中渲染
  { id: 'skills', label: '技能管理', shortLabel: '技能', icon: null },
  { id: 'hobbys', label: '爱好管理', shortLabel: '爱好', icon: null },
  { id: 'works', label: '作品管理', shortLabel: '作品', icon: null },
  { id: 'evaluations', label: '自我评价', shortLabel: '评价', icon: null }
]

// Section 名称映射
export const SECTION_NAMES: Record<string, string> = {
  skills: '技能',
  works: '作品',
  hobbys: '爱好',
  evaluations: '评价',
  mcpKeys: 'MCP 密钥'
}

// 图标映射
export const ICON_MAP: Record<string, string> = {
  music: 'music',
  video: 'video',
  sport: 'sport',
  literature: 'literature',
  game: 'game',
  code: 'code'
}

// 默认表单数据
export const DEFAULT_FORM_DATA = {
  skills: { name: '', url: '', desc: '', icon_src: '', rank: 0 },
  works: { name: '', url: '', desc: '', pic_url: '', icon_src: '', rank: 0 },
  hobbys: { name: '', url: '', desc: '', pic_url: '', icon_src: '', rank: 0 },
  evaluations: { name: '', rank: 0 }
}
