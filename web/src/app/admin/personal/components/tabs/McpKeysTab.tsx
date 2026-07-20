'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Key, Plus, Trash2, RefreshCw, Copy, Check, Eye, EyeOff, Loader2, X } from 'lucide-react'
import { McpKeySummary, McpKeyDetail, useMcpKeys } from '../../hooks/useMcpKeys'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { showAlert } from '@/lib/alert'

interface McpKeysTabProps {
  keys: McpKeySummary[]
  loading: boolean
  opLoading: boolean
  revealedKey: McpKeyDetail | null
  setRevealedKey: (detail: McpKeyDetail | null) => void
  createKey: (name: string) => Promise<McpKeyDetail | null>
  deleteKey: (id: number) => Promise<void>
  toggleKey: (id: number, active: boolean) => Promise<void>
  regenerateKey: (id: number) => Promise<McpKeyDetail | null>
}

export function McpKeysTab(props: McpKeysTabProps) {
  const {
    keys,
    loading,
    opLoading,
    revealedKey,
    setRevealedKey,
    createKey,
    deleteKey,
    toggleKey,
    regenerateKey
  } = props

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [confirmRegenerate, setConfirmRegenerate] = useState<number | null>(null)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [showKeyValue, setShowKeyValue] = useState<Record<number, boolean>>({})

  const handleCreate = async () => {
    if (!newKeyName.trim()) {
      showAlert('请输入密钥名称')
      return
    }
    try {
      const detail = await createKey(newKeyName.trim())
      if (detail) {
        setRevealedKey(detail)
        setShowCreateDialog(false)
        setNewKeyName('')
        setShowKeyValue(prev => ({ ...prev, [detail.id]: true }))
      }
    } catch (err: any) {
      showAlert(err.message || '创建失败')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteKey(id)
      showAlert('删除成功', 'success')
    } catch (err: any) {
      showAlert(err.message || '删除失败')
    }
  }

  const handleRegenerate = async (id: number) => {
    try {
      const detail = await regenerateKey(id)
      if (detail) {
        setRevealedKey(detail)
        setShowKeyValue(prev => ({ ...prev, [detail.id]: true }))
        showAlert('密钥已轮转，新密钥仅显示一次', 'success')
      }
    } catch (err: any) {
      showAlert(err.message || '轮转失败')
    }
  }

  const handleToggle = async (id: number, active: boolean) => {
    try {
      await toggleKey(id, active)
    } catch (err: any) {
      showAlert(err.message || '操作失败')
    }
  }

  const handleCopy = async (key: string, id: number) => {
    try {
      await navigator.clipboard.writeText(key)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      showAlert('复制失败，请手动选中复制')
    }
  }

  return (
    <div className="bg-[rgb(var(--card))] backdrop-blur-sm rounded-b-xl shadow-sm border border-[rgb(var(--border))] border-t-0 overflow-hidden">
      <div className="py-3 px-6 border-b border-[rgb(var(--border))] flex justify-between items-center">
        <h2 className="text-lg font-semibold text-[rgb(var(--primary))] flex items-center">
          <Key className="h-5 w-5 mr-2" />
          MCP 密钥管理
        </h2>
        <button
          onClick={() => setShowCreateDialog(true)}
          disabled={opLoading}
          className="px-3 py-1.5 rounded-lg bg-[rgb(var(--primary))] hover:bg-[rgb(var(--primary-hover))] text-white text-sm flex items-center gap-1 transition-colors disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          新建密钥
        </button>
      </div>

      <div className="p-6 min-h-[90vh]">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-[rgb(var(--primary))]" />
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-10 text-[rgb(var(--text-muted))]">
            <p className="mb-2">暂无 MCP 密钥</p>
            <p className="text-sm">点击上方「新建密钥」创建第一个密钥，供外部 AI Agent 访问博客 MCP 服务。</p>
          </div>
        ) : (
          <div className="space-y-3">
            {keys.map(key => (
              <motion.div
                key={key.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`border rounded-lg p-4 transition-colors ${
                  key.active
                    ? 'border-[rgb(var(--border))] bg-[rgb(var(--bg))]'
                    : 'border-[rgb(var(--border))] bg-opacity-50 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-[rgb(var(--primary))] flex-shrink-0" />
                      <span className="font-medium truncate">{key.name}</span>
                    </div>
                    {revealedKey?.id === key.id && revealedKey.key && (
                      <div className="flex items-center gap-2 bg-[rgb(var(--hover))] rounded px-2 py-1 text-xs font-mono max-w-xs">
                        <button
                          onClick={() => setShowKeyValue(prev => ({ ...prev, [key.id]: !prev[key.id] }))}
                          className="flex-shrink-0 hover:text-[rgb(var(--primary))] transition-colors"
                        >
                          {showKeyValue[key.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </button>
                        <span className="truncate">
                          {showKeyValue[key.id] ? revealedKey.key : `${key.prefix}${'•'.repeat(24)}`}
                        </span>
                        {showKeyValue[key.id] && (
                          <button
                            onClick={() => handleCopy(revealedKey.key!, key.id)}
                            className="flex-shrink-0 hover:text-[rgb(var(--primary))] transition-colors"
                          >
                            {copiedId === key.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        key.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {key.active ? '已启用' : '已停用'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggle(key.id, !key.active)}
                        disabled={opLoading}
                        className="p-1.5 rounded hover:bg-[rgb(var(--hover))] text-[rgb(var(--text-muted))] transition-colors disabled:opacity-50"
                        title={key.active ? '停用' : '启用'}
                      >
                        {key.active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => setConfirmRegenerate(key.id)}
                        disabled={opLoading}
                        className="p-1.5 rounded hover:bg-[rgb(var(--hover))] text-[rgb(var(--text-muted))] transition-colors disabled:opacity-50"
                        title="轮转密钥"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(key.id)}
                        disabled={opLoading}
                        className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors disabled:opacity-50"
                        title="删除"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-2 text-xs text-[rgb(var(--text-muted))]">
                  <span>前缀: {key.prefix}</span>
                  {key.lastUsedAt && <span className="ml-3">最近使用: {new Date(key.lastUsedAt).toLocaleString()}</span>}
                  <span className="ml-3">创建时间: {new Date(key.createTime || Date.now()).toLocaleString()}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* 新建密钥弹窗 */}
      <AnimatePresence>
        {showCreateDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setShowCreateDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[rgb(var(--card))] rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">新建 MCP 密钥</h3>
              <input
                type="text"
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                placeholder="密钥名称，例如：Claude Desktop"
                className="w-full px-3 py-2 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--bg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
              <p className="text-xs text-[rgb(var(--text-muted))] mt-2">
                密钥创建后仅显示一次，请立即复制保存。
              </p>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowCreateDialog(false)}
                  className="px-4 py-2 rounded-lg border border-[rgb(var(--border))] hover:bg-[rgb(var(--hover))] transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCreate}
                  disabled={opLoading || !newKeyName.trim()}
                  className="px-4 py-2 rounded-lg bg-[rgb(var(--primary))] hover:bg-[rgb(var(--primary-hover))] text-white transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {opLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  创建
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 删除确认 */}
      <ConfirmDialog
        isOpen={confirmDelete !== null}
        title="删除密钥"
        message="确定删除此密钥？删除后所有使用该密钥的 Agent 将无法访问。"
        variant="danger"
        onConfirm={() => {
          if (confirmDelete !== null) {
            handleDelete(confirmDelete)
            setConfirmDelete(null)
          }
        }}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* 轮转确认 */}
      <ConfirmDialog
        isOpen={confirmRegenerate !== null}
        title="轮转密钥"
        message="确定轮转此密钥？旧密钥将立即失效，新密钥仅显示一次。"
        variant="warning"
        onConfirm={() => {
          if (confirmRegenerate !== null) {
            handleRegenerate(confirmRegenerate)
            setConfirmRegenerate(null)
          }
        }}
        onCancel={() => setConfirmRegenerate(null)}
      />

      {/* 密钥显示弹窗（创建/轮转后一次性显示） */}
      <AnimatePresence>
        {revealedKey && revealedKey.key && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[rgb(var(--card))] rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">密钥已生成</h3>
                <button
                  onClick={() => setRevealedKey(null)}
                  className="p-1 hover:bg-[rgb(var(--hover))] rounded transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-[rgb(var(--text-muted))] mb-3">
                请立即复制以下密钥，关闭后无法再次查看：
              </p>
              <div className="flex items-center gap-2 p-3 bg-[rgb(var(--hover))] rounded-lg font-mono text-sm break-all">
                <span className="flex-1">{revealedKey.key}</span>
                <button
                  onClick={() => handleCopy(revealedKey.key!, revealedKey.id)}
                  className="flex-shrink-0 p-2 hover:bg-[rgb(var(--card))] rounded transition-colors"
                  title="复制"
                >
                  {copiedId === revealedKey.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setRevealedKey(null)}
                  disabled={copiedId !== revealedKey.id}
                  className="px-4 py-2 rounded-lg bg-[rgb(var(--primary))] hover:bg-[rgb(var(--primary-hover))] text-white transition-colors disabled:opacity-50"
                >
                  {copiedId === revealedKey.id ? '已复制，关闭' : '请先复制'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
