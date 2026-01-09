'use client'

import { useState, useEffect } from 'react'
import BlogChart from '@/components/charts/BlogChart'
import TagChart from '@/components/charts/TagChart'
import TypeChart from '@/components/charts/TypeChart'
import VisitorMap from '@/components/charts/VisitorMap'
import { ENDPOINTS } from '@/lib/api'
import { BarChart3, FileText, ThumbsUp, MessageSquare, Eye, MapPin } from 'lucide-react'
import apiClient from '@/lib/utils' // 导入axios实例

// 定义类型
interface StatData {
  title: string
  value: number
  icon: React.ReactNode
}

export default function DashboardPage() {
  // 状态管理 - 默认选中访问量卡片（索引0）
  const [stats, setStats] = useState<StatData[]>([
    { title: '总访问量', value: 0, icon: <Eye className="h-5 w-5 text-blue-500 dark:text-blue-400" /> },
    { title: '博客总数', value: 0, icon: <FileText className="h-5 w-5 text-blue-500 dark:text-blue-400" /> },
    { title: '点赞数', value: 0, icon: <ThumbsUp className="h-5 w-5 text-blue-500 dark:text-blue-400" /> },
    { title: '评论数', value: 0, icon: <MessageSquare className="h-5 w-5 text-blue-500 dark:text-blue-400" /> }
  ])
  const [selectedCard, setSelectedCard] = useState(0) // 默认选中访问量卡片
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const [screenWidth, setScreenWidth] = useState<number | null>(null) // 初始为null，表示未获取到实际宽度

  // 检测客户端环境并设置初始屏幕宽度
  useEffect(() => {
    setIsClient(true)
    // 仅在客户端设置屏幕宽度
    setScreenWidth(window.innerWidth)

    const handleResize = () => {
      setScreenWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

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
      return { code: 500, data: 0 }
    }
  }

  // 获取统计数据
  const getCountList = async () => {
    try {
      setLoading(true)

      // 并行请求所有统计数据
      const [blogRes, viewRes, appreciateRes, commentRes] = await Promise.all([
        fetchData(ENDPOINTS.ADMIN.GETBLOGCOUNT),
        fetchData(ENDPOINTS.GET_VISIT_COUNT),
        fetchData(ENDPOINTS.ADMIN.GETBLOGLIKES),
        fetchData(ENDPOINTS.ADMIN.GETCOMMENTCOUNT)
      ])

      setStats([
        {
          title: '总访问量',
          value: viewRes.code === 200 ? viewRes.data : 0,
          icon: <Eye className="h-5 w-5 text-blue-500 dark:text-blue-400" />
        },
        {
          title: '博客总数',
          value: blogRes.code === 200 ? blogRes.data : 0,
          icon: <FileText className="h-5 w-5 text-blue-500 dark:text-blue-400" />
        },
        {
          title: '点赞数',
          value: appreciateRes.code === 200 ? appreciateRes.data : 0,
          icon: <ThumbsUp className="h-5 w-5 text-blue-500 dark:text-blue-400" />
        },
        {
          title: '评论数',
          value: commentRes.code === 200 ? commentRes.data : 0,
          icon: <MessageSquare className="h-5 w-5 text-blue-500 dark:text-blue-400" />
        }
      ])
    } catch (error) {
      console.log('Failed to fetch statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  // 组件挂载时获取数据
  useEffect(() => {
    getCountList()
  }, [])

  // 选择卡片的处理函数
  const selectCard = (id: number) => {
    setSelectedCard(id)
    console.log(id)
  }

  // 根据屏幕宽度确定图表高度
  const getChartHeight = () => {
    if (!screenWidth) return 350 // 默认高度，直到获取到实际屏幕宽度
    if (screenWidth < 640) return 250
    if (screenWidth < 1024) return 300
    return 350
  }

  // 小图表高度
  const getSmallChartHeight = () => {
    if (!screenWidth) return 300 // 默认高度，直到获取到实际屏幕宽度
    if (screenWidth < 640) return 200
    if (screenWidth < 1024) return 250
    return 300
  }

  // 生成骨架屏元素
  const renderSkeleton = (index: number) => {
    // 使用默认值或根据实际屏幕尺寸调整
    const currentWidth = screenWidth || 1200
    const iconSize = currentWidth < 640 ? 'h-4 w-4' : 'h-5 w-5'
    const titleWidth = currentWidth < 640 ? 'w-20' : 'w-24'
    const valueWidth = currentWidth < 640 ? 'w-28' : 'w-32'
    const valueHeight = currentWidth < 640 ? 'h-7' : 'h-8'

    // 根据索引获取对应图标
    const getIcon = () => {
      switch (index) {
        case 0:
          return <Eye className={iconSize} />
        case 1:
          return <FileText className={iconSize} />
        case 2:
          return <ThumbsUp className={iconSize} />
        case 3:
          return <MessageSquare className={iconSize} />
        default:
          return null
      }
    }

    return (
      <div className="space-y-3 animate-pulse h-full flex flex-col justify-center">
        <div
          className={`${iconSize} bg-slate-200/50 dark:bg-slate-700/50 rounded ${
            index === selectedCard ? 'text-blue-500 dark:text-blue-400' : ''
          }`}
        >
          {getIcon()}
        </div>
        <div className={`h-4 bg-slate-200/50 dark:bg-slate-700/50 rounded ${titleWidth}`}></div>
        <div className={`${valueHeight} bg-slate-200/50 dark:bg-slate-700/50 rounded ${valueWidth} mt-auto`}></div>
      </div>
    )
  }

  // 图表容器高度，避免布局抖动
  const chartContainerStyle = {
    height: getChartHeight(),
    minHeight: getChartHeight()
  }

  const smallChartContainerStyle = {
    height: getSmallChartHeight(),
    minHeight: getSmallChartHeight()
  }

  return (
    <div className="font-sans min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-blue-50 text-slate-800 dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-200 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(50,100,200,0.1)_0%,transparent_40%),radial-gradient(circle_at_80%_80%,rgba(80,120,250,0.1)_0%,transparent_40%)] dark:opacity-100 opacity-0"></div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-3 relative z-10">
        {/* 顶部统计卡片 - 响应式网格布局 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-4 md:mb-6">
          {stats.map((item, index) => {
            return (
              <div
                key={index}
                onClick={() => selectCard(index)}
                className={`bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200/50 p-4 sm:p-5 md:p-6 cursor-pointer transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 dark:bg-slate-800/40 dark:border-slate-700/50 ${
                  loading
                    ? index === selectedCard
                      ? 'ring-2 ring-blue-500 border-blue-500/30 dark:border-blue-500/30'
                      : 'hover:border-slate-300 dark:hover:border-slate-600'
                    : selectedCard === index
                    ? 'ring-2 ring-blue-500'
                    : 'hover:border-slate-300 dark:hover:border-slate-600'
                }`}
                style={{ minHeight: (screenWidth || 1200) < 640 ? '120px' : '140px' }}
              >
                {loading ? (
                  renderSkeleton(index)
                ) : (
                  <div className="h-full flex flex-col justify-between">
                    <div>{item.icon}</div>
                    <div className="mt-2">
                      <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">{item.title}</p>
                      <h2 className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 text-blue-600 dark:text-blue-100">
                        {item.value.toLocaleString()}
                      </h2>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 主要图表区域 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200/50 p-4 sm:p-6 mb-4 md:mb-6 transition-all duration-300 hover:shadow-lg dark:bg-slate-800/40 dark:border-slate-700/50">
          <div className="flex items-center mb-4 sm:mb-6">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" />
            <h2 className="text-lg sm:text-xl font-semibold text-blue-600 dark:text-blue-100">网站数据统计</h2>
          </div>
          <div className="w-full overflow-hidden" style={chartContainerStyle}>
            {screenWidth !== null && ( // 只在获取到实际屏幕宽度后渲染图表
              <BlogChart psMsg={selectedCard} style={{ width: '100%', height: '100%' }} />
            )}
          </div>
        </div>

        {/* 三个小图表区域 - 响应式布局 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-10">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200/50 p-4 sm:p-6 transition-all duration-300 hover:shadow-lg dark:bg-slate-800/40 dark:border-slate-700/50">
            <div className="flex items-center mb-4 sm:mb-6">
              <FileText className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" />
              <h2 className="text-base sm:text-lg font-semibold text-blue-600 dark:text-blue-100">标签分布</h2>
            </div>
            <div className="w-full overflow-hidden" style={smallChartContainerStyle}>
              {screenWidth !== null && <TagChart style={{ width: '100%', height: '100%' }} />}
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200/50 p-4 sm:p-6 transition-all duration-300 hover:shadow-lg dark:bg-slate-800/40 dark:border-slate-700/50">
            <div className="flex items-center mb-4 sm:mb-6">
              <FileText className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" />
              <h2 className="text-base sm:text-lg font-semibold text-blue-600 dark:text-blue-100">类型分布</h2>
            </div>
            <div className="w-full overflow-hidden" style={smallChartContainerStyle}>
              {screenWidth !== null && <TypeChart style={{ width: '100%', height: '100%' }} />}
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 p-4 sm:p-6 transition-all duration-300 hover:shadow-lg dark:bg-slate-800/40 dark:border-slate-700/50">
            <div className="flex items-center mb-4 sm:mb-6">
              <MapPin className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" />
              <h2 className="text-base sm:text-lg font-semibold text-blue-600 dark:text-blue-100">访问者分布</h2>
            </div>
            <div className="w-full overflow-hidden" style={smallChartContainerStyle}>
              {screenWidth !== null && <VisitorMap style={{ width: '100%', height: '100%' }} />}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}