'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGithub, faBilibili } from '@fortawesome/free-brands-svg-icons'
import { Mail, Eye, TrendingUp } from 'lucide-react'
import { ENDPOINTS } from '@/lib/api'
import apiClient from '@/lib/utils'

// 定义接口返回数据类型
interface VisitCountResponse {
  flag: boolean
  code: number
  message: string
  data: number
}

const Footer: React.FC = () => {
  const [totalVisitCount, setTotalVisitCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchVisitCount = async () => {
      try {
        setLoading(true)
        const response = await apiClient.get<VisitCountResponse>(ENDPOINTS.GET_VISIT_COUNT)

        if (response.data.flag && response.data.code === 200) {
          setTotalVisitCount(response.data.data)
          setError(false)
        } else {
          console.error('获取访问量失败:', response.data.message)
          setError(true)
        }
      } catch (err) {
        console.error('Failed to fetch visit count:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchVisitCount()
  }, [])

  return (
    <footer className="z-5 relative bg-transparent dark:bg-slate-900/60 text-slate-800 dark:text-white py-8 mt-8 lg:mt-16">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* 主要内容区域 - 采用响应式网格布局 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 mb-8">
          {/* 二维码区域 - 在小屏幕占满宽度，大屏幕占2列 */}
          <div className="md:col-span-2 flex flex-col items-center md:items-start">
            <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-lg mb-2 transform transition-transform duration-300 hover:scale-105">
              <Image
                src="https://hanphone.top/images/云林有风公众号.jpg"
                alt="博客二维码"
                className="qr-code"
                width={140}
                height={140}
                sizes="140px"
                priority={true}
              />
            </div>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1 text-center md:text-left">
              扫码关注公众号
            </p>
          </div>

          {/* 联系我区域 - 小屏幕占满，大屏幕占3列 */}
          <div className="md:col-span-3 flex flex-col">
            <h4 className="text-lg font-semibold mb-4 pb-2 border-b border-slate-200 dark:border-gray-700 relative after:absolute after:left-0 after:bottom-0 after:h-0.5 after:w-12 after:bg-blue-500">
              联系我
            </h4>
            <div className="flex flex-col h-full justify-between">
              <p className="flex items-center text-slate-600 dark:text-gray-300 text-sm sm:text-base transition-colors duration-300 hover:text-blue-400 mb-4">
                <Mail className="mr-2 h-4 w-4 text-blue-400 flex-shrink-0" />
                <span className="truncate whitespace-nowrap">Janhizian@163.com</span>
              </p>

              <div className="flex space-x-3">
                <a
                  href="https://github.com/HanphoneJan/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 p-2.5 rounded-full transition-all duration-300 transform hover:-translate-y-1 shadow-md flex items-center justify-center"
                  aria-label="GitHub"
                >
                  <FontAwesomeIcon
                    icon={faGithub}
                    className="h-4 w-4 text-slate-700 dark:text-white"
                  />
                </a>
                <a
                  href="https://space.bilibili.com/649062555/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-100 dark:bg-gray-800 hover:bg-pink-100 dark:hover:bg-pink-600 p-2.5 rounded-full transition-all duration-300 transform hover:-translate-y-1 shadow-md"
                  aria-label="Bilibili"
                >
                  <FontAwesomeIcon
                    icon={faBilibili}
                    className="h-4 w-4 text-pink-600 dark:text-white"
                  />
                </a>
              </div>
            </div>
          </div>

          {/* 博客简介 - 小屏幕占满，大屏幕占4列 */}
          <div className="md:col-span-4">
            <h4 className="text-lg font-semibold mb-4 pb-2 border-b border-slate-200 dark:border-gray-700 relative after:absolute after:left-0 after:bottom-0 after:h-0.5 after:w-12 after:bg-blue-500">
              博客简介
            </h4>
            <p className="text-slate-600 dark:text-gray-300 text-sm leading-6 mb-4">
              专注于分享技术心得与生活感悟，不骛于虚声，不驰于空想。
              在这里，你可以找到有价值的思考与实践经验。
            </p>
            <div className="flex flex-wrap gap-2 mt-auto">
              <span className="px-3 py-1 bg-slate-100 dark:bg-gray-800 rounded-full text-xs text-slate-600 dark:text-gray-300">
                全栈开发
              </span>
              <span className="px-3 py-1 bg-slate-100 dark:bg-gray-800 rounded-full text-xs text-slate-600 dark:text-gray-300">
                技术思考
              </span>
              <span className="px-3 py-1 bg-slate-100 dark:bg-gray-800 rounded-full text-xs text-slate-600 dark:text-gray-300">
                生活感悟
              </span>
              <span className="px-3 py-1 bg-slate-100 dark:bg-gray-800 rounded-full text-xs text-slate-600 dark:text-gray-300">
                实践经验
              </span>
            </div>
          </div>

          {/* 访问统计区域 - 小屏幕占满，大屏幕占3列 */}
          <div className="md:col-span-3">
            <h4 className="text-lg font-semibold mb-4 pb-2 border-b border-slate-200 dark:border-gray-700 relative after:absolute after:left-0 after:bottom-0 after:h-0.5 after:w-12 after:bg-blue-500">
              站点数据
            </h4>
            <div className="h-full flex flex-col justify-start">
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-slate-50/40 to-blue-50/40 dark:from-slate-800/50 dark:to-cyan-900/20 rounded-xl border border-slate-200/60 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-300 group">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-cyan-500/80 to-blue-600/80 rounded-lg">
                  <Eye className="h-5 w-5 text-white" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-slate-500 dark:text-gray-400 font-medium">
                      总访问量
                    </span>
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  </div>

                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-24 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-gray-700 dark:to-gray-600 rounded-md animate-pulse"></div>
                    </div>
                  ) : error ? (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 dark:text-gray-500 text-sm font-medium">
                        数据加载失败
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                        {totalVisitCount?.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-gray-500 font-medium">
                        次访问
                      </span>
                    </div>
                  )}
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-gray-700 my-6 opacity-60"></div>

        {/* 底部信息区域 - 优化响应式布局 */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 dark:text-gray-400 text-sm text-center md:text-left">
            © {new Date().getFullYear()} By Hanphone. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-gray-500">
            <Link href="/terms" className="hover:text-blue-400 transition-colors duration-300">
              用户协议
            </Link>
            <Link href="/privacy" className="hover:text-blue-400 transition-colors duration-300">
              隐私条款
            </Link>
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-400 transition-colors duration-300"
            >
              备案号：粤ICP备2024325722号-1
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
