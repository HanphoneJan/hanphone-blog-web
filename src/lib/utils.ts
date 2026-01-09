import axios from 'axios';

// 创建 Axios 实例
const apiClient = axios.create({
  timeout: 10000
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 仅在浏览器环境下执行
    if (typeof window !== 'undefined') {
      // 从 localStorage 获取 token
      const token = localStorage.getItem('token');
      // 如果存在 token，则添加到请求头
      if (token) {
        config.headers.Token = `${token}`;
      }
    }
    return config;
  },
  (error) => {
    // 处理请求错误
    return Promise.reject(error);
  }
);

// 响应拦截器（可选，用于处理 token 过期等情况）
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 如果是 401 未授权，可能是 token 过期
    // if (error.response?.status === 401) {
    //   // 清除无效 token
    //   localStorage.removeItem('token');
    //   // 跳转到登录页
    //   window.location.href = '/';
    // }
    return Promise.reject(error);
  }
);

export default apiClient;
