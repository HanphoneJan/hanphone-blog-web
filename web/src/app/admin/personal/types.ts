import { ReactNode } from 'react'

// API 返回的基础数据项
export interface Item {
  id: number
  category: 'skill' | 'work' | 'hobby' | 'evaluation'
  name: string
  description: string | null
  pic_url: string | null
  icon_src: string | null
  url: string | null
  rank: number
}

// 用户信息类型
export interface UserInfo {
  id: number
  avatar: string
  nickname: string
  username: string
  email: string
  type: string // 0: 普通用户, 1: 管理员
}

// 技能类型
export interface Skill {
  id: number
  name: string
  url: string
  desc: string
  icon_src: string
  icon: ReactNode
  rank: number
}

// 作品类型
export interface Work {
  id: number
  name: string
  url: string
  desc: string
  pic_url: string
  icon_src: string
  icon: ReactNode
  rank: number
}

// 爱好类型
export interface Hobby {
  id: number
  name: string
  url: string
  pic_url: string
  desc: string
  icon: ReactNode
  icon_src: string
  rank: number
}

// 评价类型
export interface Evaluation {
  id: number
  name: string
  rank: number
}

// 表单数据类型
export interface PersonInfoFormData {
  name: string
  url?: string
  desc?: string
  pic_url?: string
  icon_src?: string
  id?: number
  rank?: number
}

// 联合类型
export type ItemType = Skill | Work | Hobby | Evaluation | null

// 导航项类型
export interface NavItem {
  id: string
  label: string
  shortLabel: string
  icon: ReactNode
}

// Section 类型
export type SectionType = 'info' | 'skills' | 'works' | 'hobbys' | 'evaluations' | 'avatar' | 'mcpKeys'
