import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname
})

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // 将any类型检查改为警告
      '@typescript-eslint/no-explicit-any': 'warn',
      // 将未使用变量检查改为警告
      '@typescript-eslint/no-unused-vars': 'warn',
      // 将React Hook依赖检查改为警告
      'react-hooks/exhaustive-deps': 'warn'
    }
  },
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**', 'next-env.d.ts']
  }
]

export default eslintConfig
