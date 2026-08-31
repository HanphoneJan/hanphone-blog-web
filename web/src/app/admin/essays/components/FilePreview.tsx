'use client'

import Image from 'next/image'
import { X, Link2, ChevronUp, ChevronDown } from 'lucide-react'
import type { EssayFile, FileInfo } from '../types'
import { getFileIconByType, getFileName, isInternalFileUrl } from '../utils'

interface FilePreviewProps {
  file: FileInfo | EssayFile
  isLocal: boolean
  index: number
  onDelete: (index: number, isLocal: boolean, fileName: string, id?: number) => void
  onMove: (index: number, isLocal: boolean, direction: 'up' | 'down') => void
  canMoveUp: boolean
  canMoveDown: boolean
}

export function FilePreview({ file, isLocal, index, onDelete, onMove, canMoveUp, canMoveDown }: FilePreviewProps) {
  const renderMoveButtons = () => (
    <div className="absolute top-1 left-1 z-10 flex flex-col gap-0.5">
      {canMoveUp && (
        <button
          type="button"
          onClick={e => {
            e.stopPropagation()
            onMove(index, isLocal, 'up')
          }}
          className="bg-black/50 hover:bg-black/70 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="上移"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
      )}
      {canMoveDown && (
        <button
          type="button"
          onClick={e => {
            e.stopPropagation()
            onMove(index, isLocal, 'down')
          }}
          className="bg-black/50 hover:bg-black/70 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="下移"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )

  if (isLocal) {
    const localFile = file as FileInfo
    const FileIcon = getFileIconByType(localFile.type, localFile.file.name)

    return (
      <div className="relative rounded-lg overflow-hidden h-24 border border-blue-500/50 group">
        {localFile.type === 'IMAGE' ? (
          <Image
            src={localFile.previewUrl}
            alt={`待上传图片 ${index + 1}`}
            width={144}
            height={144}
            className="w-full h-full object-cover"
          />
        ) : localFile.type === 'VIDEO' ? (
          <video
            src={localFile.previewUrl}
            className="w-full h-full object-cover"
            controls={false}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[rgb(var(--hover))] p-2">
            <div className="text-[rgb(var(--primary))] mb-1">
              <FileIcon className="h-5 w-5" />
            </div>
            <span className="text-xs text-[rgb(var(--text))] truncate text-center">
              {localFile.file.name}
            </span>
          </div>
        )}
        <div className="absolute top-1 right-1 bg-blue-500/80 text-white text-xs px-1 rounded">
          待上传
        </div>
        {renderMoveButtons()}
        <button
          type="button"
          onClick={() => onDelete(index, true, localFile.file.name)}
          className="absolute inset-0 bg-[rgb(var(--overlay))]/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          aria-label="删除文件"
        >
          <X className="h-5 w-5 text-white" />
        </button>
      </div>
    )
  }

  const uploadedFile = file as EssayFile
  const fileName = getFileName(uploadedFile)
  const FileIcon = getFileIconByType(uploadedFile.urlType, fileName)
  const isExternal = !isInternalFileUrl(uploadedFile.url)

  return (
    <div className="relative rounded-lg overflow-hidden h-24 border border-slate-300 dark:border-slate-700 group">
      {uploadedFile.urlType === 'IMAGE' ? (
        <Image
          src={uploadedFile.url}
          alt={`文件 ${index + 1}`}
          width={144}
          height={144}
          className="w-full h-full object-cover"
        />
      ) : uploadedFile.urlType === 'VIDEO' ? (
        <video
          src={uploadedFile.url}
          className="w-full h-full object-cover"
          controls={false}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[rgb(var(--hover))] p-2">
          <div className="text-[rgb(var(--primary))] mb-1">
            <FileIcon className="h-5 w-5" />
          </div>
          <span className="text-xs text-[rgb(var(--text))] truncate text-center">
            {fileName}
          </span>
        </div>
      )}
      {isExternal && (
        <div className="absolute top-1 right-1 bg-purple-500/80 text-white text-xs px-1 rounded flex items-center gap-0.5">
          <Link2 className="h-3 w-3" />
          外链
        </div>
      )}
      {renderMoveButtons()}
      <button
        type="button"
        onClick={() => onDelete(index, false, fileName, uploadedFile.id)}
        className="absolute inset-0 bg-[rgb(var(--overlay))]/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        aria-label="删除文件"
      >
        <X className="h-5 w-5 text-white" />
      </button>
    </div>
  )
}
