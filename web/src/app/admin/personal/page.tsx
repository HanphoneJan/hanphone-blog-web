'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { User, Code, BookOpen, Heart, MessageSquare, X, Check, Save, Loader2, Key } from 'lucide-react'
import { ENDPOINTS } from '@/lib/api'
import apiClient from '@/lib/utils'
import { showAlert } from '@/lib/Alert'
import { ADMIN_PERSONAL_LABELS } from '@/lib/labels'

import { usePersonal } from './hooks/usePersonal'
import { useSkills } from './hooks/useSkills'
import { useWorks } from './hooks/useWorks'
import { useHobbies } from './hooks/useHobbies'
import { useEvaluations } from './hooks/useEvaluations'
import { useMcpKeys } from './hooks/useMcpKeys'

import { BasicInfoTab, SkillsTab, WorksTab, HobbiesTab, EvaluationsTab, McpKeysTab } from './components/tabs'
import { SkillForm, WorkForm, HobbyForm, EvaluationForm } from './components/forms'
import { AvatarUpload } from './components/AvatarUpload'
import { PasswordReset } from './components/PasswordReset'

import { Item, PersonInfoFormData, SectionType, ItemType, Skill, Work, Hobby, Evaluation } from './types'
import { SECTION_NAMES } from './constants'

import { API_CODE } from '@/lib/constants'
// 动画变体定义
const pageVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
}

const fadeInUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
}

const tabVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3
    }
  }
} as const

// 导航项配置
const navItems = [
  { id: 'info', label: '基本信息', shortLabel: '信息', icon: User },
  { id: 'skills', label: '技能管理', shortLabel: '技能', icon: Code },
  { id: 'hobbys', label: '爱好管理', shortLabel: '爱好', icon: Heart },
  { id: 'works', label: '作品管理', shortLabel: '作品', icon: BookOpen },
  { id: 'evaluations', label: '自我评价', shortLabel: '评价', icon: MessageSquare },
  { id: 'mcpKeys', label: 'MCP 密钥', shortLabel: '密钥', icon: Key }
]

