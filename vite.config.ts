/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createHtmlPlugin } from 'vite-plugin-html'
import path from 'path'
import { copyFileSync } from 'fs'

const copyIndexPlugin = {
  name: 'copy-index-to-404',
  closeBundle() {
    try {
      copyFileSync('dist/index.html', 'dist/404.html')
      console.log('Copy index.html to 404.html')
    } catch (err) {
      console.error('Copy index.html to 404.html failed:', err)
    }
  },
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    copyIndexPlugin,
    createHtmlPlugin({
      inject: {
        data: {
          GTM_ID: process.env.VITE_GTM_ID,
          IS_PRODUCTION: process.env.NODE_ENV === 'production',
          IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
        },
      },
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: '/esp-fc-ui/',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
})
