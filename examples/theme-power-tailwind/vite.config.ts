import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import postcssConfig from './postcss.config.ts'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  css: {
    postcss: postcssConfig,
  },
})
