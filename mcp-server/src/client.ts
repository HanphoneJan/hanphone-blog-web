import type { McpConfig } from './config.js';

interface Result<T> {
  flag: boolean;
  code: number;
  message: string;
  data: T;
}

const STATUS_OK = 200;

export class BlogApiError extends Error {}

export class BlogApiClient {
  constructor(private readonly config: McpConfig) {}

  get hasInternalKey(): boolean {
    return Boolean(this.config.internalApiKey);
  }

  get authorId(): number | undefined {
    return this.config.authorId;
  }

  get authorNickname(): string {
    return this.config.authorNickname;
  }

  /**
   * 调用博客后端接口。
   * @param internal 为 true 时走 /internal/** 内部接口，自动携带 X-Internal-Key
   */
  async request<T = unknown>(
    path: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: unknown;
      internal?: boolean;
      params?: Record<string, string | number | boolean | undefined>;
    } = {},
  ): Promise<T> {
    const { method = 'GET', body, internal = false, params } = options;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (internal) {
      if (!this.config.internalApiKey) {
        throw new BlogApiError('未配置 INTERNAL_API_KEY，无法调用管理类工具。请在 mcp-server 的 .env 中配置后重启。');
      }
      headers['X-Internal-Key'] = this.config.internalApiKey;
    }

    const url = new URL(`${this.config.baseUrl}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) url.searchParams.set(key, String(value));
      }
    }

    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (err) {
      throw new BlogApiError(`无法连接博客后端（${this.config.baseUrl}）：${err instanceof Error ? err.message : String(err)}`);
    }

    if (!res.ok) {
      throw new BlogApiError(`请求失败：HTTP ${res.status} ${method} ${path}`);
    }

    const json = (await res.json()) as Result<T>;
    if (json.code !== STATUS_OK) {
      throw new BlogApiError(json.message || `业务错误 code=${json.code}`);
    }
    return json.data;
  }
}
