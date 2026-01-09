// API 通用响应类型（适用于所有后端接口）
export interface ApiResponse<T = unknown> {
  flag: boolean;
  code: number; // 状态码（如 200 成功，400 客户端错误，500 服务端错误）
  data: T;      // 接口返回的具体数据（泛型，根据不同接口动态指定）
  message: string; // 接口提示信息（成功/失败描述）
}

export interface PicResponse {
  category: null;
  code: number;
  filename: string;
  message: string;
  mimetype: string;
  namespace: string;
  originalName: string;
  size: number;
  url: string;
}

// 分页响应通用格式
export interface PaginationResponse<T = unknown> {
  list: T[]; // 当前页数据列表
  total: number; // 总条数
  page: number; // 当前页码
  pageSize: number; // 每页条数
  totalPages: number; // 总页数
}
