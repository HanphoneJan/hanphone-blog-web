'use client'

import { Save, Loader2, AlertCircle } from 'lucide-react'
import type { Essay, FormErrors, FileInfo, UploadProgress } from '../types'
import { MAX_CONTENT_LENGTH } from '../utils'
import { FileUpload } from './FileUpload'

interface EssayFormProps {
  essay: Essay
  formErrors: FormErrors
  localFiles: FileInfo[]
  uploadProgress: UploadProgress | null
  loading: boolean
  onTitleChange: (title: string) => void
  onContentChange: (content: string) => void
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onOpenFileDeleteModal: (index: number, isLocal: boolean, fileName: string, id?: number) => void
  onAddUrl: (url: string) => boolean
  onMoveFile: (index: number, isLocal: boolean, direction: 'up' | 'down') => void
  onPublish: () => void
}

export function EssayForm({
  essay,
  formErrors,
  localFiles,
  uploadProgress,
  loading,
  onTitleChange,
  onContentChange,
  onFileSelect,
  onOpenFileDeleteModal,
  onAddUrl,
  onMoveFile,
  onPublish
}: EssayFormProps) {
  const isUploading = uploadProgress !== null
  const isBusy = isUploading || loading

  return (
    <div className="p-6 space-y-6 min-h-[90vh]">
      {/* 标题输入 */}
      <div>
        <label className="block text-sm font-medium text-[rgb(var(--text))] mb-2">标题</label>
        <input
          type="text"
          value={essay.title}
          onChange={e => onTitleChange(e.target.value)}
          className={`w-full p-3 rounded-lg border ${
            formErrors.title ? 'border-red-500' : 'border-[rgb(var(--border))]'
          } bg-[rgb(var(--card))]/60 text-[rgb(var(--text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))] transition-all`}
          placeholder="请输入随笔标题"
          maxLength={100}
        />
        {formErrors.title && (
          <p className="text-red-600 text-sm mt-1 flex items-center">
            <AlertCircle className="h-3.5 w-3.5 mr-1" />
            {formErrors.title}
          </p>
        )}
        <div className="text-right text-xs text-[rgb(var(--muted))] mt-1">
          {essay.title.length}/100
        </div>
      </div>

      {/* 内容输入 */}
      <div>
        <label className="block text-sm font-medium text-[rgb(var(--text))] mb-2">内容</label>
        {formErrors.content && (
          <p className="text-red-600 text-sm mb-2 flex items-center">
            <AlertCircle className="h-3.5 w-3.5 mr-1" />
            {formErrors.content}
          </p>
        )}
        <textarea
          value={essay.content}
          onChange={e => onContentChange(e.target.value)}
          className={`w-full p-3 rounded-lg border ${
            formErrors.content ? 'border-red-500' : 'border-[rgb(var(--border))]'
          } bg-[rgb(var(--card))]/60 text-[rgb(var(--text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))] transition-all min-h-[200px] resize-y`}
          placeholder="分享你的想法..."
          maxLength={MAX_CONTENT_LENGTH}
        />
        <div className="text-right text-xs text-[rgb(var(--muted))] mt-1">
          {essay.content.length}/{MAX_CONTENT_LENGTH}
        </div>
      </div>

      {/* 文件上传区域 */}
      <FileUpload
        localFiles={localFiles}
        uploadedFiles={essay.essayFileUrls || []}
        onFileSelect={onFileSelect}
        onOpenDeleteModal={onOpenFileDeleteModal}
        onAddUrl={onAddUrl}
        onMove={onMoveFile}
      />

      {/* 发布按钮 */}
      <div className="flex justify-end items-center gap-3">
        {isUploading && uploadProgress && (
          <span className="text-sm text-[rgb(var(--muted))]">
            正在上传 {uploadProgress.current}/{uploadProgress.total}：{uploadProgress.fileName}
          </span>
        )}
        <button
          onClick={onPublish}
          disabled={isBusy}
          className={`px-6 py-2.5 rounded-lg transition-all duration-300 bg-[rgb(var(--primary))] hover:bg-[rgb(var(--primary-hover))] text-white flex items-center gap-2 ${
            isBusy ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isBusy ? (
            <>
              <Loader2 className="animate-spin h-4 w-4" />
              {isUploading ? '上传文件中...' : '发布中...'}
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {essay.id ? '更新随笔' : '发布随笔'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
