import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

/**
 * Vite 配置文件
 * 用于构建客户端 JavaScript bundle
 */
export default defineConfig({
  plugins: [react()],

  build: {
    // 输出目录
    outDir: '.next/static',

    // 生成清单文件（用于映射模块 ID）
    manifest: true,

    rollupOptions: {
      input: {
        // 客户端入口文件
        client: resolve(__dirname, 'client/index.jsx'),
      },
      output: {
        // 输出格式
        format: 'es',
        // 生成的文件名格式
        entryFileNames: '[name].js',
        chunkFileNames: '[name]-[hash].js',
      },
    },
  },

  // 开发服务器配置（本项目不使用 Vite dev server）
  server: {
    port: 5173,
  },
})
