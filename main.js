import { app, BrowserWindow } from 'electron'

// 在开发模式下，你可以让 Electron 加载本地服务器地址；
// 在生产模式下，加载打包好的本地文件。
const isDev = process.env.NODE_ENV === 'development'

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false, // 建议关闭 nodeIntegration，提升安全
      contextIsolation: true
    },
    autoHideMenuBar: true,
    icon: './resources/icon.png'
  })

  if (isDev) {
    // 开发模式：加载 localhost
    mainWindow.loadURL('http://localhost:3000')
    // 可选：打开开发者工具
    mainWindow.webContents.openDevTools()
  } else {
    // 生产模式：加载打包后的本地文件
    // Next.js build 后，默认使用 next start (本地server) 或 next export (静态文件)
    // 这里示例使用 next start 的方式
    const startUrl = `https://www.hanphone.top`
    mainWindow.loadURL(startUrl)
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    // macOS 上，当 dock 图标被点击且没有其他窗口打开时:
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// 所有窗口关闭时退出应用 (在 macOS 除外)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
