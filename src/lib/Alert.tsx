import { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client' // 从react-dom/client导入createRoot
import { X, Check, AlertCircle, Info } from 'lucide-react'

// 定义提示类型
type AlertType = 'success' | 'error' | 'warning' | 'info'

// 提示配置
interface AlertOptions {
  type?: AlertType
  duration?: number
}

// 全局状态管理
let currentAlert: {
  visible: boolean
  message: string
  type: AlertType
  duration: number
  hide: () => void
  setters: {
    setVisible: (visible: boolean) => void
    setMessage: (message: string) => void
    setType: (type: AlertType) => void
  }
  timer: NodeJS.Timeout | null
} | null = null

// 提示组件
const AlertComponent = () => {
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState('')
  const [type, setType] = useState<AlertType>('info')
  const [duration] = useState(3000)
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null)

  // 初始化全局状态引用
  useEffect(() => {
    if (!currentAlert) {
      currentAlert = {
        visible,
        message,
        type,
        duration,
        hide,
        setters: { setVisible, setMessage, setType },
        timer: null
      }
    }
  }, [])

  // 隐藏提示
  const hide = () => {
    if (timer) {
      clearTimeout(timer)
      setTimer(null)
    }
    setVisible(false)
    if (currentAlert) {
      currentAlert.visible = false
      currentAlert.timer = null
    }
  }

  // 确保组件卸载时清除定时器
  useEffect(() => {
    return () => {
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [timer])

  return (
    <div
      className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-2000 transition-all duration-300 ease-in-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[-20px] pointer-events-none'
      }`}
    >
      <div
        className={`max-w-md w-full p-4 rounded-lg shadow-lg flex items-start gap-3 ${
          type === 'success'
            ? 'bg-green-50 border border-green-200'
            : type === 'error'
            ? 'bg-red-50 border border-red-200'
            : type === 'warning'
            ? 'bg-yellow-50 border border-yellow-200'
            : 'bg-blue-50 border border-blue-200'
        }`}
      >
        {/* 图标 */}
        <div
          className={`mt-0.5 flex-shrink-0 ${
            type === 'success'
              ? 'text-green-500'
              : type === 'error'
              ? 'text-red-500'
              : type === 'warning'
              ? 'text-yellow-500'
              : 'text-blue-500'
          }`}
        >
          {type === 'success' && <Check className="h-5 w-5" />}
          {type === 'error' && <AlertCircle className="h-5 w-5" />}
          {type === 'warning' && <AlertCircle className="h-5 w-5" />}
          {type === 'info' && <Info className="h-5 w-5" />}
        </div>

        {/* 消息文本 */}
        <p
          className={`flex-1 text-sm ${
            type === 'success'
              ? 'text-green-800'
              : type === 'error'
              ? 'text-red-800'
              : type === 'warning'
              ? 'text-yellow-800'
              : 'text-blue-800'
          }`}
        >
          {message}
        </p>

        {/* 关闭按钮 */}
        <button
          onClick={hide}
          className={`text-slate-400 hover:text-slate-600 p-1 transition-colors ${
            type === 'success'
              ? 'hover:bg-green-100'
              : type === 'error'
              ? 'hover:bg-red-100'
              : type === 'warning'
              ? 'hover:bg-yellow-100'
              : 'hover:bg-blue-100'
          } rounded-full`}
          aria-label="关闭提示"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// 初始化提示组件，将其挂载到body
const initializeAlert = () => {
  if (!document.getElementById('alert-container')) {
    const container = document.createElement('div')
    container.id = 'alert-container'
    document.body.appendChild(container)
    createRoot(container).render(<AlertComponent />)
  }
}

// 显示提示的函数
export const showAlert = (message: string, options: AlertOptions = {}) => {
  // 确保组件已初始化
  initializeAlert()

  if (!currentAlert) {
    // 给组件一点时间初始化
    setTimeout(() => showAlert(message, options), 100)
    return
  }

  // 清除之前的定时器
  if (currentAlert.timer) {
    clearTimeout(currentAlert.timer)
  }

  // 更新提示内容
  currentAlert.setters.setMessage(message)
  currentAlert.setters.setType(options.type || 'info')
  currentAlert.setters.setVisible(true)

  // 设置自动关闭定时器
  const duration = options.duration ?? 3000
  const newTimer = setTimeout(() => {
    currentAlert?.setters.setVisible(false)
    if (currentAlert) {
      currentAlert.timer = null
    }
  }, duration)

  currentAlert.timer = newTimer
}

// 隐藏提示的函数
export const hideAlert = () => {
  currentAlert?.hide()
}

// 特定类型的提示快捷方法
export const alertSuccess = (message: string, duration?: number) => {
  showAlert(message, { type: 'success', duration })
}

export const alertError = (message: string, duration?: number) => {
  showAlert(message, { type: 'error', duration })
}

export const alertWarning = (message: string, duration?: number) => {
  showAlert(message, { type: 'warning', duration })
}

export const alertInfo = (message: string, duration?: number) => {
  showAlert(message, { type: 'info', duration })
}
