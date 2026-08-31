'use client'

import { useState, useCallback } from 'react'
import { useUser } from '@/contexts/UserContext'
import { showAlert } from '@/lib/Alert'
import { ADMIN_ESSAY_LABELS } from '@/lib/labels'
import type { Essay, EssayFile, FormErrors } from '../types'
import { validateEssayForm, isValidFileUrl, getFileTypeByUrl, getUrlFileName } from '../utils'

const initialEssay: Essay = {
  id: null,
  user_id: null,
  title: '',
  content: '',
  createTime: '',
  essayFileUrls: [],
  recommend: false,
  published: false
}

export function useEssayForm() {
  const { userInfo } = useUser()
  const [essay, setEssay] = useState<Essay>(initialEssay)
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  // 更新标题
  const setTitle = useCallback((title: string) => {
    setEssay(prev => ({ ...prev, title }))
  }, [])

  // 更新内容
  const setContent = useCallback((content: string) => {
    setEssay(prev => ({ ...prev, content }))
  }, [])

  // 设置编辑的随笔
  const setEditEssay = useCallback((essayData: Essay) => {
    setEssay({
      id: essayData.id,
      user_id: essayData.user_id,
      title: essayData.title,
      content: essayData.content,
      createTime: essayData.createTime,
      recommend: essayData.recommend || false,
      essayFileUrls: (essayData.essayFileUrls || []).map(file => ({
        ...file,
        name: file.name || getUrlFileName(file.url)
      }))
    })
    setFormErrors({})
  }, [])

  // 重置表单
  const resetForm = useCallback(() => {
    setEssay(initialEssay)
    setFormErrors({})
  }, [])

  // 更新已上传文件列表
  const setUploadedFiles = useCallback((files: EssayFile[]) => {
    setEssay(prev => ({ ...prev, essayFileUrls: files }))
  }, [])

  // 移除已上传文件
  const removeUploadedFile = useCallback((index: number) => {
    setEssay(prev => ({
      ...prev,
      essayFileUrls: prev.essayFileUrls?.filter((_, i) => i !== index) || []
    }))
  }, [])

  // 直接添加文件URL（支持外链或本站文件地址）
  const addUrlFile = useCallback((url: string): boolean => {
    const trimmed = url.trim()
    if (!isValidFileUrl(trimmed)) {
      showAlert(ADMIN_ESSAY_LABELS.URL_ADD_INVALID)
      return false
    }
    if (essay.essayFileUrls?.some(file => file.url === trimmed)) {
      showAlert(ADMIN_ESSAY_LABELS.URL_ADD_DUPLICATE)
      return false
    }
    const urlFile: EssayFile = {
      id: 0,
      url: trimmed,
      urlType: getFileTypeByUrl(trimmed),
      urlDesc: null,
      isValid: true,
      createTime: new Date().toISOString(),
      name: getUrlFileName(trimmed)
    }
    setEssay(prev => ({
      ...prev,
      essayFileUrls: [...(prev.essayFileUrls || []), urlFile]
    }))
    showAlert(ADMIN_ESSAY_LABELS.URL_ADD_SUCCESS)
    return true
  }, [essay.essayFileUrls])

  // 验证表单
  const validateForm = useCallback((localFileCount: number): boolean => {
    const { isValid, errors } = validateEssayForm(
      essay.title,
      essay.content,
      essay.essayFileUrls?.length || 0,
      localFileCount
    )
    setFormErrors(errors)
    return isValid
  }, [essay.title, essay.content, essay.essayFileUrls])

  // 准备提交的随笔数据
  const prepareEssayData = useCallback((uploadedFiles: EssayFile[]): Essay => {
    const allFiles: EssayFile[] = [...(essay.essayFileUrls || []), ...uploadedFiles]

    return {
      ...essay,
      essayFileUrls: allFiles,
      createTime: essay.createTime || new Date().toISOString(),
      user_id: userInfo?.id || 1000,
      published: essay.id === null ? true : (essay.published !== false)
    }
  }, [essay, userInfo?.id])

  // 是否是编辑模式
  const isEditMode = essay.id !== null

  return {
    essay,
    formErrors,
    isEditMode,
    setTitle,
    setContent,
    setEditEssay,
    resetForm,
    setUploadedFiles,
    removeUploadedFile,
    addUrlFile,
    validateForm,
    prepareEssayData
  }
}
