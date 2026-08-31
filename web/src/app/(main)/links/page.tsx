import { ENDPOINTS } from '@/lib/api'
import LinkClient from './LinkClient'
import type { FriendLink } from './LinkClient'

import { API_CODE } from '@/lib/constants'

// ISR：每5分钟重新验证
export const revalidate = 300

// 获取友链数据（服务端）
async function fetchFriendLinks(): Promise<FriendLink[]> {
  try {
    const res = await fetch(ENDPOINTS.FRIENDLINKS, {
      next: { revalidate: 300 }
    })

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }

    const data = await res.json()

    if (data.code === API_CODE.SUCCESS && data.data) {
      return data.data
    }
    return []
  } catch (error) {
    console.error('Failed to fetch friend links:', error)
    return []
  }
}

// 服务端组件
export default async function LinkPage() {
  const friendLinks = await fetchFriendLinks()

  return <LinkClient initialLinks={friendLinks} />
}
