'use client'

import { useState } from 'react'
import { Link2, Plus } from 'lucide-react'
import type { EssayFile, FileInfo } from '../types'
import { FilePreview } from './FilePreview'

interface FileUploadProps {
  localFiles: FileInfo[]
  uploadedFiles: EssayFile[]
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onOpenDeleteModal: (index: number, isLocal: boolean, fileName: string, id?: number) => void
  onAddUrl: (url: string) => boolean
  onMove: (index: number, isLocal: boolean, direction: 'up' | 'down') => void
}

export function FileUpload({
  localFiles,
  uploadedFiles,
  onFileSelect,
  onOpenDeleteModal,
  onAddUrl,
  onMove
}: FileUploadProps) {
  const [urlInput, setUrlInput] = useState('')
  const totalCount = localFiles.length + uploadedFiles.length

  // 提交URL输入
  const handleAddUrl = () => {
    const trimmed = urlInput.trim()
    if (!trimmed) return
    if (onAddUrl(trimmed)) {
      setUrlInput('')
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-[rgb(var(--text))] mb-2">
        文件 ({totalCount})
        <span className="text-xs text-[rgb(var(--muted))] ml-2">
          支持图片、视频、PDF、Word、PPT、MD等格式，也可直接填入文件URL
        </span>
      </label>

      {/* URL直填输入 */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Link2 className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]" />
          <input
            type="text"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddUrl()
              }
            }}
            placeholder="直接填入文件URL，如 https://example.com/file.jpg"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))]/60 text-sm text-[rgb(var(--text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))] transition-all"
          />
        </div>
        <button
          type="button"
          onClick={handleAddUrl}
          disabled={!urlInput.trim()}
          className="px-4 py-2 rounded-lg text-sm border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--text))] hover:border-[rgb(var(--primary))] hover:text-[rgb(var(--primary))] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          添加URL
        </button>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {/* 上传按钮 */}
        <label className="border-2 border-dashed border-[rgb(var(--border))] rounded-lg p-4 h-24 flex flex-col items-center justify-center text-[rgb(var(--muted))] hover:border-[rgb(var(--primary))] hover:text-[rgb(var(--primary))] cursor-pointer transition-colors">
          <Plus className="h-6 w-6 mb-1" />
          <span className="text-xs">添加文件</span>
          <input
            type="file"
            accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.md,.txt"
            multiple
            onChange={onFileSelect}
            className="hidden"
          />
        </label>

        {/* 已选择的本地文件（未上传） */}
        {localFiles.map((file, index) => (
          <FilePreview
            key={`local-${index}`}
            file={file}
            isLocal={true}
            index={index}
            onDelete={onOpenDeleteModal}
            onMove={onMove}
            canMoveUp={index > 0}
            canMoveDown={index < localFiles.length - 1}
          />
        ))}

        {/* 已上传的文件 / URL文件 */}
        {uploadedFiles.map((file, index) => (
          <FilePreview
            key={`uploaded-${file.id}-${index}`}
            file={file}
            isLocal={false}
            index={index}
            onDelete={onOpenDeleteModal}
            onMove={onMove}
            canMoveUp={index > 0}
            canMoveDown={index < uploadedFiles.length - 1}
          />
        ))}
      </div>
    </div>
  )
}
