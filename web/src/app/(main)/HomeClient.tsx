'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Filter, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Footer from '@/components/Footer'
import { PAGINATION, HOME_CONFIG, TIME, ROUTES } from '@/lib/constants'
import { HOME_LABELS } from '@/lib/labels'

import { useHomeCache } from './hooks/useHomeCache'

import './home.css'
import { useHomeData } from './hooks/useHomeData'
import { isCompactLayout } from './utils'

import { BlogList } from './components/BlogList'
import { Sidebar } from './components/Sidebar'
import { Pagination } from './components/Pagination'
import { HeroSection } from './components/HeroSection'
import { FeaturedSection } from './components/FeaturedSection'
import { ProjectSection } from './components/ProjectSection'
import { ProfileCard } from './components/ProfileCard'

import type { HomeQueryInfo, Blog, Type, Tag, Essay, Project, SiteStats } from './types'

// 动画变体定义
const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
} as const

const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut'
    }
  }
} as const

const headerVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut'
    }
  }
} as const

const counterVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      delay: 0.3,
      type: 'spring',
      stiffness: 300
    }
  }
} as const

interface HomeClientProps {
  initialBlogs: Blog[]
  initialTypes: Type[]
  initialTags: Tag[]
  initialRecommendList: Blog[]
  initialTotal: number
  initialEssays: Essay[]
  initialProjects: Project[]
  initialSiteStats: SiteStats
}

