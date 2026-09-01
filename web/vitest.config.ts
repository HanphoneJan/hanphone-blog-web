import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  // 测试环境不需要真实 CSS 处理；内联空配置避免 vite 加载 postcss.config.mjs
  // （vitest 内置 vite 5.2.x 与 Tailwind CSS 4 的 @tailwindcss/postcss 不兼容，
  //  会在启动时抛出 "Invalid PostCSS Plugin found at: plugins[0]"）
  css: {
    postcss: {
      plugins: []
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
