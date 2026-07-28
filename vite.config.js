import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  publicDir: 'public',
  resolve: {
    alias: {
      // New-site imports use "@/..." and always resolve inside src/.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    assetsDir: 'assets',
    copyPublicDir: true,
    rollupOptions: {
      // Multi-page build: "/" is the new site, "/old_web/" the archived one.
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        old_web: fileURLToPath(new URL('./old_web/index.html', import.meta.url)),
      },
      output: {
        assetFileNames: 'assets/[name][extname]'
      }
    }
  }
})
