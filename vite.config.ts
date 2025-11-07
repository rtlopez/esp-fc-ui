/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createHtmlPlugin } from 'vite-plugin-html'
import path from 'path'
import { copyFileSync, readFileSync } from 'fs'

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

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

// https://vitejs.dev/config/
export default defineConfig({
  base: '/esp-fc-ui/',
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
  define: {
    'import.meta.env.VITE_PKG_VERSION': JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
})
