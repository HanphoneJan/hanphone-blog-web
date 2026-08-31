'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { ENDPOINTS } from '@/lib/api'
import apiClient from '@/lib/utils'
import { showAlert } from '@/lib/Alert'
import { ADMIN_ESSAY_LABELS, ADMIN_LINK_LABELS } from '@/lib/labels'
import type { Essay } from '../types'

import { API_CODE } from '@/lib/constants'
import { getUrlFileName } from '../utils'
export function useEssays() {
  const [essayList, setEssayList] = useState<Essay[]>([])
  const [filteredEssayList, setFilteredEssayList] = useState<Essay[]>([])
  const [loading, setLoading] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null)
  const [updateRecommendLoading, setUpdateRecommendLoading] = useState<number | null>(null)
  const [updatePublishedLoading, setUpdatePublishedLoading] = useState<number | null>(null)

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20

  // API调用函数
  const fetchData = async (url: string, method: string = 'GET', data?: unknown) => {
    try {
      setLoading(true)
      const response = await apiClient({
        url,
        method,
        data: method !== 'GET' ? data : undefined,
        params: method === 'GET' ? data : undefined
      })

      setLoading(false)
      return response.data
    } catch (error) {
      console.log(`Error fetching ${url}:`, error)
      setLoading(false)
      showAlert(ADMIN_ESSAY_LABELS.OPERATION_FAIL)
      return { code: 500, data: null }
    }
  }

  // 获取随笔列表
  const getEssayList = useCallback(async () => {
    try {
      const data = await fetchData(ENDPOINTS.ADMIN.ESSAYS)
      if (data.code === API_CODE.SUCCESS) {
        const list = data.data.map((item: Essay) => ({
          ...item,
          vis: false,
          recommend: item.recommend || false,
          published: item.published || false,
          essayFileUrls: (item.essayFileUrls || []).map(file => ({
            ...file,
            name: file.name || getUrlFileName(file.url)
          }))
        }))
        setEssayList(list)
      }
    } catch (error) {
      console.error('获取随笔列表失败:', error)
    }
  }, [])

  // 初始化获取随笔列表
  useEffect(() => {
    getEssayList()
  }, [getEssayList])

  // 当原始列表、搜索关键词或排序顺序变化时，更新过滤和排序后的列表
  useEffect(() => {
    let result = [...essayList]

    // 应用搜索过滤
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase()
      result = result.filter(essay => essay.title.toLowerCase().includes(keyword))
    }

    // 应用排序
    if (sortOrder) {
      result.sort((a, b) => {
        const dateA = new Date(a.createTime).getTime()
        const dateB = new Date(b.createTime).getTime()
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
      })
    }

    setFilteredEssayList(result)
    setCurrentPage(1) // 筛选或排序变化时重置到第一页
  }, [essayList, searchKeyword, sortOrder])

  // 前端本地分页
  const totalPages = Math.max(1, Math.ceil(filteredEssayList.length / pageSize))
  const paginatedEssayList = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredEssayList.slice(start, start + pageSize)
  }, [filteredEssayList, currentPage, pageSize])

  // 切换排序顺序
  const toggleSortOrder = () => {
    if (sortOrder === null) {
      setSortOrder('desc')
    } else if (sortOrder === 'desc') {
      setSortOrder('asc')
    } else {
      setSortOrder(null)
    }
  }

  // 切换推荐状态
  const toggleRecommend = async (essay: Essay) => {
    if (!essay.id) return

    try {
      setUpdateRecommendLoading(essay.id)

      const response = await fetchData(ENDPOINTS.ADMIN.ESSAY_RECOMMEND, 'POST', {
        essayId: essay.id,
        recommend: !essay.recommend
      })

      if (response.code === API_CODE.SUCCESS) {
        setEssayList(prev =>
          prev.map(item => (item.id === essay.id ? { ...item, recommend: !essay.recommend } : item))
        )
        showAlert(essay.recommend ? ADMIN_LINK_LABELS.UNRECOMMEND_SUCCESS : ADMIN_LINK_LABELS.RECOMMEND_SUCCESS)
      } else {
        showAlert(essay.recommend ? ADMIN_LINK_LABELS.UNRECOMMEND_FAIL : ADMIN_LINK_LABELS.RECOMMEND_FAIL)
      }
    } catch (error) {
      console.error('推荐状态更新失败:', error)
      showAlert(ADMIN_ESSAY_LABELS.OPERATION_FAIL)
    } finally {
      setUpdateRecommendLoading(null)
    }
  }

  // 切换发布状态
  const togglePublished = async (essay: Essay) => {
    if (!essay.id) return

    try {
      setUpdatePublishedLoading(essay.id)

      const response = await fetchData(ENDPOINTS.ADMIN.ESSAY_PUBLISHED, 'POST', {
        essayId: essay.id,
        published: !essay.published
      })

      if (response.code === API_CODE.SUCCESS) {
        setEssayList(prev =>
          prev.map(item => (item.id === essay.id ? { ...item, published: !essay.published } : item))
        )
        showAlert(essay.published ? '取消发布成功' : '发布成功')
      } else {
        showAlert(essay.published ? '取消发布失败' : '发布失败')
      }
    } catch (error) {
      console.error('发布状态更新失败:', error)
      showAlert(ADMIN_ESSAY_LABELS.OPERATION_FAIL)
    } finally {
      setUpdatePublishedLoading(null)
    }
  }

  // 删除随笔
  const deleteEssay = async (id: number): Promise<boolean> => {
    try {
      const data = await fetchData(`${ENDPOINTS.ADMIN.ESSAY}/${id}`, 'DELETE')
      if (data.code === API_CODE.SUCCESS) {
        showAlert(ADMIN_ESSAY_LABELS.DELETE_SUCCESS)
        getEssayList()
        return true
      } else {
        showAlert(ADMIN_ESSAY_LABELS.DELETE_FAIL)
        return false
      }
    } catch (error) {
      console.error('删除随笔失败:', error)
      showAlert(ADMIN_ESSAY_LABELS.DELETE_FAIL)
      return false
    }
  }

  // 保存随笔
  const saveEssay = async (essayData: Essay): Promise<boolean> => {
    try {
      setLoading(true)
      const dataToSave = {
        ...essayData,
        published: essayData.id === null ? true : (essayData.published !== false)
      }
      const data = await fetchData(ENDPOINTS.ADMIN.ESSAY, 'POST', { essay: dataToSave })
      setLoading(false)

      if (data.code === API_CODE.SUCCESS) {
        showAlert(ADMIN_ESSAY_LABELS.OPERATION_SUCCESS)
        getEssayList()
        return true
      } else {
        showAlert(ADMIN_ESSAY_LABELS.OPERATION_FAIL_MSG)
        return false
      }
    } catch (error) {
      setLoading(false)
      console.error('保存随笔失败:', error)
      showAlert(ADMIN_ESSAY_LABELS.PUBLISH_FAIL)
      return false
    }
  }

  // 分页跳转
  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(totalPages, page)))
  }, [totalPages])

  return {
    essayList,
    filteredEssayList: paginatedEssayList,
    allFilteredEssayList: filteredEssayList,
    loading,
    searchKeyword,
    setSearchKeyword,
    sortOrder,
    toggleSortOrder,
    updateRecommendLoading,
    toggleRecommend,
    updatePublishedLoading,
    togglePublished,
    deleteEssay,
    saveEssay,
    getEssayList,
    fetchData,
    currentPage,
    totalPages,
    goToPage
  }
}