export default function HomeClient({
  initialBlogs,
  initialTypes,
  initialTags,
  initialRecommendList,
  initialTotal,
  initialEssays,
  initialProjects,
  initialSiteStats
}: HomeClientProps) {
  // 缓存
  const { getFromCache, setCache } = useHomeCache()

  // 查询参数状态
  const [queryInfo, setQueryInfo] = useState<HomeQueryInfo>({
    query: '',
    pagenum: PAGINATION.DEFAULT_PAGE,
    pagesize: PAGINATION.HOME_BLOG_PAGE_SIZE
  })

  // 筛选状态
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null)
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [selectMethod, setSelectMethod] = useState<string>(HOME_LABELS.ALL_BLOGS)
  const [selected, setSelected] = useState(false)

  // UI状态
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : HOME_CONFIG.INIT_SCREEN_WIDTH
  )

  // 数据管理 - 传入初始数据
  const {
    blogList,
    typeList,
    tagList,
    recommendList,
    totalcount,
    blogListLoading,
    typeListLoading,
    tagListLoading,
    recommendListLoading,
    blogListVisible,
    typeListVisible,
    tagListVisible,
    recommendListVisible,
    getBlogList,
    getTypeList,
    getTagList,
    getRecommendList,
    setBlogList,
    setTotalcount
  } = useHomeData({
    queryInfo,
    selectedTypeId,
    selectedTagIds,
    getFromCache,
    setCache,
    initialBlogs,
    initialTypes,
    initialTags,
    initialRecommendList,
    initialTotal
  })

  // 分页布局
  const isCompact = useMemo(() => isCompactLayout(screenWidth), [screenWidth])

  // 监听屏幕尺寸变化
  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 获取初始数据（仅在需要时）
  useEffect(() => {
    if (initialBlogs.length === 0) {
      getTypeList()
      getBlogList()
      getTagList()
      getRecommendList()
    }
  }, [getTypeList, getBlogList, getTagList, getRecommendList, initialBlogs.length])

  // 当查询信息变化时重新获取博客列表 - 添加防抖
  useEffect(() => {
    if (selectedTypeId === null && selectedTagIds.length === 0) {
      const timer = setTimeout(() => {
        getBlogList()
      }, TIME.DEBOUNCE_DELAY)
      return () => clearTimeout(timer)
    }
  }, [queryInfo, getBlogList, selectedTypeId, selectedTagIds])

  // 更新selectMethod显示当前选中的分类与标签
  const updateSelectMethod = useCallback(() => {
    let methodText = ''

    if (selectedTypeId !== null) {
      const type = typeList.find(item => item.id === selectedTypeId)
      if (type) methodText += `分类: ${type.name}`
    }

    if (selectedTagIds.length > 0) {
      if (methodText) methodText += ' + '
      methodText += '标签: '

      const tagNames = selectedTagIds
        .map(tagId => {
          const tag = tagList.find(item => item.id === tagId)
          return tag ? tag.name : ''
        })
        .filter(name => name)

      methodText += tagNames.join(', ')
    }

    if (!methodText) {
      methodText = HOME_LABELS.ALL_BLOGS
    }

    setSelectMethod(methodText)
  }, [selectedTypeId, selectedTagIds, typeList, tagList])

  // 在 typeList 和 tagList 加载完成后更新 selectMethod
  useEffect(() => {
    if (typeList.length > 0 || tagList.length > 0) {
      updateSelectMethod()
    }
  }, [typeList, tagList, updateSelectMethod])

  // 修改当前页码
  const handleCurrentChange = useCallback(
    (newPage: number) => {
      setQueryInfo(prev => ({ ...prev, pagenum: newPage }))
      const el = document.getElementById('blogListSection')
      if (el) {
        const headerHeight = document.querySelector('.site-header')?.clientHeight || 56
        const rect = el.getBoundingClientRect()
        const scrollTop = window.scrollY || document.documentElement.scrollTop
        window.scrollTo({ top: rect.top + scrollTop - headerHeight - 16, behavior: 'smooth' })
      }
    },
    [setQueryInfo]
  )

  // 处理分页输入变化
  const handlePageInputChange = useCallback(
    (page: number) => {
      setQueryInfo(prev => ({ ...prev, pagenum: page }))
    },
    [setQueryInfo]
  )

  // 按分类筛选博客
  const handleSelectType = useCallback(
    async (id: number) => {
      setSelectedTypeId(id)
      setSelected(true)

      // 创建缓存键
      const cacheKey = `type_${id}_tags_${selectedTagIds.join(',')}`
      let filteredBlogs = getFromCache<typeof blogList>(cacheKey)

      if (!filteredBlogs) {
        // 获取分类下的博客
        try {
          const typeRes = await fetch(`/api/types/${id}`)
          const typeData = await typeRes.json()
          filteredBlogs = typeData.data?.content || []

          // 如果有选中的标签，进一步筛选
          if (selectedTagIds.length > 0) {
            const tagPromises = selectedTagIds.map(tagId =>
              fetch(`/api/tags/${tagId}`).then(res => res.json())
            )

            const tagResponses = await Promise.all(tagPromises)
            const tagBlogsArrays = tagResponses.map(res => res.data?.content || [])

            filteredBlogs = filteredBlogs.filter(blog =>
              tagBlogsArrays.every((tagBlogs: Blog[]) =>
                tagBlogs.some((tagBlog: Blog) => tagBlog.id === blog.id)
              )
            )
          }

          setCache(cacheKey, filteredBlogs)
        } catch (error) {
          console.error('Error selecting type:', error)
          return
        }
      }

      setBlogList(filteredBlogs)
      setTotalcount(filteredBlogs.length)
      updateSelectMethod()
    },
    [selectedTagIds, getFromCache, setCache, setBlogList, setTotalcount, updateSelectMethod]
  )

  // 按标签筛选博客（支持多选）
  const handleSelectTag = useCallback(
    async (id: number) => {
      // 切换标签选中状态
      const newSelectedTagIds = selectedTagIds.includes(id)
        ? selectedTagIds.filter(tagId => tagId !== id)
        : [...selectedTagIds, id]

      setSelectedTagIds(newSelectedTagIds)
      setSelected(true)

      // 创建缓存键
      const cacheKey = `type_${selectedTypeId || 'null'}_tags_${newSelectedTagIds.join(',')}`
      let filteredBlogs = getFromCache<typeof blogList>(cacheKey)

      if (!filteredBlogs) {
        try {
          // 如果有选中的分类，先获取分类下的博客
          if (selectedTypeId !== null) {
            const typeRes = await fetch(`/api/types/${selectedTypeId}`)
            const typeData = await typeRes.json()
            filteredBlogs = typeData.data?.content || []
          } else {
            // 否则分页获取博客
            const allBlogsRes = await fetch(
              `/api/blogs?pagenum=${queryInfo.pagenum}&pagesize=${queryInfo.pagesize}`
            )
            const allBlogsData = await allBlogsRes.json()
            filteredBlogs = allBlogsData.data?.content || []
          }

          // 如果有选中的标签，进一步筛选
          if (newSelectedTagIds.length > 0) {
            const tagPromises = newSelectedTagIds.map(tagId =>
              fetch(`/api/tags/${tagId}`).then(res => res.json())
            )

            const tagResponses = await Promise.all(tagPromises)
            const tagBlogsArrays = tagResponses.map(res => res.data?.content || [])

            filteredBlogs = filteredBlogs.filter(blog =>
              tagBlogsArrays.every((tagBlogs: Blog[]) =>
                tagBlogs.some((tagBlog: Blog) => tagBlog.id === blog.id)
              )
            )
          }

          setCache(cacheKey, filteredBlogs)
        } catch (error) {
          console.error('Error selecting tag:', error)
          return
        }
      }

      setBlogList(filteredBlogs)
      setTotalcount(filteredBlogs.length)

      // 更新筛选文本
      let methodText = ''

      if (selectedTypeId !== null) {
        const type = typeList.find(item => item.id === selectedTypeId)
        if (type) methodText += `分类: ${type.name}`
      }

      if (newSelectedTagIds.length > 0) {
        if (methodText) methodText += ' + '
        methodText += '标签: '

        const tagNames = newSelectedTagIds
          .map(tagId => {
            const tag = tagList.find(item => item.id === tagId)
            return tag ? tag.name : ''
          })
          .filter(name => name)

        methodText += tagNames.join(', ')
      }

      if (!methodText) {
        methodText = HOME_LABELS.ALL_BLOGS
      }

      setSelectMethod(methodText)
    },
    [
      selectedTagIds,
      selectedTypeId,
      typeList,
      tagList,
      getFromCache,
      setCache,
      setBlogList,
      setTotalcount,
      queryInfo.pagenum,
      queryInfo.pagesize
    ]
  )

  // 更新博客列表（重置筛选）
  const updateBlogList = useCallback(() => {
    setSelected(false)
    setSelectedTypeId(null)
    setSelectedTagIds([])
    setSelectMethod(HOME_LABELS.ALL_BLOGS)
    setQueryInfo(prev => ({ ...prev, pagenum: 1 }))
    getBlogList()
  }, [getBlogList])

  // 内容区域滚动入场动画
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -20px 0px',
      threshold: 0.05
    }

    const fadeInObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          fadeInObserver.unobserve(entry.target)
        }
      })
    }, observerOptions)

    document.querySelectorAll('.content-fade-in').forEach(el => {
      fadeInObserver.observe(el)
    })

    return () => fadeInObserver.disconnect()
  }, [blogList, recommendList])

  return (
    <motion.div
      className="min-h-screen flex flex-col overflow-hidden"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* 1. 视差滚动全屏Hero */}
      <HeroSection />

      {/* 2. 主内容区 */}
      <main
        className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 relative z-10"
        id="mainContent"
      >
        {/* 推荐博客区 */}
        <motion.div variants={contentVariants}>
          <FeaturedSection recommendList={recommendList} />
        </motion.div>

        {/* 主内容区 */}
        <motion.div variants={contentVariants}>
          {/* 标题栏独立出来，不与侧边栏对齐 */}
          <div id="blogListSection" className="flex justify-between items-center mb-5">
            <div className="flex items-center">
              <AnimatePresence mode="wait">
                {selected && (
                  <motion.div
                    key="back-btn"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ArrowLeft
                      className="mr-2 text-[rgb(var(--primary))] cursor-pointer hover:scale-110 transition-transform h-5 w-5 z-10"
                      onClick={e => {
                        e.stopPropagation()
                        updateBlogList()
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              <Link href={ROUTES.BLOG_LIST} className="group flex items-center relative">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={selectMethod}
                    className="relative text-xl font-bold text-[rgb(var(--primary))]"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3 }}
                  >
                    {selectMethod}
                    <span className="absolute -bottom-0.5 left-0 h-px w-full bg-[rgb(var(--primary))]" />
                  </motion.span>
                </AnimatePresence>
                <ArrowRight className="w-4 h-4 ml-1.5 text-[rgb(var(--primary))] opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
              </Link>
            </div>
            <motion.span className="text-[rgb(var(--text-muted))]" variants={counterVariants}>
              共{' '}
              <motion.span
                key={totalcount}
                className="text-[rgb(var(--primary))] text-xl font-bold"
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                {totalcount}
              </motion.span>{' '}
              篇
            </motion.span>
          </div>

          {/* 分类筛选按钮独立出来 */}
          <motion.div className="flex items-center gap-2 mb-6 flex-wrap" variants={headerVariants}>
            <button
              onClick={updateBlogList}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                !selected ? 'text-white' : 'hover:bg-[rgb(var(--hover))]'
              }`}
              style={
                !selected
                  ? { background: 'rgb(var(--primary))' }
                  : { color: 'rgb(var(--text-muted))' }
              }
            >
              全部
            </button>
            {typeList.slice(0, 5).map(type => (
              <button
                key={type.id}
                onClick={() => handleSelectType(type.id)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  selectedTypeId === type.id ? 'text-white' : 'hover:bg-[rgb(var(--hover))]'
                }`}
                style={
                  selectedTypeId === type.id
                    ? { background: 'rgb(var(--primary))' }
                    : { color: 'rgb(var(--text-muted))' }
                }
              >
                {type.name}
              </button>
            ))}
          </motion.div>

          {/* 网格：左侧博客列表 + 右侧侧边栏 */}
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
            variants={contentVariants}
          >
            {/* 左侧：博客列表 */}
            <div className="lg:col-span-8">
              <BlogList
                blogs={blogList}
                loading={blogListLoading}
                visible={blogListVisible}
                pageSize={queryInfo.pagesize}
              />

              {/* 分页组件 */}
              <Pagination
                totalcount={totalcount}
                queryInfo={queryInfo}
                isCompact={isCompact}
                onPageChange={handleCurrentChange}
                onInputChange={handlePageInputChange}
              />
            </div>

            {/* 右侧：侧边栏 */}
            <div className="lg:col-span-4 space-y-6">
              <ProfileCard stats={initialSiteStats} inline />
              <Sidebar
                tags={tagList}
                tagLoading={tagListLoading}
                tagVisible={tagListVisible}
                onSelectTag={handleSelectTag}
                essays={initialEssays}
              />
            </div>
          </motion.div>
        </motion.div>

        {/* 项目展示区 */}
        <motion.div variants={contentVariants}>
          <ProjectSection projects={initialProjects} />
        </motion.div>
      </main>
      {/* Footer */}
      <Footer />
    </motion.div>
  )
}
