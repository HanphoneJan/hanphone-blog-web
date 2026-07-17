# 网易云 Cookie 定时刷新 Cron 配置教程

本文档说明如何在 Ubuntu 服务器上配置 cron 定时任务，自动刷新网易云音乐 Cookie。

## 背景

music 页面使用的网易云 Cookie 会过期，需要定期调用刷新接口保持有效。系统提供了一个内部 HTTP 端点供外部定时任务触发：

```
GET /next-api/cron/refresh-netease-cookie/
```

- 刷新策略：距离上次刷新 12~24 小时（随机阈值）才真正执行，避免固定频率触发风控；超过 24 小时必定刷新
- 触发记录写入 `web/data/netease-cookie-refresh.log`（最多保留 1000 行）
- 刷新失败时自动向管理员发送告警邮件
- 刷新结果可在 admin/personal 页面查看（"距离上次刷新" 与 "自动刷新记录"）

## 重要前提：URL 必须带尾斜杠

本项目 `next.config.ts` 开启了 `trailingSlash: true`，对**所有路由（含 API 路由）**生效：

- 请求 `/next-api/cron/refresh-netease-cookie`（**无**尾斜杠）会收到 **308 重定向**
- 未跟随重定向的客户端（如不加 `-L` 的 curl）会**静默失败**：curl 退出码为 0，但刷新处理器从未执行
- 这是最容易踩的坑，务必使用带尾斜杠的 URL，并建议加 `-L`

验证是否存在重定向：

```bash
curl -v http://127.0.0.1:3000/next-api/cron/refresh-netease-cookie
# 若返回 HTTP/1.1 308 Permanent Redirect，说明该 URL 不可用
```

## 配置步骤

### 1. 确认环境变量

确保 Next.js 应用的 `.env` 中已配置：

```bash
INTERNAL_API_KEY=你的内部密钥
NETEASE_COOKIE_KEY=你的cookie加密密钥
```

### 2. 编辑 crontab

```bash
crontab -e
```

如果定时任务属于 root 用户（视部署方式而定）：

```bash
sudo crontab -e
```

### 3. 添加定时任务

推荐每 12 小时触发一次（实际刷新由 12~24 小时随机阈值控制）：

```cron
0 */12 * * * curl -sSL -H "x-internal-key: 你的INTERNAL_API_KEY" http://127.0.0.1:3000/next-api/cron/refresh-netease-cookie/ >> /var/log/netease-cookie-refresh.log 2>&1
```

参数说明：

| 参数 | 作用 |
| ---- | ---- |
| `-s` | 静默模式 |
| `-S` | 出错时仍显示错误信息 |
| `-L` | 跟随重定向（双保险） |
| `>> ... 2>&1` | 记录每次返回的 JSON，便于排查 |

> 也可以把密钥放入环境文件避免明文出现在 crontab：
>
> ```cron
> 0 */12 * * * . /www/custom_server/client_blog/.env && curl -sSL -H "x-internal-key: $INTERNAL_API_KEY" http://127.0.0.1:3000/next-api/cron/refresh-netease-cookie/ >> /var/log/netease-cookie-refresh.log 2>&1
> ```

保存退出（nano：`Ctrl+O` → 回车 → `Ctrl+X`；vim：`:wq`）。

### 4. 立即手动验证

```bash
curl -sSL -H "x-internal-key: 你的INTERNAL_API_KEY" \
  http://127.0.0.1:3000/next-api/cron/refresh-netease-cookie/
```

预期返回（三选一）：

```json
{"success":true,"refreshed":true,"skipped":false}
{"success":true,"refreshed":false,"skipped":false}   // cookie 无字段变化，属正常
{"success":true,"refreshed":false,"skipped":true,"reason":"Cookie 尚未到期，无需刷新"}
```

## 验证配置生效

```bash
# 确认 crontab 内容
crontab -l

# 查看 cron 执行记录（Ubuntu）
grep CRON /var/log/syslog | tail

# 查看每次触发的返回结果
tail /var/log/netease-cookie-refresh.log

# 查看刷新日志与数据文件时间戳
ls -l /www/custom_server/client_blog/data/
tail -3 /www/custom_server/client_blog/data/netease-cookie-refresh.log

# 查看应用日志中的调度器输出
pm2 logs blog_nextjs --lines 50
```

最后访问 admin/personal 页面，确认"距离上次刷新"小时数与"自动刷新记录"时间正常更新。

## 常见问题

| 现象 | 原因 | 解决 |
| ---- | ---- | ---- |
| admin 页面"距离上次刷新"一直增大 | cron 请求被 308 重定向吞掉 | URL 加尾斜杠、`curl` 加 `-L` |
| 返回 `{"success":false,"error":"未授权"}` | `x-internal-key` 与 `INTERNAL_API_KEY` 不一致 | 检查密钥配置 |
| 返回 `{"success":false,"error":"服务未配置 INTERNAL_API_KEY"}` | 应用 `.env` 缺少该变量 | 配置后重启应用（`pm2 restart blog_nextjs`） |
| 返回 301 跳转到其它域名 | cron 使用了 www 域名或 http 协议 | 改用 `http://127.0.0.1:3000` 直连 |
| 刷新失败并收到告警邮件 | Cookie 已失效（如二维码登录的 Cookie） | 在 admin/personal 页面手动重新配置 Cookie |

## 相关代码

| 文件 | 说明 |
| ---- | ---- |
| `web/src/app/next-api/cron/refresh-netease-cookie/route.ts` | cron 触发端点 |
| `web/src/lib/netease-cookie/scheduler.ts` | 刷新检查、日志读写 |
| `web/src/lib/netease-cookie/refresh.ts` | 刷新逻辑、随机阈值判断 |
| `web/src/app/next-api/admin/music/cookie/route.ts` | admin 页面状态/手动刷新接口 |
