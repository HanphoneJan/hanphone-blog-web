'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Link2, User, Image, Rss, Palette, FileText, Send, Loader2, Check, Copy } from 'lucide-react'
import { ENDPOINTS } from '@/lib/api'
import { SITE_URL } from '@/lib/seo-config'

import { API_CODE } from '@/lib/constants'
interface ApplyModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: 'form' | 'text' | 'copy'
}

type TabType = 'form' | 'text' | 'copy'

interface FormData {
  name: string
  url: string
  link_url: string
  description: string
  nickname: string
  avatar: string
  siteshot: string
  rss: string
  color: string
  applyText: string
}

const initialFormData: FormData = {
  name: '',
  url: '',
  link_url: '',
  description: '',
  nickname: '',
  avatar: '',
  siteshot: '',
  rss: '',
  color: '#1890ff',
  applyText: ''
}

// 示例文本
const EXAMPLE_TEXT = `支持中文键值对、JSON、YAML 或 Hexo/Butterfly 主题格式：

name: 云林有风
description: 不骛于虚声
url: ${SITE_URL}
link_url: ${SITE_URL}
avatar: ${SITE_URL}/avatar.png
siteshot: ${SITE_URL}/og-image.png
rss: ${SITE_URL}/rss.xml
nickname: 寒枫
color: #1890ff

也支持中文写法：名称 / 链接 / 描述 / 头像 / 截图 / 订阅 / 昵称 / 颜色 / 回访地址`

const SITE_INFO = {
  name: '云林有风',
  description: '不骛于虚声',
  url: SITE_URL,
  link_url: `${SITE_URL}/links`,
  avatar: `${SITE_URL}/avatar.png`,
  siteshot: `${SITE_URL}/og-image.png`,
  rss: `${SITE_URL}/rss.xml`,
  nickname: '寒枫',
  color: '#1890ff',
}

type CopyFormat = 'yaml' | 'json' | 'chinese' | 'butterfly'

const FORMATS: Record<CopyFormat, { label: string; content: string }> = {
  yaml: {
    label: 'YAML',
    content: `name: ${SITE_INFO.name}
description: ${SITE_INFO.description}
url: ${SITE_URL}
link_url: ${SITE_URL}/links
avatar: ${SITE_URL}/avatar.png
siteshot: ${SITE_URL}/og-image.png
rss: ${SITE_URL}/rss.xml
nickname: ${SITE_INFO.nickname}
color: "${SITE_INFO.color}"`
  },
  json: {
    label: 'JSON',
    content: JSON.stringify(SITE_INFO, null, 2)
  },
  chinese: {
    label: '中文键值对',
    content: `名称: ${SITE_INFO.name}
描述: ${SITE_INFO.description}
链接: ${SITE_URL}
回访地址: ${SITE_URL}/links
头像: ${SITE_URL}/avatar.png
截图: ${SITE_URL}/og-image.png
RSS: ${SITE_URL}/rss.xml
昵称: ${SITE_INFO.nickname}
装饰色: ${SITE_INFO.color}`
  },
  butterfly: {
    label: 'Butterfly',
    content: `- name: ${SITE_INFO.name}
  link: ${SITE_URL}
  avatar: ${SITE_URL}/avatar.png
  descr: ${SITE_INFO.description}`
  }
}

