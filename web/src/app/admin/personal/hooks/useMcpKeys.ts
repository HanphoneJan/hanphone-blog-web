'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { ENDPOINTS } from '@/lib/api'
import apiClient from '@/lib/utils'
import { API_CODE } from '@/lib/constants'

export interface McpKeySummary {
  id: number
  name: string
  prefix: string
  active: boolean
  createTime: string | null
  updateTime: string | null
  lastUsedAt: string | null
}

export interface McpKeyDetail extends McpKeySummary {
  /** 创建 / 轮转时一次性下发的完整密钥；列表接口不返回此字段。 */
  key?: string
}

export function useMcpKeys() {
  const [keys, setKeys] = useState<McpKeySummary[]>([])
  const [loading, setLoading] = useState(false)
  const [opLoading, setOpLoading] = useState(false)

  /** 一次性显示的完整密钥（创建 / 轮转后由服务端返回一次）。 */
  const [revealedKey, setRevealedKey] = useState<McpKeyDetail | null>(null)

  const hasFetchedRef = useRef(false)

  const fetchKeys = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient({
        url: ENDPOINTS.ADMIN.MCP_KEYS,
        method: 'GET'
      })
      if (res.data.code === API_CODE.SUCCESS) {
        setKeys(res.data.data || [])
      }
    } catch (err) {
      console.error('获取 MCP 密钥列表失败:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true
      fetchKeys()
    }
  }, [fetchKeys])

  /**
   * 创建新密钥。返回的 result.key 是完整密钥，仅在本次响应里可见。
   */
  const createKey = useCallback(async (name: string): Promise<McpKeyDetail | null> => {
    setOpLoading(true)
    try {
      const res = await apiClient({
        url: ENDPOINTS.ADMIN.MCP_KEYS,
        method: 'POST',
        data: { name }
      })
      if (res.data.code === API_CODE.SUCCESS) {
        const detail: McpKeyDetail = res.data.data
        await fetchKeys()
        return detail
      }
      throw new Error(res.data.message || '创建失败')
    } finally {
      setOpLoading(false)
    }
  }, [fetchKeys])

  const deleteKey = useCallback(async (id: number): Promise<void> => {
    setOpLoading(true)
    try {
      const res = await apiClient({
        url: `${ENDPOINTS.ADMIN.MCP_KEYS}/${id}`,
        method: 'DELETE'
      })
      if (res.data.code === API_CODE.SUCCESS) {
        await fetchKeys()
        return
      }
      throw new Error(res.data.message || '删除失败')
    } finally {
      setOpLoading(false)
    }
  }, [fetchKeys])

  const toggleKey = useCallback(async (id: number, active: boolean): Promise<void> => {
    setOpLoading(true)
    try {
      const res = await apiClient({
        url: `${ENDPOINTS.ADMIN.MCP_KEYS}/${id}/toggle`,
        method: 'POST',
        data: { active }
      })
      if (res.data.code === API_CODE.SUCCESS) {
        await fetchKeys()
        return
      }
      throw new Error(res.data.message || '启停失败')
    } finally {
      setOpLoading(false)
    }
  }, [fetchKeys])

  const regenerateKey = useCallback(async (id: number): Promise<McpKeyDetail | null> => {
    setOpLoading(true)
    try {
      const res = await apiClient({
        url: `${ENDPOINTS.ADMIN.MCP_KEYS}/${id}/regenerate`,
        method: 'POST'
      })
      if (res.data.code === API_CODE.SUCCESS) {
        const detail: McpKeyDetail = res.data.data
        await fetchKeys()
        return detail
      }
      throw new Error(res.data.message || '轮转失败')
    } finally {
      setOpLoading(false)
    }
  }, [fetchKeys])

  return {
    keys,
    loading,
    opLoading,
    revealedKey,
    setRevealedKey,
    fetchKeys,
    createKey,
    deleteKey,
    toggleKey,
    regenerateKey
  }
}
