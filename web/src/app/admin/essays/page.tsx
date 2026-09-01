'use client'

import { useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { Plus, FileText } from 'lucide-react'
import { showAlert } from '@/lib/Alert'
import { ADMIN_ESSAY_LABELS } from '@/lib/labels'
import { useEssays } from './hooks/useEssays'
import { useEssayForm } from './hooks/useEssayForm'
import { useEssayFiles } from './hooks/useEssayFiles'
import { EssayForm } from './components/EssayForm'
import { EssayList } from './components/EssayList'
import { isInternalFileUrl } from './utils'
import type { Essay } from './types'

// 动画变体定义
const pageVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
}

const fadeInUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
}

const tabVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3
    }
  }
}

export default function EssayManagementPage() {
  const [activeKey, setActiveKey] = useState('first')
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [currentDeleteId, setCurrentDeleteId] = useState<number | null>(null)

  // 使用自定义Hooks
  const {
    filteredEssayList,
    allFilteredEssayList,
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
  } = useEssays()

  const {
    essay,
    formErrors,
    isEditMode,
    setTitle,
    setContent,
    setEditEssay,
    resetForm,
    removeUploadedFile,
    moveUploadedFile,
    addUrlFile,
    validateForm,
    prepareEssayData
  } = useEssayForm()

  const {
    localFiles,
    deleteFileModalVisible,
    fileToDelete,
    uploadProgress,
    handleFileSelect,
    openFileDeleteModal,
    closeFileDeleteModal,
    confirmFileDelete,
    moveLocalFile,
    uploadAllFiles,
    clearLocalFiles
  } = useEssayFiles(fetchData)

  // 文件上移/下移（本地列表与已上传列表各自组内移动）
  const handleFileMove = useCallback((index: number, isLocal: boolean, direction: 'up' | 'down') => {
    if (isLocal) {
      moveLocalFile(index, direction)
    } else {
      moveUploadedFile(index, direction)
    }
  }, [moveLocalFile, moveUploadedFile])

  // 切换标签页
  const handleTabChange = useCallback((key: string) => {
    setActiveKey(key)
    if (key === 'second') {
      getEssayList()
    }
  }, [getEssayList])

  // 发布/更新随笔
  const handlePublish = useCallback(async () => {
    if (!validateForm(localFiles.length)) return

    try {
      // 1. 先上传所有本地文件（失败的文件会保留在本地列表，成功的挂到表单）
      const { succeeded, failed } = await uploadAllFiles(essay.title)

      // 2. 存在上传失败文件时暂停发布，提示用户后重试（避免静默丢失文件）
      if (failed.length > 0) {
        showAlert(ADMIN_ESSAY_LABELS.UPLOAD_FAIL_LIST(failed.join('、')))
        return
      }

      // 3. 准备随笔数据
      const essayData = prepareEssayData(succeeded)

      // 4. 提交随笔数据到服务器
      const success = await saveEssay(essayData)

      if (success) {
        // 重置表单
        resetForm()
        clearLocalFiles()
        // 切换到列表标签页
        setActiveKey('second')
      }
    } catch (error) {
      console.error('发布随笔失败:', error)
      showAlert(ADMIN_ESSAY_LABELS.PUBLISH_FAIL)
    }
  }, [validateForm, localFiles.length, essay.title, uploadAllFiles, prepareEssayData, saveEssay, resetForm, clearLocalFiles])

  // 编辑随笔
  const handleEdit = useCallback((row: Essay) => {
    setEditEssay(row)
    clearLocalFiles()
    setActiveKey('first')
  }, [setEditEssay, clearLocalFiles])

  // 打开删除确认框
  const openDeleteModal = useCallback((id: number) => {
    setCurrentDeleteId(id)
    setDeleteModalVisible(true)
  }, [])

  // 关闭删除确认框
  const closeDeleteModal = useCallback(() => {
    setDeleteModalVisible(false)
    setCurrentDeleteId(null)
  }, [])

  // 确认删除随笔
  const confirmDelete = useCallback(async () => {
    if (!currentDeleteId) return

    const success = await deleteEssay(currentDeleteId)
    if (success) {
      closeDeleteModal()
    }
  }, [currentDeleteId, deleteEssay, closeDeleteModal])

  // 处理文件删除确认
  const handleFileDeleteConfirm = useCallback(async () => {
    await confirmFileDelete(removeUploadedFile, essay.essayFileUrls || [])
  }, [confirmFileDelete, removeUploadedFile, essay.essayFileUrls])

  // 根据文件状态生成删除确认文案
  const fileDeleteMessage = (() => {
    if (!fileToDelete) return ''
    if (fileToDelete.isLocal) {
      return '确定要移除该文件吗？该文件尚未上传。'
    }
    const file = (essay.essayFileUrls || [])[fileToDelete.index]
    if (!file || !isInternalFileUrl(file.url)) {
      return '确定要移除该文件URL吗？'
    }
    if (file.id === 0) {
      return '确定要删除该文件吗？文件将从服务器立即删除，此操作不可撤销。'
    }
    return '确定要删除该文件吗？保存随笔后，文件将从服务器删除。'
  })()

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="font-sans min-h-screen flex flex-col bg-[rgb(var(--bg))] text-[rgb(var(--text))] relative overflow-hidden"
    >
      {/* 背景装饰 - 已移除 */}

      <main className="flex-1 w-full max-w-7xl mx-auto lg:px-2 lg:py-2 relative z-10">
        {/* 标签页切换 */}
        <motion.div
          variants={fadeInUpVariants}
          className="bg-[rgb(var(--card))]/80 backdrop-blur-sm lg:rounded-xl shadow border-[rgb(var(--border))] overflow-hidden mb-6"
        >
          <div className="flex border-b border-[rgb(var(--border))]">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-6 py-2 lg:py-3 text-sm font-medium transition-colors flex-1 ${
                activeKey === 'first'
                  ? 'text-[rgb(var(--primary))] border-b-2 border-[rgb(var(--primary))]'
                  : 'text-[rgb(var(--muted))] hover:text-[rgb(var(--text))]'
              }`}
              onClick={() => handleTabChange('first')}
            >
              <Plus className="h-4 w-4 mr-2 inline-block" />
              新建随笔
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-6 py-4 text-sm font-medium transition-colors flex-1 ${
                activeKey === 'second'
                  ? 'text-[rgb(var(--primary))] border-b-2 border-[rgb(var(--primary))]'
                  : 'text-[rgb(var(--muted))] hover:text-[rgb(var(--text))]'
              }`}
              onClick={() => handleTabChange('second')}
            >
              <FileText className="h-4 w-4 mr-2 inline-block" />
              随笔管理
            </motion.button>
          </div>

          {/* 新建随笔内容 */}
          <AnimatePresence mode="wait">
            {activeKey === 'first' && (
              <motion.div
                key="first"
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <EssayForm
              essay={essay}
              formErrors={formErrors}
              localFiles={localFiles}
              uploadProgress={uploadProgress}
              loading={loading}
              onTitleChange={setTitle}
              onContentChange={setContent}
              onFileSelect={handleFileSelect}
              onOpenFileDeleteModal={openFileDeleteModal}
              onAddUrl={addUrlFile}
              onMoveFile={handleFileMove}
              onPublish={handlePublish}
            />
          </motion.div>
        )}
      </AnimatePresence>

          {/* 随笔管理列表 */}
          <AnimatePresence mode="wait">
            {activeKey === 'second' && (
              <motion.div
                key="second"
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <EssayList
              essays={filteredEssayList}
              searchKeyword={searchKeyword}
              onSearchChange={setSearchKeyword}
              sortOrder={sortOrder}
              onToggleSort={toggleSortOrder}
              updateRecommendLoading={updateRecommendLoading}
              updatePublishedLoading={updatePublishedLoading}
              onToggleRecommend={toggleRecommend}
              onTogglePublished={togglePublished}
              onEdit={handleEdit}
              onDelete={openDeleteModal}
            />

                {/* 分页组件 */}
                {allFilteredEssayList.length > 0 && (
                  <div className="px-4 py-4 border-t border-[rgb(var(--border))] flex items-center justify-between">
                    <div className="text-sm text-[rgb(var(--muted))]">
                      显示 {(currentPage - 1) * 20 + 1} - {Math.min(currentPage * 20, allFilteredEssayList.length)} 条，共 {allFilteredEssayList.length} 条
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-2.5 py-1 rounded-md text-sm border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--text))] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[rgb(var(--hover))] transition-colors"
                      >
                        上一页
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1))
                        .map((p, idx, arr) => (
                          <span key={p} className="flex items-center">
                            {idx > 0 && arr[idx - 1] !== p - 1 && (
                              <span className="px-1 text-[rgb(var(--muted))]">...</span>
                            )}
                            <button
                              onClick={() => goToPage(p)}
                              className={`min-w-[28px] px-2 py-1 rounded-md text-sm transition-colors ${
                                p === currentPage
                                  ? 'bg-[rgb(var(--primary))] text-white'
                                  : 'border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--text))] hover:bg-[rgb(var(--hover))]'
                              }`}
                            >
                              {p}
                            </button>
                          </span>
                        ))}
                      <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="px-2.5 py-1 rounded-md text-sm border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--text))] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[rgb(var(--hover))] transition-colors"
                      >
                        下一页
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* 删除确认对话框（createPortal 返回 portal 节点而非 React element，
          不能作为 AnimatePresence 子元素——会被 isValidElement 过滤导致弹窗永不渲染） */}
      {deleteModalVisible &&
          createPortal(
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[rgb(var(--overlay))]/50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-[rgb(var(--card))]/90 rounded-lg p-6 max-w-sm mx-4"
              >
                <h3 className="text-lg font-medium text-[rgb(var(--text))] mb-4">确认删除</h3>
                <p className="text-[rgb(var(--text-muted))] mb-6">确定要删除这篇随笔吗？此操作不可撤销。</p>
                <div className="flex justify-end gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={closeDeleteModal}
                    className="px-4 py-2 rounded-lg bg-[rgb(var(--hover))] text-[rgb(var(--text))] hover:bg-[rgb(var(--muted))] transition-colors"
                  >
                    取消
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={confirmDelete}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors"
                  >
                    确认删除
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>,
            document.body
          )}

      {/* 文件删除确认对话框（同上，portal 不能放进 AnimatePresence） */}
      {deleteFileModalVisible &&
          createPortal(
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[rgb(var(--overlay))]/50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-[rgb(var(--card))]/90 rounded-lg p-6 max-w-sm mx-4"
              >
                <h3 className="text-lg font-medium text-[rgb(var(--text))] mb-4">确认删除文件</h3>
                <p className="text-[rgb(var(--text-muted))] mb-6">
                  文件 &quot;{fileToDelete?.fileName}&quot;
                  <br />
                  {fileDeleteMessage}
                </p>
                <div className="flex justify-end gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={closeFileDeleteModal}
                    className="px-4 py-2 rounded-lg bg-[rgb(var(--hover))] text-[rgb(var(--text))] hover:bg-[rgb(var(--muted))] transition-colors"
                  >
                    取消
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleFileDeleteConfirm}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors"
                  >
                    确认删除
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>,
            document.body
          )}
    </motion.div>
  )
}
