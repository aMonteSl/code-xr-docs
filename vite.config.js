import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { ghPages } from 'vite-plugin-gh-pages'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: mode === 'deploy' ? [react(), ghPages()] : [react()],
  base: mode === 'development' ? '/' : '/code-xr-docs/',
  publicDir: 'public',
  build: {
    assetsDir: 'assets',
    copyPublicDir: true,
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name][extname]'
      }
    }
  }
}))