export default function ApplyModal({ isOpen, onClose, defaultTab = 'copy' }: ApplyModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [copyFormat, setCopyFormat] = useState<CopyFormat>('yaml')
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(FORMATS[copyFormat].content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  // 模态框打开时同步到 defaultTab
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab)
    }
  }, [isOpen, defaultTab])

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    
    try {
      const payload: Record<string, unknown> = {
        name: formData.name,
        url: formData.url,
        link_url: formData.link_url,
        description: formData.description,
        type: 'friend',
        color: formData.color,
        avatar: formData.avatar,
        siteshot: formData.siteshot,
        rss: formData.rss,
        nickname: formData.nickname,
        recommend: false,
        published: false
      }

      // 如果使用文本粘贴模式，添加 applyText
      if (activeTab === 'text' && formData.applyText) {
        payload.applyText = formData.applyText
      }

      const res = await fetch(ENDPOINTS.FRIENDLINKS_APPLY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (data.flag && data.code === API_CODE.SUCCESS) {
        setSuccess(true)
        setTimeout(() => {
          setSuccess(false)
          setFormData(initialFormData)
          onClose()
        }, 2000)
      } else {
        setError(data.message || '提交失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const isValid = activeTab === 'form'
    ? formData.name.trim() && formData.url.trim() && formData.description.trim()
    : formData.applyText.trim()

  if (!isOpen) return null

  const modal = (
    <div 
      className="fixed inset-0 z-[9999] bg-[rgb(var(--overlay))]/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[rgb(var(--bg))] border-2 border-[rgb(var(--text))]"
        onClick={e => e.stopPropagation()}
      >
        {/* 阴影层 */}
        <div 
          className="absolute inset-0 bg-[rgb(var(--primary))] -z-10"
          style={{ transform: 'translate(6px, 6px)' }}
        />
        
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center border-2 border-[rgb(var(--text))] bg-[rgb(var(--bg))] font-bold hover:bg-[rgb(var(--primary))] transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 标题 */}
        <div className="p-6 border-b-2 border-[rgb(var(--text))]">
          <div className="flex items-center gap-3">
            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[16px] border-b-[rgb(var(--primary))]" />
            <h3 className="text-xl font-black" style={{ fontFamily: 'var(--font-body)' }}>
              {activeTab === 'copy' ? '友链信息' : '申请友链'}
            </h3>
          </div>
          
          {/* Tab 切换 */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('copy')}
              className={`flex-1 py-2 px-2 border-2 font-bold transition-colors text-sm ${
                activeTab === 'copy'
                  ? 'bg-[rgb(var(--primary))] text-white border-[rgb(var(--primary))]'
                  : 'bg-[rgb(var(--bg))] border-[rgb(var(--text))] hover:bg-[rgb(var(--muted))]'
              }`}
            >
              获取友链
            </button>
            <button
              onClick={() => setActiveTab('form')}
              className={`flex-1 py-2 px-2 border-2 font-bold transition-colors text-sm ${
                activeTab === 'form'
                  ? 'bg-[rgb(var(--primary))] text-white border-[rgb(var(--primary))]'
                  : 'bg-[rgb(var(--bg))] border-[rgb(var(--text))] hover:bg-[rgb(var(--muted))]'
              }`}
            >
              表单填写
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`flex-1 py-2 px-2 border-2 font-bold transition-colors text-sm ${
                activeTab === 'text'
                  ? 'bg-[rgb(var(--primary))] text-white border-[rgb(var(--primary))]'
                  : 'bg-[rgb(var(--bg))] border-[rgb(var(--text))] hover:bg-[rgb(var(--muted))]'
              }`}
            >
              文本粘贴
            </button>
          </div>
        </div>

        {/* 内容 */}
        <div className="p-6">
          {activeTab === 'copy' && (
            <div className="space-y-4">
              <p className="text-sm opacity-80">
                申请友链前请先添加本站为友链，要求网站无违法违规内容、无强制广告和恶意信息，推荐使用 HTTPS。
              </p>

              {/* 格式选择 */}
              <div className="flex gap-2">
                {(Object.entries(FORMATS) as [CopyFormat, { label: string; content: string }][]).map(([key, { label }]) => (
                  <button
                    key={key}
                    onClick={() => setCopyFormat(key)}
                    className={`px-3 py-1.5 text-xs font-bold border-2 transition-colors ${
                      copyFormat === key
                        ? 'bg-[rgb(var(--primary))] text-white border-[rgb(var(--primary))]'
                        : 'bg-[rgb(var(--bg))] border-[rgb(var(--text))] hover:bg-[rgb(var(--muted))]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* 代码预览 */}
              <div className="relative">
                <pre className="border-2 border-[rgb(var(--text))] bg-[rgb(var(--muted))] p-4 text-xs font-mono whitespace-pre-wrap break-all overflow-x-auto max-h-64">
                  {FORMATS[copyFormat].content}
                </pre>
              </div>

              {/* 复制按钮 */}
              <button
                onClick={handleCopy}
                className="w-full py-2.5 border-2 border-[rgb(var(--primary))] bg-[rgb(var(--primary))] text-white font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    一键复制
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === 'form' && (
            <div className="space-y-4">
              {/* 网站名称 */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold mb-2">
                  <Link2 className="w-4 h-4" />
                  网站名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => handleChange('name', e.target.value)}
                  placeholder="你的网站名称"
                  className="w-full px-3 py-2 border-2 border-[rgb(var(--text))] bg-[rgb(var(--bg))] focus:outline-none focus:border-[rgb(var(--primary))]"
                />
              </div>

              {/* 网站地址 */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold mb-2">
                  <Link2 className="w-4 h-4" />
                  网站地址 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.url}
                  onChange={e => handleChange('url', e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border-2 border-[rgb(var(--text))] bg-[rgb(var(--bg))] focus:outline-none focus:border-[rgb(var(--primary))]"
                />
              </div>

              {/* 回访地址（本站在你站的链接） */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold mb-2">
                  <Link2 className="w-4 h-4" />
                  回访地址
                  <span className="text-xs opacity-50 font-normal">（本站在你站中的链接）</span>
                </label>
                <input
                  type="text"
                  value={formData.link_url}
                  onChange={e => handleChange('link_url', e.target.value)}
                  placeholder="https://example.com/links"
                  className="w-full px-3 py-2 border-2 border-[rgb(var(--text))] bg-[rgb(var(--bg))] focus:outline-none focus:border-[rgb(var(--primary))]"
                />
              </div>

              {/* 网站描述 */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold mb-2">
                  <FileText className="w-4 h-4" />
                  网站描述 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => handleChange('description', e.target.value)}
                  placeholder="简短描述你的网站"
                  className="w-full px-3 py-2 border-2 border-[rgb(var(--text))] bg-[rgb(var(--bg))] focus:outline-none focus:border-[rgb(var(--primary))]"
                />
              </div>

              {/* 站长昵称 */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold mb-2">
                  <User className="w-4 h-4" />
                  站长昵称
                </label>
                <input
                  type="text"
                  value={formData.nickname}
                  onChange={e => handleChange('nickname', e.target.value)}
                  placeholder="你的昵称"
                  className="w-full px-3 py-2 border-2 border-[rgb(var(--text))] bg-[rgb(var(--bg))] focus:outline-none focus:border-[rgb(var(--primary))]"
                />
              </div>

              {/* 头像 URL */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold mb-2">
                  <Image className="w-4 h-4" />
                  头像地址
                </label>
                <input
                  type="text"
                  value={formData.avatar}
                  onChange={e => handleChange('avatar', e.target.value)}
                  placeholder="https://example.com/avatar.png"
                  className="w-full px-3 py-2 border-2 border-[rgb(var(--text))] bg-[rgb(var(--bg))] focus:outline-none focus:border-[rgb(var(--primary))]"
                />
              </div>

              {/* 站点截图 */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold mb-2">
                  <Image className="w-4 h-4" />
                  站点截图
                </label>
                <input
                  type="text"
                  value={formData.siteshot}
                  onChange={e => handleChange('siteshot', e.target.value)}
                  placeholder="https://example.com/screenshot.png"
                  className="w-full px-3 py-2 border-2 border-[rgb(var(--text))] bg-[rgb(var(--bg))] focus:outline-none focus:border-[rgb(var(--primary))]"
                />
              </div>

              {/* RSS */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold mb-2">
                  <Rss className="w-4 h-4" />
                  RSS 地址
                </label>
                <input
                  type="text"
                  value={formData.rss}
                  onChange={e => handleChange('rss', e.target.value)}
                  placeholder="https://example.com/rss.xml"
                  className="w-full px-3 py-2 border-2 border-[rgb(var(--text))] bg-[rgb(var(--bg))] focus:outline-none focus:border-[rgb(var(--primary))]"
                />
              </div>

              {/* 主题颜色 */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold mb-2">
                  <Palette className="w-4 h-4" />
                  主题颜色
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={e => handleChange('color', e.target.value)}
                    className="w-12 h-10 border-2 border-[rgb(var(--text))] cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={e => handleChange('color', e.target.value)}
                    placeholder="#1890ff"
                    className="flex-1 px-3 py-2 border-2 border-[rgb(var(--text))] bg-[rgb(var(--bg))] focus:outline-none focus:border-[rgb(var(--primary))]"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-4">
              <div className="bg-[rgb(var(--muted))] border-2 border-[rgb(var(--text))] p-4">
                <p className="text-sm font-bold mb-2">粘贴格式示例：</p>
                <pre className="text-xs text-[rgb(var(--text-muted))] whitespace-pre-wrap">
                  {EXAMPLE_TEXT}
                </pre>
              </div>

              <textarea
                value={formData.applyText}
                onChange={e => handleChange('applyText', e.target.value)}
                placeholder="在此粘贴你的友链信息..."
                rows={10}
                className="w-full px-3 py-2 border-2 border-[rgb(var(--text))] bg-[rgb(var(--bg))] focus:outline-none focus:border-[rgb(var(--primary))] font-mono text-sm resize-none"
              />
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="mt-4 p-3 border-2 border-red-500 bg-red-50 text-red-700 text-sm font-bold">
              {error}
            </div>
          )}

          {/* 成功提示 */}
          {success && (
            <div className="mt-4 p-3 border-2 border-green-500 bg-green-50 text-green-700 text-sm font-bold flex items-center gap-2">
              <Check className="w-4 h-4" />
              申请已提交，等待审核
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="p-6 border-t-2 border-[rgb(var(--text))] flex gap-3">
          {activeTab === 'copy' ? (
            <button
              onClick={onClose}
              className="flex-1 py-3 border-2 border-[rgb(var(--text))] font-bold hover:bg-[rgb(var(--muted))] transition-colors"
            >
              关闭
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="flex-1 py-3 border-2 border-[rgb(var(--text))] font-bold hover:bg-[rgb(var(--muted))] transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isValid || loading}
                className="flex-1 py-3 border-2 border-[rgb(var(--primary))] bg-[rgb(var(--primary))] text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    提交申请
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
