'use server'

// 位置信息类型
interface LocationInfo {
  loginProvince: string
  loginCity: string
  loginLat: number
  loginLng: number
}

export async function getLocationInfo(): Promise<LocationInfo> {
  try {
    const key = process.env.LOCATION_KEY
    const baseUrl = process.env.LOCATION_URL
    const url = `${baseUrl}?key=${key}&output=json`

    // 使用fetch API获取位置信息
    const response = await fetch(url)
    const data = await response.json()

    // 验证响应状态是否成功
    if (data.status === 0) {
      return {
        loginProvince: data.result.ad_info.province,
        loginCity: data.result.ad_info.city,
        loginLat: data.result.location.lat,
        loginLng: data.result.location.lng
      }
    } else {
      throw new Error(`获取地理位置失败: ${data.message}`)
    }
  } catch (error) {
    console.log('获取地理位置失败:', error)
    // 使用默认位置信息
    return {
      loginProvince: '',
      loginCity: '',
      loginLat: 30.27,
      loginLng: 103.08
    }
  }
}
