module.exports = {
  darkMode: 'class',
  // important: true,
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  corePlugins: {
    // 禁用 Tailwind 对 pre 和 code 标签的默认样式
    pre: false,
    code: false
  },
  //通过 theme.extend.colors 扩展了 Tailwind 原生颜色
  theme: {
    extend: {
      fontFamily: {
        sans: ['Arial', 'SimSun', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace']
      }
    }
  },
  plugins: [
    // 添加这个插件来启用 light: 前缀
    function ({ addVariant }) {
      addVariant('light', ':not(.dark) &')
    }
  ]
}
