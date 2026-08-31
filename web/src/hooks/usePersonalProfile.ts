'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  PROFILE as DEFAULT_PROFILE,
  SOCIAL_LINKS as DEFAULT_SOCIAL_LINKS,
  EXTERNAL_LINKS as DEFAULT_EXTERNAL_LINKS,
  INTERNAL_LINKS as DEFAULT_INTERNAL_LINKS
} from '@/lib/personal-profile'

export interface PersonalProfileData {
  profile: typeof DEFAULT_PROFILE
  socialLinks: { platform: string; url: string; label: string }[]
  externalLinks: typeof DEFAULT_EXTERNAL_LINKS
  internalLinks: typeof DEFAULT_INTERNAL_LINKS
}

const FALLBACK: PersonalProfileData = {
  profile: DEFAULT_PROFILE,
  socialLinks: [...DEFAULT_SOCIAL_LINKS],
  externalLinks: DEFAULT_EXTERNAL_LINKS,
  internalLinks: DEFAULT_INTERNAL_LINKS
}

/**
 * 从 public/personal-profile.json 动态加载个人信息
 * 修改 public/personal-profile.json 即可更新展示，无需重新编译
 * 加载失败时使用 personal-profile.ts 中的默认值
 * 
 * 热更新机制：
 * - 页面重新获得焦点时自动刷新
 * - 每 30 秒轮询检查更新
 * - 支持手动调用 refresh() 刷新
 */
export function usePersonalProfile(): PersonalProfileData & { refresh: () => void } {
  const [data, setData] = useState<PersonalProfileData>(FALLBACK)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const loadProfile = useCallback(async () => {
    try {
      // 添加时间戳防止缓存
      const res = await fetch(`/personal-profile.json?t=${Date.now()}`)
      if (!res.ok) throw new Error('Failed to fetch profile')
      const json: Record<string, unknown> = await res.json()

      const profile = json.profile && typeof json.profile === 'object'
        ? { ...FALLBACK.profile, ...json.profile }
        : FALLBACK.profile
      const socialLinks = Array.isArray(json.socialLinks)
        ? json.socialLinks as PersonalProfileData['socialLinks']
        : FALLBACK.socialLinks
      const externalLinks = json.externalLinks && typeof json.externalLinks === 'object'
        ? { ...FALLBACK.externalLinks, ...json.externalLinks }
        : FALLBACK.externalLinks
      const internalLinks = json.internalLinks && typeof json.internalLinks === 'object'
        ? { ...FALLBACK.internalLinks, ...json.internalLinks }
        : FALLBACK.internalLinks

      setData({
        profile: profile as PersonalProfileData['profile'],
        socialLinks,
        externalLinks: externalLinks as PersonalProfileData['externalLinks'],
        internalLinks: internalLinks as PersonalProfileData['internalLinks']
      })
    } catch {
      // 静默失败，沿用当前数据或 fallback
    }
  }, [])

  // 初始加载 + 手动刷新触发
  useEffect(() => {
    loadProfile()
  }, [loadProfile, refreshTrigger])

  // 页面重新获得焦点时刷新
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadProfile()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [loadProfile])

  // 每 30 秒轮询检查更新
  useEffect(() => {
    const interval = setInterval(() => {
      loadProfile()
    }, 30000)
    return () => clearInterval(interval)
  }, [loadProfile])

  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  return { ...data, refresh }
}
