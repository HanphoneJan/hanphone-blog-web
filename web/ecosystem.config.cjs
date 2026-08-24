module.exports = {
  apps: [{
    name: 'blog_nextjs',     // 应用名称，在PM2列表中显示
    script: 'npm',           // 启动脚本
    args: 'start',       // 传递给script的参数
    env: {
      NODE_ENV: 'production', // 设置生产环境变量
    }
  }]
};