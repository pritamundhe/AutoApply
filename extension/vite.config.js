import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs'

// Plugin to copy public/ manifest and scripts to dist/
const copyExtensionFiles = () => ({
  name: 'copy-extension-files',
  closeBundle() {
    // manifest.json
    copyFileSync('public/manifest.json', 'dist/manifest.json')
    // background.js
    copyFileSync('public/background.js', 'dist/background.js')
    // content.js
    copyFileSync('public/content.js', 'dist/content.js')
    // icons
    if (existsSync('public/icons')) {
      mkdirSync('dist/icons', { recursive: true })
      readdirSync('public/icons').forEach(file => {
        copyFileSync(`public/icons/${file}`, `dist/icons/${file}`)
      })
    }
    console.log('✅  Extension files copied to dist/')
  },
})

export default defineConfig({
  plugins: [react(), copyExtensionFiles()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'),
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
})