export default function ProfilePage() {
  // Hooks
  const {
    globalUserInfo,
    userForm,
    imageUrl,
    loading: personalLoading,
    setImageUrl,
    setLoading: setPersonalLoading,
    handleUserInfoChange,
    changeUserInfo,
    handleFileUpload,
    setAvatar
  } = usePersonal()

  const { skills, setSkills, processSkillsData, saveSkill, deleteSkill } = useSkills()
  const { works, setWorks, processWorksData, saveWork, deleteWork } = useWorks()
  const { hobbies, setHobbies, processHobbiesData, saveHobby, deleteHobby } = useHobbies()
  const { evaluations, setEvaluations, processEvaluationsData, saveEvaluation, deleteEvaluation } = useEvaluations()
  const {
    keys: mcpKeys,
    loading: mcpKeysLoading,
    opLoading: mcpKeysOpLoading,
    revealedKey: mcpRevealedKey,
    setRevealedKey: setMcpRevealedKey,
    createKey: createMcpKey,
    deleteKey: deleteMcpKey,
    toggleKey: toggleMcpKey,
    regenerateKey: regenerateMcpKey
  } = useMcpKeys()

  // 本地状态
  const [activeSection, setActiveSection] = useState<SectionType>('info')
  const [dialogVisible, setDialogVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<ItemType>(null)
  const [currentItemIndex, setCurrentItemIndex] = useState(-1)
  const [formData, setFormData] = useState<PersonInfoFormData>({ name: '', rank: 0 })
  const [isAddMode, setIsAddMode] = useState(true)
  const [resetPasswordVisible, setResetPasswordVisible] = useState(false)
  const [pageLoading, setPageLoading] = useState(false)

  // 获取个人资料数据
  const fetchProfileData = useCallback(async () => {
    try {
      setPageLoading(true)
      const res = await apiClient({
        url: ENDPOINTS.USER.PERSONINFOS,
        method: 'GET'
      })

      if (res.data.flag && res.data.code === API_CODE.SUCCESS) {
        processSkillsData(res.data.data)
        processWorksData(res.data.data)
        processHobbiesData(res.data.data)
        processEvaluationsData(res.data.data)
      }
    } catch (error) {
      console.error('获取个人资料数据失败:', error)
      showAlert(ADMIN_PERSONAL_LABELS.FETCH_FAIL)
    } finally {
      setPageLoading(false)
    }
  }, [processSkillsData, processWorksData, processHobbiesData, processEvaluationsData])

  // 页面加载时获取数据
  useEffect(() => {
    if (globalUserInfo) {
      fetchProfileData()
    }
  }, [globalUserInfo, fetchProfileData])

  // 处理表单字段变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (['name', 'url', 'desc', 'pic_url', 'id', 'icon_src', 'rank'].includes(name)) {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'rank' ? (value ? Number(value) : 0) : value || ''
      }))
    }
  }

  // 打开编辑对话框
  const openEditDialog = (section: SectionType, item?: ItemType, index?: number) => {
    setActiveSection(section)
    setCurrentItem(item || null)
    setCurrentItemIndex(index !== undefined ? index : -1)

    if (item && index !== undefined) {
      setIsAddMode(false)
      setFormData({ ...item })
    } else {
      setIsAddMode(true)
      switch (section) {
        case 'skills':
          setFormData({ name: '', url: '', desc: '', icon_src: '', rank: 0 })
          break
        case 'works':
          setFormData({ name: '', url: '', desc: '', pic_url: '', icon_src: '', rank: 0 })
          break
        case 'hobbys':
          setFormData({ name: '', url: '', desc: '', pic_url: '', icon_src: '', rank: 0 })
          break
        case 'evaluations':
          setFormData({ name: '', rank: 0 })
          break
        default:
          setFormData({ name: '', rank: 0 })
      }
    }
    setDialogVisible(true)
  }

  // 关闭对话框
  const closeDialog = () => {
    setDialogVisible(false)
    setCurrentItem(null)
    setCurrentItemIndex(-1)
    setFormData({ name: '', rank: 0 })
    if (activeSection === 'avatar') {
      setActiveSection('info')
    }
  }

  // 保存项目
  const saveItem = async () => {
    let result
    setPageLoading(true)

    try {
      switch (activeSection) {
        case 'skills':
          result = await saveSkill(formData, isAddMode, currentItem as Skill)
          break
        case 'works':
          result = await saveWork(formData, isAddMode, currentItem as Work)
          break
        case 'hobbys':
          result = await saveHobby(formData, isAddMode, currentItem as Hobby)
          break
        case 'evaluations':
          result = await saveEvaluation(formData, isAddMode, currentItem as Evaluation)
          break
        default:
          return
      }

      if (result.success) {
        await fetchProfileData()
        showAlert(isAddMode ? ADMIN_PERSONAL_LABELS.ADD_SUCCESS : ADMIN_PERSONAL_LABELS.MODIFY_SUCCESS)
        closeDialog()
      } else {
        showAlert(isAddMode
          ? ADMIN_PERSONAL_LABELS.ADD_FAIL_MSG(result.message)
          : ADMIN_PERSONAL_LABELS.MODIFY_FAIL_MSG(result.message)
        )
      }
    } catch (error) {
      console.error('保存失败:', error)
      showAlert(isAddMode ? ADMIN_PERSONAL_LABELS.ADD_FAIL : ADMIN_PERSONAL_LABELS.MODIFY_FAIL)
    } finally {
      setPageLoading(false)
    }
  }

  // 删除项目
  const deleteItem = async (section: SectionType, index: number, id: number) => {
    setPageLoading(true)
    let result

    try {
      switch (section) {
        case 'skills':
          result = await deleteSkill(id)
          break
        case 'works':
          result = await deleteWork(id)
          break
        case 'hobbys':
          result = await deleteHobby(id)
          break
        case 'evaluations':
          result = await deleteEvaluation(id)
          break
        default:
          return
      }

      if (result.success) {
        await fetchProfileData()
        showAlert(ADMIN_PERSONAL_LABELS.DELETE_SUCCESS)
      } else {
        showAlert(ADMIN_PERSONAL_LABELS.DELETE_FAIL_MSG(result.message || ''))
      }
    } catch (error) {
      console.error('删除失败:', error)
      showAlert(ADMIN_PERSONAL_LABELS.DELETE_FAIL)
    } finally {
      setPageLoading(false)
    }
  }

  // 处理头像保存
  const handleSetAvatar = async () => {
    const success = await setAvatar()
    if (success) {
      closeDialog()
    }
  }

  // 打开头像对话框
  const openAvatarDialog = () => {
    setActiveSection('avatar')
    setDialogVisible(true)
  }

  // 如果没有全局用户信息，显示加载状态
  if (!globalUserInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg))]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[rgb(var(--primary))]"></div>
      </div>
    )
  }

  return (
    <motion.div 
      className="font-sans min-h-screen flex flex-col bg-[rgb(var(--bg))] text-[rgb(var(--text))] relative overflow-hidden"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* 背景效果 - 已移除 */}

      <main className="flex-1 w-full max-w-7xl mx-auto lg:px-2 lg:py-2 relative z-10">
        {/* 顶部标签式导航 */}
        <motion.div 
          className="bg-[rgb(var(--card))] backdrop-blur-sm lg:rounded-t-xl shadow-sm border border-[rgb(var(--border))] border-b-0 overflow-hidden"
          variants={fadeInUpVariants}
        >
          <div className="flex overflow-x-auto scrollbar-hide">
            {navItems.map(item => {
              const Icon = item.icon
              return (
                <motion.button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as SectionType)}
                  className={`flex-1 min-w-[50px] px-2 pt-2 pb-1 lg:py-3 transition-all ${
                    activeSection === item.id
                      ? 'bg-[rgb(var(--primary))] text-white border-b-2 border-[rgb(var(--primary))]'
                      : 'bg-[rgb(var(--card))] text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--hover))] border-b-2 border-transparent'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* 桌面端显示 */}
                  <div className="hidden sm:flex items-center justify-center gap-2">
                    <Icon className="h-5 w-5" />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  {/* 移动端显示 */}
                  <div className="sm:hidden flex flex-col items-center justify-center gap-1">
                    <Icon className="h-5 w-5" />
                    <span className="text-xs">{item.shortLabel}</span>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        {/* 内容区域 */}
        <AnimatePresence mode="wait">
          {activeSection === 'info' && (
            <motion.div
              key="info"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <BasicInfoTab
                userForm={userForm}
                globalUserInfo={globalUserInfo}
                loading={personalLoading}
                onUserInfoChange={handleUserInfoChange}
                onSave={changeUserInfo}
                onChangePassword={() => setResetPasswordVisible(true)}
                onOpenAvatarDialog={openAvatarDialog}
              />
            </motion.div>
          )}

          {activeSection === 'skills' && (
            <motion.div
              key="skills"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <SkillsTab
                skills={skills}
                loading={pageLoading}
                onAdd={() => openEditDialog('skills')}
                onEdit={(skill, index) => openEditDialog('skills', skill, index)}
                onDelete={(index, id) => deleteItem('skills', index, id)}
              />
            </motion.div>
          )}

          {activeSection === 'works' && (
            <motion.div
              key="works"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <WorksTab
                works={works}
                loading={pageLoading}
                onAdd={() => openEditDialog('works')}
                onEdit={(work, index) => openEditDialog('works', work, index)}
                onDelete={(index, id) => deleteItem('works', index, id)}
              />
            </motion.div>
          )}

          {activeSection === 'hobbys' && (
            <motion.div
              key="hobbys"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <HobbiesTab
                hobbies={hobbies}
                loading={pageLoading}
                onAdd={() => openEditDialog('hobbys')}
                onEdit={(hobby, index) => openEditDialog('hobbys', hobby, index)}
                onDelete={(index, id) => deleteItem('hobbys', index, id)}
              />
            </motion.div>
          )}

          {activeSection === 'evaluations' && (
            <motion.div
              key="evaluations"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <EvaluationsTab
                evaluations={evaluations}
                loading={pageLoading}
                onAdd={() => openEditDialog('evaluations')}
                onEdit={(evaluation, index) => openEditDialog('evaluations', evaluation, index)}
                onDelete={(index, id) => deleteItem('evaluations', index, id)}
              />
            </motion.div>
          )}

          {activeSection === 'mcpKeys' && (
            <motion.div
              key="mcpKeys"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <McpKeysTab
                keys={mcpKeys}
                loading={mcpKeysLoading}
                opLoading={mcpKeysOpLoading}
                revealedKey={mcpRevealedKey}
                setRevealedKey={setMcpRevealedKey}
                createKey={createMcpKey}
                deleteKey={deleteMcpKey}
                toggleKey={toggleMcpKey}
                regenerateKey={regenerateMcpKey}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 编辑对话框 */}
        <AnimatePresence>
          {dialogVisible && (
            <motion.div 
              className="fixed inset-0 bg-[rgb(var(--overlay))]/50 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="bg-[rgb(var(--card))] rounded-xl border border-[rgb(var(--border))] w-full max-w-md shadow-2xl max-h-[80vh] flex flex-col"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <div className="px-5 py-3 border-b border-[rgb(var(--border))] flex justify-between items-center shrink-0">
                  <h3 className="text-lg font-semibold text-[rgb(var(--primary))]">
                    {activeSection === 'avatar'
                      ? '更换头像'
                      : isAddMode
                      ? `添加${SECTION_NAMES[activeSection] || ''}`
                      : `编辑${SECTION_NAMES[activeSection] || ''}`}
                  </h3>
                  <motion.button
                    onClick={closeDialog}
                    className="text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))] transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="h-5 w-5" />
                  </motion.button>
                </div>

                <div className="px-5 py-4 overflow-y-auto flex-1">
                  {activeSection === 'avatar' ? (
                    <AvatarUpload imageUrl={imageUrl} onFileUpload={handleFileUpload} />
                  ) : (
                    <>
                      {activeSection === 'skills' && <SkillForm formData={formData} onChange={handleInputChange} />}
                      {activeSection === 'works' && <WorkForm formData={formData} onChange={handleInputChange} />}
                      {activeSection === 'hobbys' && <HobbyForm formData={formData} onChange={handleInputChange} />}
                      {activeSection === 'evaluations' && <EvaluationForm formData={formData} onChange={handleInputChange} />}
                    </>
                  )}
                </div>

                <div className="px-5 py-3 border-t border-[rgb(var(--border))] flex justify-end gap-3 shrink-0">
                  <motion.button
                    onClick={closeDialog}
                    className="px-4 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--text))] hover:bg-[rgb(var(--hover))] transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    取消
                  </motion.button>
                  <motion.button
                    onClick={activeSection === 'avatar' ? handleSetAvatar : saveItem}
                    disabled={pageLoading || personalLoading}
                    className={`px-4 py-2 rounded-lg transition duration-300 flex items-center justify-center gap-2 ${
                      pageLoading || personalLoading
                        ? 'bg-[rgb(var(--muted))] text-[rgb(var(--text-muted))]'
                        : 'bg-[rgb(var(--primary))] hover:bg-[rgb(var(--primary-hover))] text-white'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {pageLoading || personalLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : activeSection === 'avatar' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span>{activeSection === 'avatar' ? '确认更换' : '保存'}</span>
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 密码重置对话框 */}
        <AnimatePresence>
          {resetPasswordVisible && (
            <PasswordReset
              userId={Number(globalUserInfo.id) || 0}
              loading={personalLoading}
              setLoading={setPersonalLoading}
              onClose={() => setResetPasswordVisible(false)}
            />
          )}
        </AnimatePresence>
      </main>
    </motion.div>
  )
}
