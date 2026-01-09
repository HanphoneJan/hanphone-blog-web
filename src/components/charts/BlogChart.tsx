'use client'

import React, { useRef, useState, useEffect } from 'react'
import * as echarts from 'echarts'
import { ENDPOINTS } from '@/lib/api'
import apiClient from '@/lib/utils'

interface BlogChartProps {
  psMsg: number
  style?: React.CSSProperties
}

interface CountByMonthItem {
  date: string
  value: string
}

const BlogChart: React.FC<BlogChartProps> = ({ psMsg, style }) => {
  const blogRef = useRef<HTMLDivElement>(null)
  const [countByMonth, setCountByMonth] = useState<CountByMonthItem[]>([])
  const [chartInstance, setChartInstance] = useState<echarts.ECharts | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const selectList = ['访问量', '博客数', '点赞数', '评论数']
  const colorMap = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899']

  // 检测屏幕尺寸
  const checkScreenSize = () => {
    const width = window.innerWidth
    setIsMobile(width < 768)
    setIsTablet(width >= 768 && width < 1024)
  }

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
      return { code: 500, data: [] }
    }
  }

  // 初始化图表
  const initChart = () => {
    if (blogRef.current) {
      const instance = echarts.init(blogRef.current)
      setChartInstance(instance)

      // 响应式配置
      const mobileOptions = isMobile
        ? {
            grid: {
              top: '15%',
              left: '10%',
              right: '5%',
              bottom: '15%',
              containLabel: true
            },
            xAxis: {
              axisLabel: {
                rotate: 45,
                interval: 0,
                fontSize: 10,
                color: '#94a3b8'
              }
            },
            yAxis: {
              name: '',
              nameTextStyle: {
                fontSize: 10
              },
              axisLabel: {
                fontSize: 10
              }
            },
            legend: {
              itemWidth: 12,
              itemHeight: 8,
              textStyle: {
                fontSize: 10
              }
            }
          }
        : isTablet
        ? {
            grid: {
              top: '12%',
              left: '8%',
              right: '5%',
              bottom: '12%',
              containLabel: true
            },
            xAxis: {
              axisLabel: {
                rotate: 30,
                interval: 0,
                fontSize: 11,
                color: '#94a3b8'
              }
            }
          }
        : {}

      const initOption = {
        backgroundColor: 'transparent',
        legend: {
          orient: 'horizontal',
          x: 'center',
          y: 'top',
          data: [selectList[psMsg]], // 使用当前psMsg对应的名称
          textStyle: {
            color: '#e2e8f0',
            fontSize: 12
          },
          ...mobileOptions.legend
        },
        grid: {
          top: '12%',
          left: '5%',
          right: '5%',
          bottom: '10%',
          containLabel: true,
          ...mobileOptions.grid
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          },
          padding: [5, 10],
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          borderColor: 'rgba(71, 85, 105, 0.5)',
          borderWidth: 1,
          textStyle: {
            color: '#e2e8f0',
            fontSize: isMobile ? 12 : 14
          },
          confine: true
        },
        axisPointer: {
          type: 'shadow',
          label: {
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            fontSize: isMobile ? 10 : 12
          }
        },
        xAxis: {
          name: '月份',
          nameTextStyle: {
            fontSize: isMobile ? 10 : 12
          },
          type: 'category',
          axisLabel: {
            rotate: 20,
            interval: 0,
            color: '#94a3b8',
            fontSize: isMobile ? 10 : 12,
            ...mobileOptions.xAxis?.axisLabel
          },
          axisLine: {
            lineStyle: {
              color: 'rgba(71, 85, 105, 0.3)'
            }
          },
          boundaryGap: false,
          data: []
        },
        yAxis: {
          name: '数值',
          nameTextStyle: {
            fontSize: isMobile ? 10 : 12
          },
          type: 'value',
          axisLabel: {
            color: '#94a3b8',
            fontSize: isMobile ? 10 : 12,
            ...mobileOptions.yAxis?.axisLabel
          },
          axisLine: {
            lineStyle: {
              color: 'rgba(71, 85, 105, 0.3)'
            }
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(71, 85, 105, 0.1)'
            }
          }
        },
        series: [
          {
            name: selectList[psMsg], // 使用当前psMsg对应的名称
            data: [],
            type: 'line',
            symbol: isMobile ? 'circle' : 'circle',
            symbolSize: isMobile ? 4 : 6,
            smooth: 0.5,
            itemStyle: {
              color: colorMap[psMsg] || colorMap[0] // 使用当前psMsg对应的颜色
            },
            lineStyle: {
              color: colorMap[psMsg] || colorMap[0], // 使用当前psMsg对应的颜色
              width: isMobile ? 1.5 : 2
            },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  {
                    offset: 0,
                    color: `${colorMap[psMsg] || colorMap[0]}4D`
                  },
                  {
                    offset: 1,
                    color: `${colorMap[psMsg] || colorMap[0]}00`
                  }
                ]
              }
            },
            animationDuration: 2800,
            animationEasing: 'cubicInOut'
          }
        ]
      }

      instance.setOption(initOption)
    }
  }

  // 日期格式化
  const dateFormat = (originVal: Date): string => {
    const y = originVal.getFullYear()
    const m = (originVal.getMonth() + 1 + '').padStart(2, '0')
    return `${y}-${m}`
  }

  // 获取时间列表（最近7个月）
  const getTimeList = () => {
    const time = new Date()
    let month = time.getMonth()
    let year = time.getFullYear()
    const dateList: string[] = []

    for (let i = 0; i < 7; i++) {
      dateList.push(dateFormat(time))
      if (month === 0) {
        month = 11
        year = year - 1
      } else {
        month = month - 1
      }
      time.setFullYear(year)
      time.setMonth(month)
    }

    return dateList.reverse()
  }

  // 更新图表数据
  const updateChart = () => {
    if (!chartInstance) return

    const timeList = getTimeList()
    const seriesData: string[] = []

    timeList.forEach(date => {
      const found = countByMonth.find(item => item.date === date)
      seriesData.push(found ? found.value : '0')
    })

    const currentColor = colorMap[psMsg] || colorMap[0]

    // 响应式配置
    const mobileOptions = isMobile
      ? {
          series: [
            {
              symbolSize: 4,
              lineStyle: {
                width: 1.5
              }
            }
          ]
        }
      : {}

    const dataOption = {
      legend: {
        data: [selectList[psMsg]]
      },
      xAxis: {
        data: timeList
      },
      series: [
        {
          name: selectList[psMsg],
          data: seriesData.map(Number),
          itemStyle: {
            color: currentColor
          },
          lineStyle: {
            color: currentColor,
            width: isMobile ? 1.5 : 2,
            ...mobileOptions.series?.[0]?.lineStyle
          },
          symbolSize: isMobile ? 4 : 6,
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: `${currentColor}4D`
                },
                {
                  offset: 1,
                  color: `${currentColor}00`
                }
              ]
            }
          }
        }
      ]
    }

    chartInstance.setOption(dataOption)
  }

  // 屏幕适配
  const screenAdapter = () => {
    checkScreenSize()
    chartInstance?.resize()
  }

  // 统一的数据获取方法，根据类型获取不同数据
  const fetchDataByType = async (type: number) => {
    let url = ''
    switch (type) {
      case 0:
        url = ENDPOINTS.ADMIN.GET_VISIT_COUNT_BY_MONTH
        break
      case 1:
        url = ENDPOINTS.ADMIN.BLOGS_BY_MONTH
        break
      case 2:
        url = ENDPOINTS.ADMIN.LIKES_BY_MONTH
        break
      case 3:
        url = ENDPOINTS.ADMIN.COMMENTS_BY_MONTH
        break
      default:
        url = ENDPOINTS.ADMIN.VIEWS_BY_MONTH
    }

    const res = await fetchData(url)
    if (res.code === 200) {
      const list: CountByMonthItem[] = res.data.map((item: string) => {
        const [date, value] = item.split(',')
        return { date, value }
      })
      setCountByMonth(list)
    } else {
      console.log(`获取博客数据失败`)
    }
  }

  // 关键修复：当countByMonth或psMsg变化时更新图表
  useEffect(() => {
    if (chartInstance) {
      updateChart()
    }
  }, [countByMonth, chartInstance, psMsg, isMobile, isTablet]) // 添加psMsg到依赖项

  // 初始化图表和事件监听
  useEffect(() => {
    checkScreenSize()
    initChart()

    const handleResize = () => screenAdapter()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chartInstance?.dispose()
    }
  }, [])

  // 监听屏幕尺寸变化，重新初始化图表
  useEffect(() => {
    if (chartInstance) {
      initChart()
      if (countByMonth.length > 0) {
        updateChart()
      }
    }
  }, [isMobile, isTablet])

  // 图表实例就绪后加载初始数据
  useEffect(() => {
    if (chartInstance) {
      fetchDataByType(psMsg) // 直接使用当前的psMsg
    }
  }, [chartInstance])

  // 监听psMsg变化，更新数据
  useEffect(() => {
    if (chartInstance) {
      fetchDataByType(psMsg)
    }
  }, [psMsg, chartInstance])

  return (
    <div style={style} className="relative">
      <div ref={blogRef} className="w-full h-full min-h-[300px] md:min-h-[350px]" />
      {/* 移除了加载遮罩层 */}
    </div>
  )
}

export default BlogChart