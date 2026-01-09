// Recommended to use absolute path for live2d_path parameter
// live2d_path 参数建议使用绝对路径
const live2d_path = 'https://www.hanphone.top/static/live2d/'
// const live2d_path = '/dist/';

// 资源加载状态管理
const resourceStatus = {
  css: false,
  js: false,
  json: false,
  images: false
}

// 加载进度回调
function onProgress(type, loaded, total) {
  console.log(`Loading ${type}: ${loaded}/${total}`)
  // 可以在这里添加UI进度条更新逻辑
}

// Method to encapsulate asynchronous resource loading
// 封装异步加载资源的方法
function loadExternalResource(url, type) {
  return new Promise((resolve, reject) => {
    // 检查URL有效性
    if (!url || typeof url !== 'string') {
      return reject(new Error(`Invalid URL: ${url}`))
    }

    let tag

    if (type === 'css') {
      // 检查是否已加载相同的CSS
      const existingLink = document.querySelector(`link[href="${url}"]`)
      if (existingLink) {
        resourceStatus.css = true
        return resolve(url)
      }

      tag = document.createElement('link')
      tag.rel = 'stylesheet'
      tag.href = url
    } else if (type === 'js') {
      // 检查是否已加载相同的JS
      const existingScript = document.querySelector(`script[src="${url}"]`)
      if (existingScript) {
        resourceStatus.js = true
        return resolve(url)
      }

      tag = document.createElement('script')
      tag.type = 'module'
      tag.src = url
    } else if (type === 'json') {
      // 新增JSON加载逻辑
      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`)
          }
          return response.json()
        })
        .then(data => {
          resourceStatus.json = true
          resolve(data)
        })
        .catch(error => {
          console.error(`Error loading JSON from ${url}:`, error)
          reject(error)
        })
      return // 提前返回，不需要创建标签
    } else if (type === 'img') {
      // 新增图片加载逻辑
      const img = new Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => {
        resourceStatus.images = true
        resolve(url)
      }

      img.onerror = () => {
        console.error(`Failed to load image: ${url}`)
        reject(new Error(`Failed to load image: ${url}`))
      }

      img.src = url
      return // 提前返回，不需要创建标签
    }

    if (tag) {
      tag.onload = () => {
        if (type === 'css') resourceStatus.css = true
        if (type === 'js') resourceStatus.js = true
        resolve(url)
      }

      tag.onerror = () => {
        console.error(`Failed to load ${type}: ${url}`)
        reject(new Error(`Failed to load ${type}: ${url}`))
      }

      document.head.appendChild(tag)
    }
  })
}

// 批量加载图片资源
async function loadImages(urls) {
  const results = []
  for (let i = 0; i < urls.length; i++) {
    try {
      const result = await loadExternalResource(urls[i], 'img')
      results.push(result)
      onProgress('images', i + 1, urls.length)
    } catch (error) {
      console.error(`Error loading image ${urls[i]}:`, error)
      // 可以选择继续加载其他图片或中断
      // 这里选择继续加载其他图片
    }
  }
  return results
}

// 检查所有资源是否加载完成
function checkAllResourcesLoaded() {
  return Object.values(resourceStatus).every(status => status === true)
}

;(async () => {
  // 如果担心手机上显示效果不佳，可以根据屏幕宽度来判断是否加载
  // if (screen.width < 640) return

  try {
    // 避免图片资源跨域问题
    const OriginalImage = window.Image
    window.Image = function (...args) {
      const img = new OriginalImage(...args)
      img.crossOrigin = 'anonymous'
      return img
    }
    window.Image.prototype = OriginalImage.prototype

    // 定义需要加载的所有资源
    const waifuTipsUrl = 'https://www.hanphone.top/static/live2d/waifu-tips.json'
    const cubism2Url = live2d_path + 'live2d.min.js'
    const cubism5Url = live2d_path + 'live2dcubismcore.min.js'

    // 定义图片资源
    const imageUrls = [
      'https://www.hanphone.top/static/live2d/models/mimi/mimi.4096/texture_00.png',
      'https://www.hanphone.top/static/live2d/models/37/37.4096/texture_00.png',
      'https://www.hanphone.top/static/live2d/models/37/37.4096/texture_01.png'
    ]

    // 等待所有资源加载完成
    const [cssLoaded, tipsLoaded, cubism2Loaded, cubism5Loaded, waifuData] = await Promise.all([
      loadExternalResource(live2d_path + 'waifu.css', 'css'),
      loadExternalResource(live2d_path + 'waifu-tips.js', 'js'),
      loadExternalResource(cubism2Url, 'js'),
      loadExternalResource(cubism5Url, 'js'),
      loadExternalResource(waifuTipsUrl, 'json') // 加载JSON数据
    ])

    // 单独加载图片资源
    const loadedImages = await loadImages(imageUrls)

    // 检查所有资源是否加载完成
    if (!checkAllResourcesLoaded()) {
      console.warn('Some resources failed to load. Live2D may not work correctly.')
    }

    // 所有资源加载完成后再初始化
    initWidget({
      cdnPath: null,
      cubism2Path: cubism2Url,
      cubism5Path: cubism5Url,
      waifuPath: waifuTipsUrl, // 可以直接使用URL，也可以使用加载的waifuData
      tools: ['hitokoto', 'switch-model', 'switch-texture', 'quit'],
      logLevel: 'info',
      drag: false
    })

    console.log('Live2D widget initialized successfully')
  } catch (error) {
    console.error('Failed to initialize Live2D widget:', error)
    // 可以在这里添加错误处理UI或回退逻辑
  }
})()

console.log(
  `\n%cLive2D%cWidget%c\n`,
  'padding: 8px; background: #cd3e45; font-weight: bold; font-size: large; color: white;',
  'padding: 8px; background: #ff5450; font-size: large; color: #eee;',
  ''
)
