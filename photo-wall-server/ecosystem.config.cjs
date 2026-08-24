module.exports = {
  apps: [
    {
      name: "server_atlas", // 应用名称，在PM2列表中显示
      script: "./app.js", // 启动脚本
      // PM2 默认会以 ecosystem.config.js 文件所在的目录 作为应用的工作目录，不需要写cwd
      env: {
        NODE_ENV: "production", // 设置生产环境变量
      },
    },
  ],
};
