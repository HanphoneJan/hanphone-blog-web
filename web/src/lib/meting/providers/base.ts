/**
 * 音乐平台提供者基础类
 * 移植自 Meting (https://github.com/metowolf/Meting)
 */

import type Meting from '../meting'

export default class BaseProvider {
  name = 'base'

  constructor(protected meting: Meting) {}

  getHeaders(): Record<string, string> {
    return {}
  }

  search(keyword: string, _option?: Record<string, unknown>): ApiConfig {
    throw new Error(`${this.name}: search not implemented`)
  }

  song(id: string): ApiConfig {
    throw new Error(`${this.name}: song not implemented`)
  }

  album(id: string): ApiConfig {
    throw new Error(`${this.name}: album not implemented`)
  }

  artist(id: string, limit?: number): ApiConfig {
    throw new Error(`${this.name}: artist not implemented`)
  }

  playlist(id: string): ApiConfig {
    throw new Error(`${this.name}: playlist not implemented`)
  }

  url(id: string, br?: number): ApiConfig {
    throw new Error(`${this.name}: url not implemented`)
  }

  lyric(id: string): ApiConfig {
    throw new Error(`${this.name}: lyric not implemented`)
  }

  pic(id: string, size?: number): string | Promise<string> {
    throw new Error(`${this.name}: pic not implemented`)
  }

  format(_data: any): FormattedSong {
    throw new Error(`${this.name}: format not implemented`)
  }

  urlDecode(result: string): string {
    return result
  }

  lyricDecode(result: string): string {
    return result
  }

  async handleEncode(api: ApiConfig): Promise<ApiConfig> {
    return api
  }

  async executeRequest(api: ApiConfig, meting: Meting): Promise<string> {
    if (api.encode) {
      api = await this.handleEncode(api)
    }
    if (api.method === 'GET' && api.body) {
      const params = new URLSearchParams(api.body as Record<string, string>)
      api.url += '?' + params.toString()
      api.body = null
    }
    await meting.curl(api.url, api.body)
    if (!meting.isFormat) return meting.raw

    let data: string = meting.raw
    if (api.decode) {
      data = await this.handleDecode(api.decode, data)
    }
    if ('format' in api) {
      data = this.cleanData(data, api.format)
    }
    return data
  }

  async handleDecode(decodeType: string, data: string): Promise<string> {
    if (decodeType.includes('url')) return this.urlDecode(data)
    if (decodeType.includes('lyric')) return this.lyricDecode(data)
    return data
  }

  cleanData(raw: string, rule: string): string {
    let data: any
    try { data = JSON.parse(raw) } catch { return '[]' }
    if (rule) data = pickupData(data, rule)
    if (!Array.isArray(data) && typeof data === 'object' && data !== null) {
      data = [data]
    }
    if (!Array.isArray(data)) return '[]'
    return JSON.stringify(data.map((item: any) => this.format(item)))
  }
}

/** 从嵌套对象中按路径提取数据 */
function pickupData(obj: any, rule: string): any {
  return rule.split('.').reduce((cur, key) => {
    if (!cur || typeof cur !== 'object' || !(key in cur)) return {}
    return cur[key]
  }, obj)
}

// ---- 类型定义 ----

export interface ApiConfig {
  method: 'GET' | 'POST'
  url: string
  body: Record<string, unknown> | string | null
  encode?: string
  decode?: string
  format?: string
}

export interface FormattedSong {
  id: string
  name: string
  artist: string[]
  album: string
  pic_id: string
  url_id: string
  lyric_id: string
  source: string
}
