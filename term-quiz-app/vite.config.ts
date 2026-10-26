import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [vue(), viteSingleFile()],
  build: {
    // Inline tất cả assets vào HTML
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
  },
})
